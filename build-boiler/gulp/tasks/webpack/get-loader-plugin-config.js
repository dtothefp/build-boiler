import _ from 'lodash';
import makeEslintConfig from 'eslint-config';
import makeLoaders from './loaders';
import makePlugins from './plugins';
import makeTools from './isomorpic-tools';
import makeExternals from './make-externals';

export default function(config) {
  const {
    eslint: eslintParentConfig,
    isMainTask,
    environment,
    sources,
    utils,
    webpackConfig,
    ENV
  } = config;
  const {isDev, isServer} = environment;
  const {addbase} = utils;
  const {srcDir, entry} = sources;
  const {externals: externalConfig} = webpackConfig;
  const {main} = entry;
  const DEBUG = isDev;
  const TEST = ENV === 'test' || ENV === 'ci';
  const SERVER = ENV === 'server' || isServer;
  const extract = !isMainTask;
  const [expose] = _.isArray(main) ? main.map( fp => addbase(srcDir, fp) ) : [];
  const {externals, provide} = makeExternals(externalConfig);
  const toolsPlugin = makeTools(
    _.assign({}, config, {isPlugin: true})
  );
  const sharedConfig = {
    toolsPlugin,
    DEBUG,
    TEST,
    SERVER
  };
  const loaders = makeLoaders(
    _.assign({}, config, sharedConfig, {extract, expose})
  );
  const plugins = makePlugins(
    _.assign({}, config, sharedConfig, {provide})
  );
  const defaultEslintConfig = {
    isDev,
    lintEnv: TEST ? 'test' : 'web',
    basic: true,
    react: false
  };
  const eslintConfig = makeEslintConfig(
    _.assign({}, defaultEslintConfig, eslintParentConfig)
  );

  return {
    isServer: SERVER,
    externals,
    ...loaders,
    ...plugins,
    ...eslintConfig
  };
}
