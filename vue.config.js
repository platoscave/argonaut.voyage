// Need this for relative paths in our build
module.exports = {
  lintOnSave: 'warning',
/*  
  devServer: {
    proxy: 'http://localhost:8080'
  }
  publicPath: '/',

     devServer: {
      historyApiFallback: {
        rewrites: [
          { from: /^\/public/, to: '/public/argonaut.json' },
          { from: /./, to: '/views/404.html' },
        ],
      },
      //disableDotRule: true,
  },
  devServer: {
      historyApiFallback: {
        rewrites: [{
            from: /^\/public\/.*$/,
            to: function() {
                return 'index.html';
            }
        }]
      },
      noInfo: true
    }, */
}
/* watchOptions: {
  poll: true
} */
