const webpack = require('webpack')
const path = require('path')
const nodeExternals = require('webpack-node-externals');
const rootPath = process.cwd()
const gulpFunc = require('./gulpfile')

const { merge } = require('webpack-merge')

const { formatArgs } = require('./lib/utils')
const finalConfig = formatArgs(process.argv)
const {
  userFolder,
  buildFolder,
  currentEnv
} = finalConfig

const customWebpackPath = path.resolve(userFolder, 'llscw.ssr.config.js')
const customWebpackConfig = require(customWebpackPath)({ userFolder, buildFolder, currentEnv })

const {
  webpackConfig,
} = customWebpackConfig

const finalWebpackConfig = merge(require("./webpack.common")({ ...finalConfig }), {
  mode: "production",
  entry: ['./server/index.jsx'],
  output: {
    path: path.resolve(rootPath, "dist"),
    filename: "server.js",
    publicPath: '/', // 服务器脚本会用到
    libraryTarget: 'commonjs2',
  },
  target: "node",
  externals: [nodeExternals()],
  module: {
    rules: [
    ],
  },
  plugins: [
  ]
}, webpackConfig)

// module.exports = webpackConfig
gulpFunc(() =>
webpack(finalWebpackConfig, (err, stats) => {
  if (err) {
    console.error("Compilication failed.")
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    process.exit(1);
    return;
  }
  const info = stats.toJson();
  if (stats.hasErrors()) {
    let hasBuildError = false;

    // 只要有一个不是来自 uglify 的问题
    for (let i = 0, len = info.errors.length; i < len; i++) {
      if (!/from\s*UglifyJs/i.test(info.errors[i])) {
        hasBuildError = true;
        break;
      }
    }
    if (hasBuildError) {
      // logUtil.error("Compilication failed.")
      console.log(info.errors);

      process.exit(1);
    }
  }
  if (stats.hasWarnings()) {
    // logUtil.warn(info.warnings)
    console.warn(info.warnings);
  }
})
)