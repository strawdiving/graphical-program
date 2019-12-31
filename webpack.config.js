
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPLugin = require('vue-loader/lib/plugin')

module.exports = {
    entry: ["@babel/polyfill",'./src/main.js'],
    output: {
        path: path.resolve(__dirname,'./dist'),
        publicPath: '/dist',
        filename: 'main.js'
    },
    mode: 'development',
    devServer: {
        historyApiFallback: true,
        overlay: true
    },
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.esm.js',
            '@': path.resolve(__dirname,'./src'),
        },
        extensions: ['.js','.vue','.json']
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    { loader: 'vue-style-loader'},
                    { loader: 'css-loader',
                      options: {
                        modules: true
                      }
                    }
                ]
            },{
                test: /\.scss$/,
                use: ['vue-style-loader','css-loader','sass-loader']
            },{
                test: /\.sass$/,
                use: ['vue-style-loader','css-loader','sass-loader?indentedSyntax']
            },{
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]?[hash]'
                }
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html',
            inject: true
        }),
        new VueLoaderPLugin()
    ]
};