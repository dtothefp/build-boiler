import _ from 'lodash';
import {isStream} from 'gulp-util';

/**
 * Utility to call parent module from process.cwd() + gulp/tasks/*
 * @param {Array|arguments} gulpArgs
 * @param {Object} opts
 * @param {Array} opts.src
 * @param {Object} opts.data
 *
 * @return {Object|Function}
 */
export default function(args, opts = {}) {
  const gulpArgs = [...args];
  const [parentArgs] = gulpArgs.slice(-1);
  //TODO: potentially process `addons` here
  const {fn: parentMod/*, addons*/} = parentArgs;
  let ret;

  function normalizeOutput(retVal = {}) {
    const acc = {};

    if (_.isFunction(retVal) || isStream(retVal)) {
      acc.fn = retVal;
    } else {
      const {src, data} = retVal;
      let badSrc;

      if (Array.isArray(src) || _.isString(src)) {
        badSrc = src.length === 0;
      } else {
        badSrc = true;
      }

      acc.src = badSrc ? opts.src : src;
      acc.data = _.isUndefined(data) ? opts.data : data;
    }

    return acc;
  }

  if (_.isFunction(parentMod)) {
    ret = normalizeOutput(
      parentMod.apply(null, [...gulpArgs.slice(0, 3), opts])
    );
  } else {
    ret = opts;
  }

  return ret;
}
