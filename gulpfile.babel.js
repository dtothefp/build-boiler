import 'babel-polyfill';
import path from 'path';
import gulp from 'gulp';
import build from './packages/boiler-core/src';
import loadPlugins from 'gulp-load-plugins';
import formatter from 'eslint-friendly-formatter';
import makeEslintConfig from 'eslint-config';

const scripts = './packages/*/src/**/*.js';

if (process.argv.indexOf('--force') !== -1) {
  let tasks = {};
  let plugins;

  try {
    ({tasks, plugins} = build(gulp));
  } catch (err) {
    plugins = loadPlugins({
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
    });
  }

  const babelFn = require(
    path.join(process.cwd(), 'gulp', 'tasks', 'babel')
  );

  const {eslint, sequence} = plugins;
  const eslintConfig = makeEslintConfig({
    basic: false,
    react: false,
    isDev: true,
    lintEnv: 'build'
  });
  const eslintFn = () => {
    return gulp.src(scripts)
      .pipe(eslint(eslintConfig))
      .pipe(eslint.format(formatter));
  };

  gulp.task('babel', tasks.babel || babelFn(gulp, plugins, {}));
  gulp.task('lint', tasks.lint || eslintFn);

  gulp.task('watch', ['lint', 'babel'], () => {
    gulp.watch(scripts, [], (cb) => {
      sequence(
        'lint',
        'babel',
        cb
      );
    });
  });
} else {
  const {tasks, config, plugins: $} = build(gulp);
  const {sources, utils, environment} = config;
  const {isDev} = environment;
  const {testDir, buildDir} = sources;
  const {addbase} = utils;

  gulp.task('assemble', tasks.assemble);
  gulp.task('browser-sync', tasks.browserSync);
  gulp.task('clean', tasks.clean);
  gulp.task('copy', tasks.copy);
  gulp.task('custom', tasks.custom);
  gulp.task('karma', tasks.karma);
  gulp.task('lint:test', tasks.eslint);
  gulp.task('lint:build', tasks.eslint);
  gulp.task('lint', ['lint:test', 'lint:build']);
  gulp.task('selenium', tasks.selenium);
  gulp.task('selenium:tunnel', tasks.selenium);
  gulp.task('webpack:global', tasks.webpack);
  gulp.task('webpack:main', tasks.webpack);
  gulp.task('webpack', ['webpack:global', 'webpack:main']);

  gulp.task('build', (cb) => {
    if (isDev) {
      //gulp watch
      sequence(
        ['clean', 'custom'],
        ['copy', 'lint'],
        'webpack',
        'assemble',
        'browser-sync',
        cb
      );
    } else {
      sequence(
        'clean',
        ['copy', 'lint'],
        'webpack',
        'assemble',
        cb
      );
    }
  });

  gulp.task('default', ['build']);

  gulp.task('watch', ['build'], () => {
    gulp.watch(addbase(buildDir, '{js,css}/**/*.{js,css}'), $.browserSync.reload);
    gulp.watch([
      addbase(testDir, '**/*.js'),
      addbase(buildDir, '**/*.js')
    ], ['lint']);
  });
}
