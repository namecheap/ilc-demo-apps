const path = require('path');

const nodeExternals = require('webpack-node-externals');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;

const wpModule = {
	noParse: /es6-promise\.js$/,
	// System.register output: leave System.* calls in the source alone (JavaScript modules only).
	parser: { javascript: { system: false } },
	rules: [
		{
			test: /\.vue$/,
			loader: 'vue-loader',
		},
		{
			test: /\.js$/,
			loader: 'babel-loader',
			exclude: /node_modules/
		},
		{
			test: /\.(png|jpg|gif|svg)$/,
			type: 'asset/resource',
			generator: {
				filename: '[name][ext]?[hash]',
			},
		},
		{
			test: /\.css$/,
			use: [
				process.env.NODE_ENV !== 'production'
					? 'vue-style-loader'
					: MiniCssExtractPlugin.loader,
				{
					loader: 'css-loader',
					// vue-style-loader expects css-loader's CommonJS output
					options: { esModule: process.env.NODE_ENV === 'production' },
				},
			]
		}
	]
};

const commonPlugins = [
	new VueLoaderPlugin(),
	new MiniCssExtractPlugin({
		filename: `common.[contenthash].css`
	})
];

// vue-loader 15 imports every <style> block as `import styleN from ...` but only reads styleN for CSS modules;
// with webpack 5 that unused default import of scoped/plain styles is reported. The CSS is still extracted.
const ignoreWarnings = [/export 'default' \(imported as 'style\d+'\) was not found/];

const ilcWebpackPlugins = ilcWebpackPluginsFactory({
	publicPathDetection: {
		ssrPublicPath: require('../publicPathTpl')(require('./PORT.json'))
	}
});

module.exports = [{ //client
	mode: process.env.NODE_ENV,
	devtool: 'source-map',
	output: {
		path: path.resolve(__dirname, './dist'),
		libraryTarget: 'system',
		filename: 'single_spa.js',
		chunkLoadingGlobal: 'wpNewsSSR', // We need this to avoid conflicts of on-demand chunks in the global namespace
		devtoolNamespace: 'NewsSSR',
	},
	entry: {
		app: './src/entry-client-spa.js'
	},
	resolve: {
		alias: {
			public: path.resolve(__dirname, './public'),
			'axios-client': './axios-client.js'
		}
	},
	module: wpModule,
	ignoreWarnings,
	plugins: [
		...commonPlugins,
		new VueSSRClientPlugin({
			filename: 'vue-ssr-client-manifest-spa.json'
		}),
		...ilcWebpackPlugins.client,
	]
},{ //server
	mode: process.env.NODE_ENV,
	devtool: 'source-map',
	entry: './src/entry-server.js',
	target: 'node',
	output: {
		path: path.resolve(__dirname, './dist'),
		filename: 'server-bundle.js',
		libraryTarget: 'commonjs2'
	},
	resolve: {
		alias: {
			public: path.resolve(__dirname, './public'),
			'axios-client': './axios-server.js'
		}
	},
	module: wpModule,
	ignoreWarnings,
	externals: nodeExternals({
		allowlist: /\.css$/
	}),
	plugins: [
		...commonPlugins,
		new VueSSRServerPlugin(),
		...ilcWebpackPlugins.server
	]
}];
