const json = require("@rollup/plugin-json");
const typescript = require("@rollup/plugin-typescript");
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const { cleandir } = require("rollup-plugin-cleandir");
const copy = require('rollup-plugin-copy');
const html = require('rollup-plugin-html');

module.exports = {
  /** 打包入口文件 */
  input: ["./src/index.ts"],
  output: {
    dir: "./esm",
    format: "esm",
  },
  plugins: [
    /** 配置插件 - 每次打包清除目标文件 */
    cleandir("./esm"),
    /** 配置插件 - 将json转换为ES6模块 */
    json(),
    /** 配置插件 - 将json转换为ES6模块 */
    typescript({
      module: "esnext",
      exclude: ["./node_modules/**"],
      compilerOptions: {
        rootDir: "./src",
        outDir: './esm',
        declarationDir: "./esm"
      }
    }),
    resolve.default({
      extensions: [".js", ".ts", ".json"],
      modulesOnly: true,
      preferredBuiltins: false,
    }),
    commonjs({ extensions: [".js", ".ts", ".json"] }),
    copy({
      targets: [
        { src: 'src/index.css', dest: 'esm' }
      ]
    }),
    html({
			include: '**/*.html'
		})
  ],
};
