// Mirrors webpack's raw-loader / asset/source: the file becomes a string default export.
module.exports = {
    process(src) {
        return { code: `module.exports = ${JSON.stringify(src)}; module.exports.default = module.exports;` };
    },
};
