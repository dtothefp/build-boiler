import _ from 'lodash';
import {readdirSync as read, statSync as stat, existsSync as exists} from 'fs';
import path, {join} from 'path';
import {sync as parentSync} from 'find-parent-dir';
import hacker from 'require-hacker';
import makeConfig from './';
import makeCliConfig from './make-cli-config';
import addTaskName from '../utils/gulp-taskname';
import renameKey from '../utils/rename-key';
import log, {blue} from '../utils/build-logger';

export default function(gulp, opts = {}) {
  const babel = require('babel-core');
  const excludeRe = /^(.*?\/)?node_modules\/(?!@hfa\/).+\.jsx?$/;
  const {include} = opts;
  const parentDist = parentSync(__dirname, 'dist');
  const parentMod = parentSync(__dirname, 'node_modules');
  const rootDir = parentMod || parentDist || path.resolve(__dirname, '..', '..');
  const {cliConfig, plugins} = makeCliConfig(rootDir);
  const hook = hacker.hook('js', hackedPath => {
    const shouldInclude = include ? include.test(hackedPath) : !excludeRe.test(hackedPath);
    let compiled;

    if (shouldInclude && hackedPath.indexOf(rootDir) === -1) {
      compiled = babel.transformFileSync(hackedPath, {
        sourceRoot: path.dirname(hackedPath)
      }).code;
    }

    return compiled;
  });
  let hasParentConfig, parentConfig;

  try {
    const fp = join(process.cwd(), 'gulp', 'config', 'index.js');
    hasParentConfig = stat(fp).isFile();

    parentConfig = require(fp);
    log(`Merging parent ${blue('gulp/config')} with base config`);
  } catch (err) {
    if (hasParentConfig) {
      throw err;
    }
  }

  const config = makeConfig(cliConfig, rootDir, parentConfig);
  const {sources, utils} = config;
  const {taskDir} = sources;
  const {addbase, addroot} = utils;

  addTaskName(gulp);

  process.env.NODE_ENV = config.ENV;
  //hack for karma, ternary was making `undefined` a string
  if (config.file) {
    process.env.TEST_FILE = config.file;
  }

  /**
   * Reqires all gulp tasks passing the `gulp` object, all `plugins` and `config` object
   * Eliminates a lot of
   * @param {String} taskPath
   * @param {Function|Callback} supplied as `gulp.task`
   */
  function getTask(taskPath, moduleTask) {
    const fn = require(taskPath);
    let parentMod;

    if (moduleTask) {
      let foundPath;

      try {
        const parentPath = path.join(
          process.cwd(),
          taskPath.replace(rootDir, '')
        );

        const filePath = /\.js$/.test(parentPath) ? parentPath : `${parentPath}.js`;
        const dirPath = join(parentPath, 'index.js');

        if (exists(filePath)) {
          foundPath = filePath;
        } else if (exists(dirPath)) {
          foundPath = dirPath;
        }

        if (foundPath) {
          parentMod = require(foundPath);
          log(`Parent task found at ${blue(renameKey(foundPath))}`);
        }
      } catch (err) {
        /**
         * If the file exists but couldn't be compiled then show the error
         */
        if (foundPath) {
          throw err;
        }
      }
    }

    return moduleTask ?
      fn(gulp, plugins, config, parentMod) :
      fn.bind(fn, gulp, plugins, config);
  }


  /**
   * Creates an object with keys corresponding to the Gulp task name and
   * values corresponding to the callback function passed as the second
   * argument to `gulp.task`
   * @param {String} basePath path to directory
   * @param {Array} dirs array of filepaths/direcotries
   * @param {Boolean} isModule flag of whether to look up at parent tasks
   * @return {Object} map of task names to callback functions to be used in `gulp.task`
   */
  function recurseTasks(basePath, dirs, isModule) {
    return dirs.reduce((acc, name) => {
      const taskPath = join(basePath, name);
      let isDir = stat(taskPath).isDirectory();
      let taskName;
      if (isDir) {
        if ( !exists(join(taskPath, 'index.js')) ) {
          throw new Error(`task ${name} directory must have filename index.js`);
        }
        taskName = name;
      } else {
        taskName = path.basename(name, '.js');
      }


      return {
        ...acc,
        [ _.camelCase(taskName) ]: getTask(taskPath, isModule)
      };
    }, {});
  }

  const tasksDir = addroot(taskDir, 'tasks');
  const internalDirs = read(tasksDir);
  const moduleTasks = recurseTasks(tasksDir, internalDirs, true);
  const parentDir = addbase(taskDir, 'tasks');
  let parentTasks = {};

  try {
    const parentPaths = read(parentDir).filter(fp => {
      const base = fp.replace(path.extname(fp), '');

      return !internalDirs.includes(base);
    });

    parentTasks = recurseTasks(parentDir, parentPaths);
    log(`Merging Gulp Tasks from ${blue(renameKey(parentDir))}`);
  } catch (err) {
    //eslint-disable-line no-empty:0
  }

  hook.unmount();

  const tasks = {
    ...parentTasks,
    ...moduleTasks
  };

  return {
    tasks,
    config,
    plugins
  };
}
