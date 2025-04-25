import { AbortController } from "../src/AbortController";
import { registerUnhandledRejectionHandler } from "./Utils";

registerUnhandledRejectionHandler();

describe( "AbortSignal", () =>
{
	describe( "aborted", () =>
	{
		it( "is false on initialization", () =>
		{
			expect( new AbortController().signal.aborted ).toBe( false );
		} );

		it( "is true when aborted", () =>
		{
			const controller = new AbortController();
			const signal = controller.signal;
			controller.abort();
			expect( signal.aborted ).toBe( true );
		} );
	} );

	describe( "onabort", () =>
	{
		it( "is called when abort is called", () =>
		{
			const controller = new AbortController();
			const signal = controller.signal;
			let abortCalled = false;
			signal.onabort = () => abortCalled = true;
			controller.abort();
			expect( abortCalled ).toBe( true );
		} );
	} );
} );
