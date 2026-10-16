// Used for every app's sources under test (the apps' own .babelrc files are ignored: they target browsers and,
// in news-ssr, Babel 6). Node can run modern syntax, so only modules, JSX and legacy decorators are transformed.
module.exports = {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-react'],
    plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
    overrides: [
        {
            // react-css-modules (people) wraps components in an ES5 subclass, which cannot extend a native class;
            // the app's own build compiles classes to ES5
            test: /[\\/]apps[\\/]people[\\/]src[\\/]/,
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: { node: 'current' },
                        include: ['@babel/plugin-transform-classes', '@babel/plugin-transform-class-properties'],
                    },
                ],
            ],
        },
    ],
};
