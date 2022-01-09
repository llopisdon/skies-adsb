const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")
const HtmlWebPackPlugin = require("html-webpack-plugin")
const path = require("path")
const Dotenv = require("dotenv-webpack")
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')


module.exports = {
  entry: {
    main: path.resolve(__dirname, './src/main.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [

    new FaviconsWebpackPlugin({
      manifest: './src/manifest.json',
      favicons: {
        appName: "skies-adsb",
        appDescription: "Realtime 3D Plane Spotting",
        developerName: "MACHINE INTERACTIVE",
        developerURL: null,
        url: "https://www.machineinteractive.com",
        background: "#000",
        theme_color: "#000",
        icons: {
          appleStartup: false,
          coast: false,
          yandex: false,
          windows: false,
        }
      }
    }),

    new Dotenv(),

    new CleanWebpackPlugin({
      verbose: true
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'static',
          to: 'static',
          noErrorOnMissing: true,
        },
        {
          from: 'data',
          to: 'data',
        }
      ],
    }),
    new HtmlWebPackPlugin({
      template: './src/index.html'
    }),
  ],
  devServer: {
    open: true
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader"]
      },
      {
        test: /\.css$/,
        loader: "css-loader",
        options: {
          url: {
            filter: (url, resourcePath) => {
              if (url.includes(".svg")) {
                return false
              }
              return true
            }
          }
        }
      },
      {
        test: /\.svg$/i,
        use: ["svg-url-loader"]
      }
    ]
  }
}
