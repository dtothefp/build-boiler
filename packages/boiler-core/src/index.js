import _ from 'lodash';
import {readdirSync as read, statSync as stat, existsSync as exists} from 'fs';
import path, {join} from 'path';
//import {sync as parentSync} from 'find-parent-dir';
import hacker from 'require-hacker';
import boilerUtils from 'boiler-utils';
import findUp from 'findup-sync';
import makeCliConfig from './make-cli-config';
import makeConfig from './make-config';
import getBoilerDeps from './utils/parse-config';

export default function(gulp, opts = {}) {
  const babel = require('babel-core');
  const {
    gulpTaskname: addTaskName,
    renameKey,
    buildLogger,
    removeExtension: removeExt
  } = boilerUtils;
  const {default: log, blue} = buildLogger;
  const excludeRe = /^(.*?\/)?node_modules\/(?!@hfa\/).+\.jsx?$/;
  const {include} = opts;
  //const parentDist = parentSync(__dirname, 'dist');
  //const parentMod = parentSync(__dirname, 'node_modules');
  //const rootDir = parentMod || parentDist || path.resolve(__dirname, '..', '..');
  //=> this is ./packages || node-modules
  const rootDir = path.resolve(__dirname, '..', '..');
  const {cliConfig, plugins} = makeCliConfig(process.cwd());
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
  const parentConfig = {};
  let hasParentConfig, hasBoilerConfig, boilerData;

  try {
    const fp = join(process.cwd(), 'gulp', 'config', 'index.js');
    hasParentConfig = stat(fp).isFile();

    Object.assign(parentConfig, require(fp));
    log(`Merging parent ${blue('gulp/config')} with base config`);
  } catch (err) {
    if (hasParentConfig) {
      throw err;
    }
  }

  try {
    const fp = findUp('boiler.config.js');
    hasBoilerConfig = stat(fp).isFile();

    const {presets, tasks, ...boilerConfig} = require(fp);
    boilerData = getBoilerDeps(
      path.resolve(__dirname, '..', '..'),
      {tasks, presets}
    );

    Object.assign(parentConfig, boilerConfig);
    log(`Found boiler config at ${blue(renameKey(fp))}`);
  } catch (err) {
    if (hasBoilerConfig) {
      throw err;
    }
  }

  const config = makeConfig(cliConfig, rootDir, parentConfig);
  const {sources, utils} = config;
  const {taskDir} = sources;
  const {addbase} = utils;

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
  function getTask(taskPath, moduleTask, fn) {
    fn = fn || require(taskPath);
    let parentMod;

    if (moduleTask) {
      let foundPath;

      try {
        const parentPath = path.join(
          process.cwd(),
          'gulp',
          'tasks',
          taskPath
        );

        const filePath = `${parentPath}.js`;
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
    } else {
      log(`Custom task found at ${blue(renameKey(taskPath))}`);
    }

    return moduleTask ?
      fn(gulp, plugins, config, parentMod) :
      fn(gulp, plugins, config);
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
        taskName = removeExt(name);
      }


      return {
        ...acc,
        [ _.camelCase(taskName) ]: getTask(taskPath, isModule)
      };
    }, {});
  }

  const internalDirs = Object.keys(boilerData);
  const parentDir = addbase(taskDir, 'tasks');
  const moduleTasks = internalDirs.reduce((acc, name) => ({
    ...acc,
    [_.camelCase(name)]: getTask(name, true, boilerData[name])
  }), {});
  let parentTasks = {};

  try {
    const parentPaths = read(parentDir).filter(fp => {
      const base = fp.replace(path.extname(fp), '');

      return !internalDirs.includes(base);
    });

    parentTasks = recurseTasks(parentDir, parentPaths);
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
