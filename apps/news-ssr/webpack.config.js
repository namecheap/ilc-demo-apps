const path = require('path');
const webpack = require('webpack');

const nodeExternals = require('webpack-node-externals');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');
const WrapperPlugin = require('wrapper-webpack-plugin');
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const wpModule = {
	noParse: /es6-promise\.js$/,
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

module.exports = [{ //client
	mode: process.env.NODE_ENV,
	devtool: 'source-map',
	output: {
		path: path.resolve(__dirname, './dist'),
		publicPath: 'http://127.0.0.1:8239/dist/',
		libraryTarget: 'amd',
		filename: 'single_spa.js'
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
		new WrapperPlugin({
			test: /\.js$/, // only wrap output of bundle files with '.js' extension
			header: '(function(define){\n',
			footer: '\n})((window.ILC && window.ILC.define) || window.define);'
		}),
	]
},{ //server
	mode: process.env.NODE_ENV,
	devtool: 'source-map',
	entry: './src/entry-server.js',
	target: 'node',
	output: {
		path: path.resolve(__dirname, './dist'),
		publicPath: 'http://127.0.0.1:8239/dist/',
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
		new VueSSRServerPlugin()
	]
}];
