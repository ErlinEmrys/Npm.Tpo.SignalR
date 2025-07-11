import { AbortController } from "./AbortController";
import { HttpError, TimeoutError } from "./Errors";
import { HttpClient, HttpRequest } from "./HttpClient";
import { ILog } from "@erlinemrys/lib.common";
import { ITransport, TransferFormat } from "./ITransport";
import { Arg, getDataDetail, getUserAgentHeader, sendMessage } from "./Utils";
import { IHttpConnectionOptions } from "./IHttpConnectionOptions";

// Not exported from 'index', this type is internal.
/** @private */
export class LongPollingTransport implements ITransport
{
	private readonly _httpClient: HttpClient;
	private readonly _logger: ILog;
	private readonly _options: IHttpConnectionOptions;
	private readonly _pollAbort: AbortController;

	private _url?: string;
	private _running: boolean;
	private _receiving?: Promise<void>;
	private _closeError?: Error | unknown;

	public onreceive: ( ( data: string | ArrayBuffer ) => void ) | null;
	public onclose: ( ( error?: Error | unknown ) => void ) | null;

	// This is an internal type, not exported from 'index' so this is really just internal.
	public get pollAborted(): boolean
	{
		return this._pollAbort.aborted;
	}

	constructor( httpClient: HttpClient, logger: ILog, options: IHttpConnectionOptions )
	{
		this._httpClient = httpClient;
		this._logger = logger;
		this._pollAbort = new AbortController();
		this._options = options;

		this._running = false;

		this.onreceive = null;
		this.onclose = null;
	}

	public async connect( url: string, transferFormat: TransferFormat ): Promise<void>
	{
		Arg.isRequired( url, "url" );
		Arg.isRequired( transferFormat, "transferFormat" );
		Arg.isIn( transferFormat, TransferFormat, "transferFormat" );

		this._url = url;

		this._logger.Trc( "(LongPolling transport) Connecting." );

		// Allow binary format on Node and Browsers that support binary content (indicated by the presence of responseType property)
		if( transferFormat === TransferFormat.Binary && ( typeof XMLHttpRequest !== "undefined" && typeof new XMLHttpRequest().responseType !== "string" ) )
		{
			throw new Error( "Binary protocols over XmlHttpRequest not implementing advanced features are not supported." );
		}

		const [ name, value ] = getUserAgentHeader();
		const headers = { [ name ]: value, ...this._options.headers };

		const pollOptions: HttpRequest = {
			abortSignal: this._pollAbort.signal, headers, timeout: 100000, withCredentials: this._options.withCredentials,
		};

		if( transferFormat === TransferFormat.Binary )
		{
			pollOptions.responseType = "arraybuffer";
		}

		// Make initial long polling request
		// Server uses first long polling request to finish initializing connection and it returns without data
		const pollUrl = `${ url }&_=${ Date.now() }`;
		this._logger.Trc( `(LongPolling transport) polling: ${ pollUrl }.` );
		const response = await this._httpClient.get( pollUrl, pollOptions );
		if( response.statusCode !== 200 )
		{
			this._logger.Err( `(LongPolling transport) Unexpected response code: ${ response.statusCode }.` );

			// Mark running as false so that the poll immediately ends and runs the close logic
			this._closeError = new HttpError( response.statusText || "", response.statusCode, response );
			this._running = false;
		}
		else
		{
			this._running = true;
		}

		this._receiving = this._poll( this._url, pollOptions );
	}

	private async _poll( url: string, pollOptions: HttpRequest ): Promise<void>
	{
		try
		{
			while( this._running )
			{
				try
				{
					const pollUrl = `${ url }&_=${ Date.now() }`;
					this._logger.Trc( `(LongPolling transport) polling: ${ pollUrl }.` );
					const response = await this._httpClient.get( pollUrl, pollOptions );

					if( response.statusCode === 204 )
					{
						this._logger.Inf( "(LongPolling transport) Poll terminated by server." );

						this._running = false;
					}
					else if( response.statusCode !== 200 )
					{
						this._logger.Err( `(LongPolling transport) Unexpected response code: ${ response.statusCode }.` );

						// Unexpected status code
						this._closeError = new HttpError( response.statusText || "", response.statusCode, response );
						this._running = false;
					}
					else
					{
						// Process the response
						if( response.content )
						{
							this._logger.Trc( `(LongPolling transport) data received. ${ getDataDetail( response.content, this._options.logMessageContent! ) }.` );
							if( this.onreceive )
							{
								this.onreceive( response.content );
							}
						}
						else
						{
							// This is another way timeout manifest.
							this._logger.Trc( "(LongPolling transport) Poll timed out, reissuing." );
						}
					}
				}
				catch( e )
				{
					if( !this._running )
					{
						// Log but disregard errors that occur after stopping
						this._logger.Trc( `(LongPolling transport) Poll errored after shutdown: ${ ( e as any ).message }` );
					}
					else
					{
						if( e instanceof TimeoutError )
						{
							// Ignore timeouts and reissue the poll.
							this._logger.Trc( "(LongPolling transport) Poll timed out, reissuing." );
						}
						else
						{
							// Close the connection with the error as the result.
							this._closeError = e;
							this._running = false;
						}
					}
				}
			}
		}
		finally
		{
			this._logger.Trc( "(LongPolling transport) Polling complete." );

			// We will reach here with pollAborted==false when the server returned a response causing the transport to stop.
			// If pollAborted==true then client initiated the stop and the stop method will raise the close event after DELETE is sent.
			if( !this.pollAborted )
			{
				this._raiseOnClose();
			}
		}
	}

	public async send( data: any ): Promise<void>
	{
		if( !this._running )
		{
			return Promise.reject( new Error( "Cannot send until the transport is connected" ) );
		}
		return sendMessage( this._logger, "LongPolling", this._httpClient, this._url!, data, this._options );
	}

	public async stop(): Promise<void>
	{
		this._logger.Trc( "(LongPolling transport) Stopping polling." );

		// Tell receiving loop to stop, abort any current request, and then wait for it to finish
		this._running = false;
		this._pollAbort.abort();

		try
		{
			await this._receiving;

			// Send DELETE to clean up long polling on the server
			this._logger.Trc( `(LongPolling transport) sending DELETE request to ${ this._url }.` );

			const headers: { [ k: string ]: string } = {};
			const [ name, value ] = getUserAgentHeader();
			headers[ name ] = value;

			const deleteOptions: HttpRequest = {
				headers: { ...headers, ...this._options.headers }, timeout: this._options.timeout, withCredentials: this._options.withCredentials,
			};

			let error;
			try
			{
				await this._httpClient.delete( this._url!, deleteOptions );
			}
			catch( err )
			{
				error = err;
			}

			if( error )
			{
				if( error instanceof HttpError )
				{
					if( error.statusCode === 404 )
					{
						this._logger.Trc( "(LongPolling transport) A 404 response was returned from sending a DELETE request." );
					}
					else
					{
						this._logger.Trc( `(LongPolling transport) Error sending a DELETE request: ${ error }` );
					}
				}
			}
			else
			{
				this._logger.Trc( "(LongPolling transport) DELETE request accepted." );
			}

		}
		finally
		{
			this._logger.Trc( "(LongPolling transport) Stop finished." );

			// Raise close event here instead of in polling
			// It needs to happen after the DELETE request is sent
			this._raiseOnClose();
		}
	}

	private _raiseOnClose()
	{
		if( this.onclose )
		{
			let logMessage = "(LongPolling transport) Firing onclose event.";
			if( this._closeError )
			{
				logMessage += " Error: " + this._closeError;
			}
			this._logger.Trc( logMessage );
			this.onclose( this._closeError );
		}
	}
}
