import makeEslintConfig from 'eslint-config';
import formatter from 'eslint-friendly-formatter';
import boilerUtils from 'boiler-utils';

export default function(gulp, plugins, config, parentMod) {
  const {
    runParentFn: callParent,
    runCustomTask: runFn
  } = boilerUtils;
  const {eslint} = plugins;
  const {utils, environment, eslint: eslintParentConfig} = config;
  const {isDev} = environment;
  const {addbase, addroot, getTaskName} = utils;
  let src;

  return () => {
    const lintEnv = getTaskName(gulp.currentTask);

    if (lintEnv === 'test') {
      src = [addbase('test', '**/*.js')];
    } else if (lintEnv === 'build') {
      src = [
        addbase('gulp', '{config,tasks}', '**/*.js'),
        addroot('gulp', '**/*.js'),
        addbase('gulpfile.babel.js')
      ];
    }
    const defaultConfig = {
      basic: true,
      react: false,
      isDev,
      lintEnv
    };

    const pluginConfig = makeEslintConfig(
      Object.assign({}, defaultConfig, eslintParentConfig)
    );
    const parentConfig = callParent(arguments, {
      src,
      data: pluginConfig
    });

    const {
      src: newSrc,
      data: eslintConfig,
      fn
    } = parentConfig;

    const task = () => {
      return gulp.src(newSrc)
        .pipe(eslint(eslintConfig))
        .pipe(eslint.format(formatter));
    };

    return runFn(task, fn);
  };
}
