import _ from 'lodash';
import {join} from 'path';
import gutil from 'gulp-util';
import {spawn} from 'child_process';
import parseNames from  './make-config/parse-browser-names';
import thunk from '../../utils/thunk';
import run from '../../utils/run-gen';

/**
 * Spawn child process/processes and run tests in parallel/concurrently
 * @param {Array} opts all E2E options
 * @param {Object} config gulp config
 * @param {Function} cb callback
 * @return {undefined} use the callback
 */
export default function(opts, config, cb) {
  const {log, colors} = gutil;
  const {magenta} = colors;
  const {local, utils} = config;
  const {addroot, logError} = utils;
  const {TRAVIS_BRANCH} = process.env;

  /**
   * @param {Object} opt E2E options
   * @param {Boolean} local cli arg
   * @param {Boolean} concurrent
   * @return {Function} "thunked" child process
   */
  function runCp(opt, local, concurrent) {
    const {baseUrl} = opt;
    const message = `Starting ${concurrent && opts.length > 1 ? 'Concurrent' : 'Parallel'} Tests for [${magenta(baseUrl)}]`;

    log(message);

    const env = _.merge({}, process.env, {
      WDIO_CONFIG: JSON.stringify(opt),
      TEST_ENV: JSON.stringify({local})
    });

    const cp = spawn(
      addroot('node_modules/webdriverio/bin/wdio'),
      [
        join(__dirname, 'wdio-config'),
        '--harmony'
      ],
      {
        stdio: 'inherit',
        env
      }
    );

    return thunk(cp.on, cp);
  }

  run(function *() {
    if (_.isUndefined(TRAVIS_BRANCH)) {
      let code;

      for (const opt of opts) {
        const thunkedCp = runCp(opt);
        const {browsers, specs} = parseNames(opt);

        try {
          code = yield thunkedCp('close');
          log(`Child process for ${browsers} testing ${specs} closed with status: ${code}`);
        } catch (err) {
          logError({err, plugin: '[selenium: spawn]'});
        }
      }

      if (code !== 0) {
        cb(code);
      } else {
        cb(null, code);
      }
    } else {
      const cps = opts.reduce((list, opt) => {
        const thunkedCp = runCp(opt, local, true);
        const {browsers, specs} = parseNames(opt);
        const data = {
          thunk: thunkedCp,
          browsers,
          specs
        };

        return [...list, data];
      }, []);

      let codes = [];

      for (const data of cps) {
        const {thunk: thunkedCp, browsers, specs} = data;
        const code = yield thunkedCp('close');
        log(`Child process for ${browsers} testing ${specs} closed with status: ${code}`);
        codes.push(code);
      }

      const flattendCodes = codes.filter(cpCode => cpCode !== 0);

      if (flattendCodes.length) {
        cb(flattendCodes[0]);
      } else {
        cb(null, 0);
      }
    }
  });
}