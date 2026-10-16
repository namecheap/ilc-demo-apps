const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const ilcWebpackPluginsFactory = require('ilc-sdk').WebpackPluginsFactory;

module.exports = {
    entry: path.resolve(__dirname, 'src/planets.js'),
    output: {
        filename: 'planets.js',
        libraryTarget: 'system',
        path: path.resolve(__dirname, 'build'),
        chunkLoadingGlobal: 'wpPlanetsApp', // We need this to avoid conflicts of on-demand chunks in the global namespace
        devtoolNamespace: 'planetsApp',
        clean: true,
    },
    mode: 'production',
    module: {
        // System.register output: leave System.* calls in the source alone (JavaScript modules only).
        parser: { javascript: { system: false } },
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.js$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                loader: 'babel-loader',
            },
            {
                test: /\.css$/,
                // Client-only app, so style-loader can replace vue-style-loader (which is only needed for SSR).
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [new VueLoaderPlugin(), ...ilcWebpackPluginsFactory().client],
    // vue-loader 15 imports every <style> block as `import styleN from ...` but only reads styleN for CSS modules;
    // with webpack 5 that unused default import of scoped/plain styles is reported. The CSS is still injected.
    ignoreWarnings: [/export 'default' \(imported as 'style\d+'\) was not found/],
    devtool: 'source-map',
    externals: [/^@portal\/*/, /^single-spa$/, /^rxjs\/?.*$/],
};
