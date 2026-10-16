// Jest transformer for Vue 2 single-file components. It uses the compiler of the app the component belongs to:
// vue/compiler-sfc for Vue 2.7, vue-template-compiler + @vue/component-compiler-utils for older Vue 2.
// The <script> block goes through babel-jest (so it is instrumented for coverage with its original line numbers)
// and the compiled render functions are attached to the exported component options. Styles are ignored.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const babelJest = require('babel-jest').default;

const ownSource = fs.readFileSync(__filename);

const babelTransformer = babelJest.createTransformer({
    configFile: path.join(__dirname, '..', 'babel.config.js'),
    babelrc: false,
});

function appRootOf(filename) {
    const match = filename.match(/^(.*[\\/]apps[\\/][^\\/]+)[\\/]/);
    if (!match) {
        throw new Error(`Cannot determine the app of ${filename}`);
    }
    return match[1];
}

function loadCompiler(appRoot) {
    const fromApp = (id) => require(require.resolve(id, { paths: [appRoot] }));
    const [major, minor] = fromApp('vue/package.json').version.split('.').map(Number);
    if (major === 2 && minor >= 7) {
        const sfc = fromApp('vue/compiler-sfc');
        return {
            parse: (source, filename) => sfc.parse({ source, filename }),
            compileTemplate: (source, filename) => sfc.compileTemplate({ source, filename }),
        };
    }
    const compiler = fromApp('vue-template-compiler');
    const utils = fromApp('@vue/component-compiler-utils');
    return {
        // no padding: like compiler-sfc, return the script as written (process() restores its line offset)
        parse: (source, filename) => utils.parse({ source, filename, compiler, compilerParseOptions: {}, needMap: false }),
        compileTemplate: (source, filename) => utils.compileTemplate({ source, filename, compiler, prettify: false }),
    };
}

module.exports = {
    // Jest's default cache key would ignore changes to this transformer
    getCacheKey(src, filename, options) {
        return crypto
            .createHash('sha1')
            .update(ownSource)
            .update(babelTransformer.getCacheKey(src, filename, options))
            .digest('hex');
    },

    process(src, filename, options) {
        const { parse, compileTemplate } = loadCompiler(appRootOf(filename));
        const descriptor = parse(src, filename);

        let script = 'export default {}';
        if (descriptor.script) {
            // keep the script's line numbers so coverage points at the right lines of the .vue file
            const offsetLines = src.slice(0, descriptor.script.start).split('\n').length - 1;
            script = '\n'.repeat(offsetLines) + descriptor.script.content;
        }
        const { code } = babelTransformer.process(script, filename, options);

        let render = '';
        if (descriptor.template) {
            const compiled = compileTemplate(descriptor.template.content, filename);
            if (compiled.errors && compiled.errors.length) {
                throw new Error(`Template errors in ${filename}:\n${compiled.errors.join('\n')}`);
            }
            render = `
;(function () {
    ${compiled.code}
    var component = module.exports.__esModule ? module.exports.default : module.exports;
    component.render = render;
    component.staticRenderFns = staticRenderFns;
})();`;
        }
        return { code: code + render };
    },
};
