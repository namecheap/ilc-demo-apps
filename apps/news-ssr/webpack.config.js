const path = require('path');
const webpack = require('webpack');

const nodeExternals = require('webpack-node-externals');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;

const wpModule = {
	noParse: /es6-promise\.js$/,
	rules: [
		{parser: {system: false}},
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
			loader: 'file-loader',
			options: {
				name: '[name].[ext]?[hash]',
			}
		},
		{
			test: /\.css$/,
			use: [
				process.env.NODE_ENV !== 'production'
					? 'vue-style-loader'
					: MiniCssExtractPlugin.loader,
				'css-loader'
			]
		}
	]
};

const commonPlugins = [
	new VueLoaderPlugin(),
	new webpack.optimize.ModuleConcatenationPlugin(),
	new MiniCssExtractPlugin({
		filename: `common.[chunkhash].css`
	})
];

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
		jsonpFunction: 'wpNewsSSR', // We need this to avoid conflicts of on-demand chunks in the global namespace
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
	externals: nodeExternals({
		whitelist: /\.css$/
	}),
	plugins: [
		...commonPlugins,
		new VueSSRServerPlugin(),
		...ilcWebpackPlugins.server
	]
}];
