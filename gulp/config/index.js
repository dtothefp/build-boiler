export default {
  isHfa: true,
  shouldRev: true,
  multipleBundles: false,
  bucketBase: undefined,
  devAssets: '/',
  prodAssets: '/',
  devPath: undefined, //ex => 'www.hfa.io'
  prodPath: undefined, //ex => 'www.hillaryclinton.com'
  internalHost: 'localhost',
  includePaths: [],
  webpack: {
    expose: {
      /*modules to expose globally ex. => js-cookie: 'Cookie'*/
    },
    alias: {
      /*alias modules ex. => underscore: 'lodash'*/
    },
    externals: [ //declare external modules and pass then to the ProvidePlugin
      {
        name: {
          jquery: 'jQuery'
        },
        provide: {
          'global.jQuery': 'jquery',
          'window.jQuery': 'jquery',
          '$': 'jquery'
        }
      }
    ],
    vendors: [
      /*only use if using multiple bundles ex. => [react, reactdom, lodash]*/
    ]
  },
  cb(config) {
    //you have access to the gulp config here for
    //any extra customization => don't forget to return config
    return config;
  }
};
