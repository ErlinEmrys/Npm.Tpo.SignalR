import { DefaultReconnectPolicy } from "./DefaultReconnectPolicy";
import { HttpConnection } from "./HttpConnection";
import { HubConnection } from "./HubConnection";
import { IHttpConnectionOptions } from "./IHttpConnectionOptions";
import { IHubProtocol } from "./IHubProtocol";
import { ILog } from "@erlinemrys/lib.common";
import { IRetryPolicy } from "./IRetryPolicy";
import { IStatefulReconnectOptions } from "./IStatefulReconnectOptions";
import { HttpTransportType } from "./ITransport";
import { JsonHubProtocol } from "./JsonHubProtocol";
import { Arg } from "./Utils";
import { NullLogger } from "@erlinemrys/lib.common";

/** A builder for configuring {@link @microsoft/signalr.HubConnection} instances. */
export class HubConnectionBuilder
{
	private _serverTimeoutInMilliseconds?: number;
	private _keepAliveIntervalInMilliseconds ?: number;

	/** @internal */
	public protocol?: IHubProtocol;
	/** @internal */
	public httpConnectionOptions?: IHttpConnectionOptions;
	/** @internal */
	public url?: string;
	/** @internal */
	public logger?: ILog;

	/** If defined, this indicates the client should automatically attempt to reconnect if the connection is lost. */
	/** @internal */
	public reconnectPolicy?: IRetryPolicy;

	private _statefulReconnectBufferSize?: number;

	/** Configures custom logging for the {@link @microsoft/signalr.HubConnection}.
	 *
	 * @param {ILog} logger An object implementing the {@link @microsoft/signalr.ILogger} interface, which will be used to write all log messages.
	 * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
	 */
	public configureLogging( logger?: ILog ): HubConnectionBuilder
	{
		Arg.isRequired( logger, "logger" );

		this.logger = logger;
		return this;
	}

	/** Configures the {@link @microsoft/signalr.HubConnection} to use HTTP-based transports to connect to the specified URL.
	 *
	 * The transport will be selected automatically based on what the server and client support.
	 *
	 * @param {string} url The URL the connection will use.
	 * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
	 */
	public withUrl( url: string ): HubConnectionBuilder;

	/** Configures the {@link @microsoft/signalr.HubConnection} to use the specified HTTP-based transport to connect to the specified URL.
	 *
	 * @param {string} url The URL the connection will use.
	 * @param {HttpTransportType} transportType The specific transport to use.
	 * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
	 */
	public withUrl( url: string, transportType: HttpTransportType ): HubConnectionBuilder;

	/** Configures the {@link @microsoft/signalr.HubConnection} to use HTTP-based transports to connect to the specified URL.
	 *
	 * @param {string} url The URL the connection will use.
	 * @param {IHttpConnectionOptions} options An options object used to configure the connection.
	 * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
	 */
	public withUrl( url: string, options: IHttpConnectionOptions ): HubConnectionBuilder;
	public withUrl( url: string, transportTypeOrOptions?: IHttpConnectionOptions | HttpTransportType ): HubConnectionBuilder
	{
		Arg.isRequired( url, "url" );
		Arg.isNotEmpty( url, "url" );

		this.url = url;

		// Flow-typing knows where it's at. Since HttpTransportType is a number and IHttpConnectionOptions is guaranteed
		// to be an object, we know (as does TypeScript) this comparison is all we need to figure out which overload was called.
		if( typeof transportTypeOrOptions === "object" )
		{
			this.httpConnectionOptions = { ...this.httpConnectionOptions, ...transportTypeOrOptions };
		}
		else
		{
			this.httpConnectionOptions = {
				...this.httpConnectionOptions, transport: transportTypeOrOptions,
			};
		}

		return this;
	}

	/** Configures the {@link @microsoft/signalr.HubConnection} to use the specified Hub Protocol.
	 *
	 * @param {IHubProtocol} protocol The {@link @microsoft/signalr.IHubProtocol} implementation to use.
	 */
	public withHubProtocol( protocol: IHubProtocol ): HubConnectionBuilder
	{
		Arg.isRequired( protocol, "protocol" );

		this.protocol = protocol;
		return this;
	}

	/** Configures the {@link @microsoft/signalr.HubConnection} to automatically attempt to reconnect if the connection is lost.
	 * By default, the client will wait 0, 2, 10 and 30 seconds respectively before trying up to 4 reconnect attempts.
	 */
	public withAutomaticReconnect(): HubConnectionBuilder;

	/** Configures the {@link @microsoft/signalr.HubConnection} to automatically attempt to reconnect if the connection is lost.
	 *
	 * @param {number[]} retryDelays An array containing the delays in milliseconds before trying each reconnect attempt.
	 * The length of the array represents how many failed reconnect attempts it takes before the client will stop attempting to reconnect.
	 */
	public withAutomaticReconnect( retryDelays: number[] ): HubConnectionBuilder;

	/** Configures the {@link @microsoft/signalr.HubConnection} to automatically attempt to reconnect if the connection is lost.
	 *
	 * @param {IRetryPolicy} reconnectPolicy An {@link @microsoft/signalR.IRetryPolicy} that controls the timing and number of reconnect attempts.
	 */
	public withAutomaticReconnect( reconnectPolicy: IRetryPolicy ): HubConnectionBuilder;
	public withAutomaticReconnect( retryDelaysOrReconnectPolicy?: number[] | IRetryPolicy ): HubConnectionBuilder
	{
		if( this.reconnectPolicy )
		{
			throw new Error( "A reconnectPolicy has already been set." );
		}

		if( !retryDelaysOrReconnectPolicy )
		{
			this.reconnectPolicy = new DefaultReconnectPolicy();
		}
		else if( Array.isArray( retryDelaysOrReconnectPolicy ) )
		{
			this.reconnectPolicy = new DefaultReconnectPolicy( retryDelaysOrReconnectPolicy );
		}
		else
		{
			this.reconnectPolicy = retryDelaysOrReconnectPolicy;
		}

		return this;
	}

	/** Configures {@link @microsoft/signalr.HubConnection.serverTimeoutInMilliseconds} for the {@link @microsoft/signalr.HubConnection}.
	 *
	 * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
	 */
	public withServerTimeout( milliseconds: number ): HubConnectionBuilder
	{
		Arg.isRequired( milliseconds, "milliseconds" );

		this._serverTimeoutInMilliseconds = milliseconds;

		return this;
	}

	/** Configures {@link @microsoft/signalr.HubConnection.keepAliveIntervalInMilliseconds} for the {@link @microsoft/signalr.HubConnection}.
	 *
	 * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
	 */
	public withKeepAliveInterval( milliseconds: number ): HubConnectionBuilder
	{
		Arg.isRequired( milliseconds, "milliseconds" );

		this._keepAliveIntervalInMilliseconds = milliseconds;

		return this;
	}

	/** Enables and configures options for the Stateful Reconnect feature.
	 *
	 * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
	 */
	public withStatefulReconnect( options?: IStatefulReconnectOptions ): HubConnectionBuilder
	{
		if( this.httpConnectionOptions === undefined )
		{
			this.httpConnectionOptions = {};
		}
		this.httpConnectionOptions._useStatefulReconnect = true;

		this._statefulReconnectBufferSize = options?.bufferSize;

		return this;
	}

	/** Creates a {@link @microsoft/signalr.HubConnection} from the configuration options specified in this builder.
	 *
	 * @returns {HubConnection} The configured {@link @microsoft/signalr.HubConnection}.
	 */
	public build(): HubConnection
	{
		// If httpConnectionOptions has a logger, use it. Otherwise, override it with the one
		// provided to configureLogger
		const httpConnectionOptions = this.httpConnectionOptions || {};

		// If it's 'null', the user **explicitly** asked for null, don't mess with it.
		if( httpConnectionOptions.logger === undefined )
		{
			// If our logger is undefined or null, that's OK, the HttpConnection constructor will handle it.
			httpConnectionOptions.logger = this.logger;
		}

		// Now create the connection
		if( !this.url )
		{
			throw new Error( "The 'HubConnectionBuilder.withUrl' method must be called before building the connection." );
		}
		const connection = new HttpConnection( this.url, httpConnectionOptions );

		return HubConnection.create( connection, this.logger || NullLogger.Instance, this.protocol || new JsonHubProtocol(), this.reconnectPolicy, this._serverTimeoutInMilliseconds, this._keepAliveIntervalInMilliseconds, this._statefulReconnectBufferSize );
	}
}
