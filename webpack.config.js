const baseConfig = require( "./webpack.config.base" );
module.exports = env => baseConfig( __dirname, "signalr", {
	// These are only used in Node environments
	// so we tell webpack not to pull them in for the browser
	target: env && env.platform ? env.platform : undefined, platformDist: env && env.platform ? env.platform : undefined, externals: [ "ws", "eventsource", "node-fetch", "abort-controller", "fetch-cookie" ],
} );