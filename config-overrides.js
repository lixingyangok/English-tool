/*
 * @Author: 李星阳
 * @Date: 2020-06-30 11:39:59
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-05-25 19:48:43
 * @Description: 
 */
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const customizeCra = require('customize-cra');
const {
	override, overrideDevServer, fixBabelImports,
	// addLessLoader, addPostcssPlugins,
} = customizeCra;


// 打包配置
const addCustomize = () => config => {
	if (process.env.NODE_ENV !== 'production') return config;
	config.devtool = false; // 关闭sourceMap
	// config.output.path = __dirname + '../dist/demo/'; // 配置打包后的文件位置
	// config.output.publicPath = './demo';
	config.plugins.push( // 添加js打包gzip配置
		new CompressionWebpackPlugin({
			filename: '[path].gz[query]',
			algorithm: 'gzip',
			test: new RegExp(`\\.(${['js', 'css'].join('|')})$`),
			threshold: 1024 * 10,
			minRatio: 0.8,
			deleteOriginalAssets: false,
		}),
	)
	return config;
}

// 跨域配置
const devServerConfig = () => config => {
	const proxy = {
		'/api': {
			// target: 'http://localhost:2020',
			target: 'http://hahaxuexi.com',
			changeOrigin: true,
			pathRewrite: {'^/api': '/api'},
		},
	};
	return {
		...config,
		proxy,
		open: true, //自动打开
		port: 1234, //默认端口
		compress: true,
	};
};

module.exports = {
	webpack: override(
		// ▼ fixBabelImports 用于按需加载 antd 库（但是需要提前安装包 npm i babel-plugin-import
		fixBabelImports('import', {
			libraryName: 'antd',
			style: 'css',
		}),
		// addLessLoader(),
		// addPostcssPlugins([require('postcss-pxtorem')({ rootValue: 75, propList: ['*'], minPixelValue: 2, selectorBlackList: ['am-'] })]),
		addCustomize(),
	),
	devServer: overrideDevServer(
		devServerConfig(),
	),
};

