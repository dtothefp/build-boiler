import path from 'path';
import merge from 'lodash/merge';
import {PropTypes} from 'react';
import {provideReactor} from 'nuclear-js-react-addons';
import {dependencies, devDependencies} from '../../package';

export default {
  /**
   * Assemble task
   */
  assemble: {
    /**
     * Add data directly to Assemble context `app.data(data)`
     *
     * ex. String
     * path to give to `Plasma`
     * data: 'path/to/data/*.yml
     *
     * ex. Array
     * path and options to give to `Plasma`
     * data: ['path/to/data/*.yml', {namespace: false]
     *
     * ex. Object
     * data: {bleep: 'bloop'}
     *
     * ex. Function
     * @param {Object} config `gulp` config
     * @param {Object} defaultData internal data passed to assemble
     *
     * @return {Object} additional data for assemble
     * data(config, defaultData) {
     *   return {bleep: 'bloop'}
     * }
     */
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
    minify: true,
    /**
     * Add and omit custom tags
     * @param {Object} nunj Nunjucks instance
     * @param {Object} app Assemble instance
     * @param {Object} tags tag names => tag fn from BuildBoiler
     *
     * @return {Array|Object|undefined} filter tags to ignore them or return `undefined` to not ignore
     */
    registerTags(nunj, app, tags) {

      //return _.omit(tags, 'getSnippet');
      //return Object.keys(tags).reduce((list, fp) => {
        //return fp === 'getSnippet' ? list : [...list, tags[fp]];
      //}, []);
    },
    /**
     * Add middleware to the Assemble hooks ie `onLoad`, `preRender`, `preCompile`
     */
    middleware: {
      /**
       * Pass a function or array of functions
       * ex. (file, next) =>
       * ex. (config) => (file, next) =>
       */
      preRender: [
        (file, next) => {
          next(null, file);
        },
        (config) => {
          return (file, next) => {
            next(null, file);
          };
        }
      ],
      onLoad(config) {
        return (file, next) => {
          next(null, file);
        };
      }
    }
  },
  /**
   * Config for babel task
   * @param {Object} config gulp config
   * @param {Object} babelConfig see example
   * @return {Object}
   * ex.{
   *  src: ['lib/*.js'],
   *  babelrc: {
   *    presets: ['es2015']
   *  },
   *  dev: true,
   *  endpoints: [
   *    {
   *      src: ['lib/*.js'],
   *      dest: 'dist'
   *    }
   *  ]
   * }
   */
  babel(config, babelConfig) {
    babelConfig.endpoints = [
      {
        src: ['lib/*.js'],
        dest: 'dist/bloop'
      },
      {
        src: ['src/js/*.js'],
        dest: 'dist/src'
      }
    ];

    return babelConfig;
  },
  copy(config, copyConfig) {
    const {sources, utils} = config;
    const {srcDir, scriptDir, templateDir, buildDir} = sources;
    const {addbase} = utils;

    copyConfig.endpoints = [
      //static src
      {
        src: addbase(srcDir, '**', templateDir, '**/*.html'),
        dest: path.join(buildDir, 'copy-html-test')
      },
      {
        src: addbase(srcDir, scriptDir, '*.js'),
        dest: path.join(buildDir, 'copy-js-test')
      }
    ];

    return copyConfig;
  },
  /**
   * Config for nodemon task
   * @param {Object} config gulp config
   * @param {Object} nodemonConfig see example
   * @return {Object}
   * ex.{
   *   script: 'lib/entry/indes.js',
   *   env: {
   *     BRANCH: 'local',
   *     NODE_ENV: 'development',
   *     OPEN: 'http:localhost:3031'
   *  },
   *  openPath: 'http:localhost:3031',
   *  open: true,
   *  watch: [
   *    'lib/*.js',
   *    '!' + 'lib/node_modules/**'
   *  ],
   *  cwd: 'Users/bleep/bloop/lib'
   * }
   */
  nodemon(config, nodemonConfig) {
    return merge(nodemonConfig, {
      env: {
        DEBUG: 'test'
      }
    });
  },
  /**
   * Mocha Task
   * pass `require` see `gulp-mocha`
   * https://github.com/sindresorhus/gulp-mocha
   * add => adds `require`ed option to pre-defined task `require`
   */
  mocha: {
    add: true,
    require: path.resolve(__dirname, '..', 'tasks', 'mocha', 'sample-hook.js')
  },
  /**
   * BrowserSync Task
   */
  browserSync: {
    /**
     * Add `middleware` to BrowserSync/Connect
     * @param {Object} config original task config
     * @param {Array} m Express/Connect style middleware
     *
     * @return {Array|Function} middleware to use
     * ex.
     * middleware(config, m) {
     *  return [
     *    connectHistoryApifallback(),
     *    ...m
     *  ];
     * }
     */
    middleware(config, m) {

      return m;
    },
    /**
     * Whether to open the webpage when BrowserSync server starts
     * @param {Boolean}
     * ex.
     * open: true
     *
     * or
     *
     * @param {Object} config original task config
     * @param {String} fp
     * @return {String} path to open
     * ex,
     * open: (config, fp) => 'http://localhost:8000/bleep'
     */
    open: true
  },
  /**
   * Config for `boiler-config-eslint` to lint build files (gulp-eslint)
   * and client files in webpack (eslint-loader)
   * rules => will be written to .eslintrc, can have a 'env' key or be top level
   * generate => generate a .eslintrc
   */
  eslint: {
    rules: {
      web: {

      },
      build: {

      },
      test: {

      }
    },
    generate: true
  },
  /**
   * Webpack specific configs
   */
  webpack: {
    /**
     * Base config to override anything in `defaultConfig` generated by `boiler-config-webpack`
     *
     * ex.
     * base: {
     *   resolve: {
     *     modulesDirectories: ['my-mods']
     *  }
     * }
     */
    base: {},
    /**
     * rev filepaths for JS and CSS when running `gulp build`
     */
    shouldRev: true,
    /**
     * in SCSS `@import 'some-mode'` without a relative path, passed to
     * boiler-addon-webpack-styles
     */
    includePaths: [],
    /**
     * Include a timestamp in the JS/CSS filepath
     */
    timestamp: true,
    /**
     * Whether to use https://github.com/mikechau/sri-stats-webpack-plugin
     * to write data for subresource integrity
     * @param {Boolean|String} string specifies sha
     */
    integrity: 'sha256',
    /**
     * add additional paths to webpack `resolve.modulesDirectories`
     * so that can `require/import` without a relative path
     *
     * ex.
     * moduleRoot: [path.join(process.cwd(), 'lib')]
     */
    moduleRoot: [
      path.join(process.cwd(), 'lib')
    ],
    /**
     * Express middleware to be registered directly on Express utilizing
     * `webpack-dev-middleware` and `webpack-hot-middleware` for
     * local dev and hot reloading
     * @param {Object} config base config from gulp task
     * @param {Object} app the Express instance
     *
     * @return {undefined} register the middleware directly on `app`
     */
    middleware(config, app) {

    },
    /**
     * Tell webpack to generate multiply bundles, if `true` a `vendors`
     * bundle will also be created utilizing the `CommonsChunksPlugin`
     *
     * ex. chunk out React and ReactDOM so they will be loaded in `vendors` bundle
     * multipleBundles: {
     *   vendors: ['react', 'react-dom']
     * }
     *
     * ex. generate a `vendors` bundle, omit the `main` bundle, therefore
     * `src/js/index.js` will be loaded in the `vendors` bundle. Create
     * multiple entries for all `.js` and `.jsx` files in `src/templates/pages`
     * multipleBundles: {
     *   omitEntry: true,
     *   glob: path.join('templates', 'pages', '**', '*.{js,jsx}'),
     *   base: path.join(process.cwd(), 'src'),
     *   vendors: [
     *     'lodash',
     *     'react',
     *     'react-dom'
     *   ]
     * }
     */
    multipleBundles: {
      //preserve the basename of the multiple entries
      //preserve: true,
      omitEntry: true,
      glob: path.join('templates', 'pages', '**', '*.{js,jsx}'),
      base: path.join(process.cwd(), 'src'), //default to `templates/pages`
      vendors: [
        'lodash',
        'react',
        'react-dom'
      ]
    },
    /**
     * Modules to expose globally by the name provided as the "value"
     * in the object
     * ex.expose `js-cookie` globally as `window.Cookie`
     * expose: {
     *   'js-cookie': 'Cookie'
     * }
     */
    expose: {
      'js-cookie': 'Cookie',
      'query-string': 'qs'
    },
    /**
     * Alias modules
     * ex. all references to `underscore` should use `lodash`
     * alias: {
     *   underscore: 'lodash'
     * }
     */
    alias: {},
    /**
     * Declare external modules and use the `ProvidePlugin` to `import/require`
     * them automatically
     * ex.
     * externals: [
     *   {
     *    name: {
     *      jquery: 'jQuery'
     *    },
     *    provide: {
     *      'global.jQuery': 'jquery',
     *      'window.jQuery': 'jquery',
     *      '$': 'jquery'
     *    }
     *  }
     *]
     */
    externals: [
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
    /**
     * Whether to use `hot` reloading through `react-transorm-hmr`
     * and `webpack-hot-middleware`
     */
    hot: true,
    /**
     * Use the webpack `DefinePlugin` for dependency injection of env variables
     * ex. SOME_VAR: JSON.stringify('something')
     * 'process.env': {
     *   BLEEP: JSON.stringify('bloop')
     * }
     *
     * ex.
     * @param {Object} config `gulp` config
     * @param {Object} data Object to be passed to `DefinePlugin`
     *
     * @return {Object}
     * env(config, data) {
     *   return merge({}, data, {
     *     'process.env': {
     *        BLEEP: JSON.stringify('bloop')
     *     }
     *   });
     * }
     */
    env: {},
    /**
     * Last chance to alter the plugin instances
     * @param {Object} config `gulp` config
     * @param {Array} p plugins
     *
     * @return {Array}
     * ex.
     * plugins(config, p) {
     *   return p.filter(plugin => plugin.constructor.name === 'DefinePlugin');
     * }
     */
    plugins(config, p) {},
    /**
     * Last chance to alter the loaders
     * @param {Object} config `gulp` config
     * @param {Object} l loaders => preLoaders, loaders, postLoaders
     *
     * @return {Object} preLoaders, loaders, postLoaders
     * ex.
     * loaders(config, l) {
     *   const {loaders} = l;
     *   const [jsonLoader] = loaders.filter(({loader}) => loader === 'json');
     *
     *   jsonLoader.loader = `${jsonLoader.loader}!yaml`;
     *
     *   return l;
     * }
     */
    loaders(config, l) {},
    /**
     * Pass config to the `boiler-addon-webpack-babel` module
     */
    babel: {
      /**
       * omit the `babel-polyfill` from your bundle, if `multipleEntries`
       * 'babel-polyfill` will be in `vendors` otherwise will be in `main`
       */
      omitPolyfill: true,
      /**
       * include the babel runtime, useful if omitting the 'babel-polyfill'
       */
      transform: ['transform-runtime', {polyfill: false}],
      /**
       * Adjust the `babelrc` object before it is processed
       * @param {Object} config `gulp` config
       * @param {Object} rc babelrc Object from `boiler-config-base`
       * @return {Object} babelrc => presets, env
       * ex.
       * babelrc(config, rc) {
       *   if (config.environment.isDev) {
       *     rc.env.development.plugins = ['some-cool-plugin']
       *   }
       *
       *   return rc;
       * }
       */
      babelrc(config, rc) {},
      /**
       * Adjust the `query` before it is passed to the `babel-loader`
       * @param {Object} config `gulp` config
       * @param {Object} q query constructed from babelrc
       * @return {Object} babelrc => presets, plugins
       * ex.
       * query(config, q) {
       *   q.presets = [
       *     ...q.presets.filter(preset => preset !== 'es2015'),
       *     'es2015-webpack'
       *   ];
       *
       *   return q;
       * },
       */
      query(config, q) {},
      /**
       * Hijack the `exclude` property passed to `babel-loader`
       *
       * ex. a RegExp
       *   exclude: /node_modules/
       *
       * ex. an Array
       *   exclude: [/node_modules/, /something/]
       *
       * ex. a Function
       * @param {Object} config `gulp` config
       * @param {Object} fp filepath passed to `babel-loader`
       * @return {Boolean} `true` to exclude from babel loader
       * exclude(config, fp) {
       *   return /node_modules/.test(fp);
       * }
       */
      exclude(config, fp) {}
    },
    /**
     * Hijack the `data` that is `export`ed to Webpack
     * @param {Object} config `gulp` config
     * @param {Object} data webpack data Object
     * @return {Object}
     * ex.
     * configCb(config, data) {
     *   data.resolve.node = {fs: 'empty'};
     *
     *   return data;
     * }
     */
    configCb(config, data) {},
    /**
     * Hijack the methods called per enironment that return the Webpack config
     * @param {Object} config `gulp` config
     * @param {Object} methods
     * @param {Object} methods.development
     * @param {Object} methods.production
     * @param {Object} methods.server boiler-addon-webpack-isomorphic
     * @param {Object} methods.test boiler-addon-webpack-karma
     * @param {Object} methods.ci boiler-addon-webpack-karma
     * @return {Object}
     * ex.
     * methodCb(config, methods) {
     *   if (config.environment.isDev) {
     *     methods.development = () => {
     *        //return some webpack config here
     *     }
     *   }
     *
     *   return methods;
     * }
     */
    methodCb(config, methods) {}
  },
  /**
   * Isomorphic options used by Assemble/Webpack
   * ex.
   * context: process.cwd(), //context for Webpack and entry globs
   * entries: [
   *   'lib/components/**.{js,jsx}',
   *   'lib/bootstrap.js'
   * ],
   * bootstrap: path.join('lib', 'bootstrap'), //isomorphic bootstrap file
   * modules: {
   *   include: [],  //include these external modules in the bundle
   *   exclude: [  //exclude these modules from the bundle
   *     ...Object.keys(dependencies || {}),
   *     ...Object.keys(devDependencies || {})
   *   ],
   *   target: 'node'  //whether to use Webpack `target: 'node'`
   * }
   */
  isomorphic: {
    //base: true,
    memory: true, //=> use with `boiler-addon-assemble-isomorphic-memory`
    output: 'dist/server',
    context: process.cwd(),
    entries: [
      'lib/components/**.{js,jsx}',
      'lib/bootstrap.js'
    ],
    bootstrap: path.join('lib', 'bootstrap'),
    modules: {
      include: [],
      exclude: [
        ...Object.keys(dependencies || {}),
        ...Object.keys(devDependencies || {})
      ],
      target: 'node'
    }
  },
  /**
   * Config passed to `boiler-task-karma`
   */
  karma: {
    browsers: {},
    devices: {},
    coverageRe: /^.+?\/src\/js\/(?:services|modules|component-utils|module-utils)\/.+?\.jsx?$/
    //mocks: path.join(process.cwd(), 'build-boiler/gulp/tasks/karma/analytics-mocks.js')
  },
  /**
   * Config passed to `boiler-task-selenium`
   */
  webdriver: {
    browsers: [],
    devices: []
  },
  /**
   * Final chance to hijack the `gulp` config in
   * `boiler-core/get-boiler-task-config` before it is
   * passed to the `tasks`
   * @param {Object} config generated by `boiler-config-base` and `boiler-core`
   *
   * @return {Object}
   * ex.
   * cb(config) {
   *   return merge({}, config, {
   *     sources: {
   *       hotPort: '3001',
   *       devPort: '8001'
   *     }
   *   });
   * }
   */
  cb(config) {
    return merge(config, {
      sources: {
        serverDir: 'lib',
        serverPort: 3030
      }
    });
  }
};
