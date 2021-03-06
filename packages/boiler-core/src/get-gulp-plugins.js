import path from 'path';
import loadPlugins from 'gulp-load-plugins';
import {sync as globSync} from 'globby';

export default function(config, tasks = []) {
  const {rootDir} = config.sources;
  /**
   * Load all of the gulp plugins
   */
  const pluginOpts = {
    lazy: false,
    pattern: [
      'gulp-*',
      'gulp.*',
      'del',
      'run-sequence',
      'browser-sync'
    ],
    rename: {
      'gulp-util': 'gutil',
      'run-sequence': 'sequence',
      'gulp-if': 'gulpIf'
    }
  };

  const packages = globSync('boiler-*', {cwd: rootDir});
  const packageDirs = packages.map(pkg => path.join(rootDir, pkg));
  const modulePlugins = packageDirs.length ? packageDirs.reduce((acc, fp) => {
    const plugins = loadPlugins({
      config: path.join(fp, 'package.json'),
      scope: ['dependencies'],
      ...pluginOpts
    });

    Object.assign(acc, plugins);

    return acc;
  }, {}) : {};

  const rootPlugins = loadPlugins({
    config: path.join(process.cwd(), 'package.json'),
    ...pluginOpts
  });

  return {
    ...modulePlugins,
    ...rootPlugins
  };
}
