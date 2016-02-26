import path from 'path';
import {PropTypes} from 'react';
import {provideReactor} from 'nuclear-js-react-addons';
import {dependencies, devDependencies} from '../../package';

export default {
  //isHfa: true,
  shouldRev: true,
  bucketBase: undefined,
  devAssets: '/',
  prodAssets: '/',
  devPath: undefined, //ex => 'www.hfa.io'
  prodPath: undefined, //ex => 'www.hillaryclinton.com'
  internalHost: 'localhost',
  includePaths: [],
  assemble: {
    data: {
      userName: process.cwd().split('/')[2],
      provider(comp) {
        return provideReactor(comp, {
          Actions: PropTypes.object,
          Getters: PropTypes.object,
          id: PropTypes.string
        });
      }
    },
    registerTags(nunj, app) {

    }
  },
  eslint: {
    basic: false,
    react: true,
    generate: true
  },
  webpack: {
    moduleRoot: [
      path.join(process.cwd(), 'lib')
    ],
    //options = Boolean|Object
    //multipleBundles: true,
    multipleBundles: {
      omitEntry: true,
      glob: path.join('templates', 'pages', '**', '*.js'),
      base: path.join(process.cwd(), 'src')//default to `templates/pages`
    },
    expose: {
      /*modules to expose globally ex. => js-cookie: 'Cookie'*/
      'js-cookie': 'Cookie',
      'query-string': 'qs'
    },
    alias: {
      /*alias modules ex. => underscore: 'lodash'*/
    },
    hot: true,
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
    ],
    env: {
      /**
       * data passed as `process.env` for dependency injection with Webpack `DefinePlugin`
       * ex. SOME_VAR: JSON.stringify('something')
       */
    },
    //p => plugins Array
    plugins(config, p) {
      return p;
    },
    babel: {
      omitPolyfill: false
      //transform: ['transform-runtime', {polyfill: false}]
    }
  },
  isomorphic: {
    context: process.cwd(),
    entries: [
      'lib/components/**.{js,jsx}',
      'lib/bootstrap.js'
    ],
    bootstrap: path.join('lib', 'bootstrap'),
    modules: {
      include: [],
      exclude: [
        ...Object.keys(dependencies),
        ...Object.keys(devDependencies)
      ],
      target: 'node'
    }
  },
  cb(config) {
    //you have access to the gulp config here for
    //any extra customization => don't forget to return config
    return config;
  }
};
