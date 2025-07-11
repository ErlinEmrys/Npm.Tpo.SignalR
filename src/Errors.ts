﻿import { HttpTransportType } from "./ITransport";

/** Error that contains object explaining reason for this error */
export class ReasonedError extends Error
{
	public reason?: unknown;

	/** Constructs a new instance of {@link @microsoft/signalr.ReasonedError}.
	 *
	 * @param {string} message A descriptive error message.
	 * @param {object} reason Reason of this error
	 */
	constructor( message : string, reason: unknown )
	{
		super( message );
		this.reason = reason;
	}
}

/** Error thrown when an HTTP request fails. */
export class HttpError extends ReasonedError
{
	// @ts-ignore: Intentionally unused.
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private __proto__: Error;

	/** The HTTP status code represented by this error. */
	public statusCode: number;

	/** Constructs a new instance of {@link @microsoft/signalr.HttpError}.
	 *
	 * @param {string} errorMessage A descriptive error message.
	 * @param {number} statusCode The HTTP status code represented by this error.
	 * @param {object} reason Reason of this error
	 */
	constructor( errorMessage: string, statusCode: number, reason: unknown )
	{
		while( reason instanceof ReasonedError )
		{
			reason = reason.reason;
		}

		const trueProto = new.target.prototype;
		super( `${ errorMessage }: Status code '${ statusCode }'`, reason );
		this.statusCode = statusCode;

		// Workaround issue in Typescript compiler
		// https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
		this.__proto__ = trueProto;
	}
}

/** Error thrown when a timeout elapses. */
export class TimeoutError extends Error
{
	// @ts-ignore: Intentionally unused.
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private __proto__: Error;

	/** Constructs a new instance of {@link @microsoft/signalr.TimeoutError}.
	 *
	 * @param {string} errorMessage A descriptive error message.
	 */
	constructor( errorMessage: string = "A timeout occurred." )
	{
		const trueProto = new.target.prototype;
		super( errorMessage );

		// Workaround issue in Typescript compiler
		// https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
		this.__proto__ = trueProto;
	}
}

/** Error thrown when an action is aborted. */
export class AbortError extends Error
{
	// @ts-ignore: Intentionally unused.
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private __proto__: Error;

	/** Constructs a new instance of {@link AbortError}.
	 *
	 * @param {string} errorMessage A descriptive error message.
	 */
	constructor( errorMessage: string = "An abort occurred." )
	{
		const trueProto = new.target.prototype;
		super( errorMessage );

		// Workaround issue in Typescript compiler
		// https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
		this.__proto__ = trueProto;
	}
}

/** Error thrown when the selected transport is unsupported by the browser. */
/** @private */
export class UnsupportedTransportError extends Error
{
	// @ts-ignore: Intentionally unused.
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private __proto__: Error;

	/** The {@link @microsoft/signalr.HttpTransportType} this error occurred on. */
	public transport: HttpTransportType;

	/** The type name of this error. */
	public errorType: string;

	/** Constructs a new instance of {@link @microsoft/signalr.UnsupportedTransportError}.
	 *
	 * @param {string} message A descriptive error message.
	 * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
	 */
	constructor( message: string, transport: HttpTransportType )
	{
		const trueProto = new.target.prototype;
		super( message );
		this.transport = transport;
		this.errorType = "UnsupportedTransportError";

		// Workaround issue in Typescript compiler
		// https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
		this.__proto__ = trueProto;
	}
}

/** Error thrown when the selected transport is disabled by the browser. */
/** @private */
export class DisabledTransportError extends Error
{
	// @ts-ignore: Intentionally unused.
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private __proto__: Error;

	/** The {@link @microsoft/signalr.HttpTransportType} this error occurred on. */
	public transport: HttpTransportType;

	/** The type name of this error. */
	public errorType: string;

	/** Constructs a new instance of {@link @microsoft/signalr.DisabledTransportError}.
	 *
	 * @param {string} message A descriptive error message.
	 * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
	 */
	constructor( message: string, transport: HttpTransportType )
	{
		const trueProto = new.target.prototype;
		super( message );
		this.transport = transport;
		this.errorType = "DisabledTransportError";

		// Workaround issue in Typescript compiler
		// https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
		this.__proto__ = trueProto;
	}
}

/** Error thrown when the selected transport cannot be started. */
/** @private */
export class FailedToStartTransportError extends ReasonedError
{
	// @ts-ignore: Intentionally unused.
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private __proto__: Error;

	/** The {@link @microsoft/signalr.HttpTransportType} this error occurred on. */
	public transport: HttpTransportType;

	/** The type name of this error. */
	public errorType: string;

	/** Constructs a new instance of {@link @microsoft/signalr.FailedToStartTransportError}.
	 *
	 * @param {string} message A descriptive error message.
	 * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
	 * @param {object} reason Reason of this error
	 */
	constructor( message: string, transport: HttpTransportType, reason: unknown )
	{
		while( reason instanceof ReasonedError )
		{
			reason = reason.reason;
		}

		const trueProto = new.target.prototype;
		super( message, reason );
		this.transport = transport;
		this.errorType = "FailedToStartTransportError";

		// Workaround issue in Typescript compiler
		// https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
		this.__proto__ = trueProto;
	}
}

/** Error thrown when the negotiation with the server failed to complete. */
/** @private */
export class FailedToNegotiateWithServerError extends ReasonedError
{
	// @ts-ignore: Intentionally unused.
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private __proto__: Error;

	/** The type name of this error. */
	public errorType: string;

	public isError: boolean;

	/** Constructs a new instance of {@link @microsoft/signalr.FailedToNegotiateWithServerError}.
	 *
	 * @param {string} message A descriptive error message.
	 * @param {object} reason Reason of this error
	 * @param {boolean} isError If the error is unrecoverable
	 */
	constructor( message: string, reason: unknown, isError: boolean )
	{
		while( reason instanceof ReasonedError )
		{
			reason = reason.reason;
		}

		const trueProto = new.target.prototype;
		super( message, reason );
		this.errorType = "FailedToNegotiateWithServerError";
		this.isError = isError;

		// Workaround issue in Typescript compiler
		// https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
		this.__proto__ = trueProto;
	}
}

/** Error thrown when multiple errors have occurred. */
/** @private */
export class AggregateErrors extends Error
{
	// @ts-ignore: Intentionally unused.
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private __proto__: Error;

	/** The collection of errors this error is aggregating. */
	public innerErrors: Error[];

	/** Constructs a new instance of {@link @microsoft/signalr.AggregateErrors}.
	 *
	 * @param {string} message A descriptive error message.
	 * @param {Error[]} innerErrors The collection of errors this error is aggregating.
	 */
	constructor( message: string, innerErrors: Error[] )
	{
		const trueProto = new.target.prototype;
		super( message );

		this.innerErrors = innerErrors;

		// Workaround issue in Typescript compiler
		// https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
		this.__proto__ = trueProto;
	}
}
