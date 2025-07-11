import { AbortError, HttpError, TimeoutError } from "./Errors";
import { HttpClient, HttpRequest, HttpResponse } from "./HttpClient";
import { ILog } from "@erlinemrys/lib.common";
import { isArrayBuffer } from "./Utils";

export class XhrHttpClient extends HttpClient
{
	private readonly _logger: ILog;

	public constructor( logger: ILog )
	{
		super();
		this._logger = logger;
	}

	/** @inheritDoc */
	public send( request: HttpRequest ): Promise<HttpResponse>
	{
		// Check that abort was not signaled before calling send
		if( request.abortSignal && request.abortSignal.aborted )
		{
			return Promise.reject( new AbortError() );
		}

		if( !request.method )
		{
			return Promise.reject( new Error( "No method defined." ) );
		}
		if( !request.url )
		{
			return Promise.reject( new Error( "No url defined." ) );
		}

		return new Promise<HttpResponse>( ( resolve, reject ) =>
		{
			const xhr = new XMLHttpRequest();

			xhr.open( request.method!, request.url!, true );
			xhr.withCredentials = request.withCredentials === undefined ? true : request.withCredentials;
			xhr.setRequestHeader( "X-Requested-With", "XMLHttpRequest" );
			if( request.content === "" )
			{
				request.content = undefined;
			}
			if( request.content )
			{
				// Explicitly setting the Content-Type header for React Native on Android platform.
				if( isArrayBuffer( request.content ) )
				{
					xhr.setRequestHeader( "Content-Type", "application/octet-stream" );
				}
				else
				{
					xhr.setRequestHeader( "Content-Type", "text/plain;charset=UTF-8" );
				}
			}

			const headers = request.headers;
			if( headers )
			{
				Object.keys( headers )
						.forEach( ( header ) =>
						{
							xhr.setRequestHeader( header, headers[ header ] );
						} );
			}

			if( request.responseType )
			{
				xhr.responseType = request.responseType;
			}

			if( request.abortSignal )
			{
				request.abortSignal.onabort = () =>
				{
					xhr.abort();
					reject( new AbortError() );
				};
			}

			if( request.timeout )
			{
				xhr.timeout = request.timeout;
			}

			xhr.onload = () =>
			{
				if( request.abortSignal )
				{
					request.abortSignal.onabort = null;
				}

				if( xhr.status >= 200 && xhr.status < 300 )
				{
					resolve( new HttpResponse( xhr.status, xhr.statusText, xhr.response || xhr.responseText ) );
				}
				else
				{
					reject( new HttpError( xhr.response || xhr.responseText || xhr.statusText, xhr.status, xhr.response ) );
				}
			};

			xhr.onerror = () =>
			{
				this._logger.Wrn( `Error from HTTP request. ${ xhr.status }: ${ xhr.statusText }.` );
				reject( new HttpError( xhr.statusText, xhr.status, xhr.response ) );
			};

			xhr.ontimeout = () =>
			{
				this._logger.Wrn( `Timeout from HTTP request.` );
				reject( new TimeoutError() );
			};

			xhr.send( request.content );
		} );
	}
}
