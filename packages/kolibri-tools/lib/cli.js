#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const program = require('commander');
const checkVersion = require('check-node-version');
const ini = require('ini');
const get = require('lodash/get');
const version = require('../package.json');
const logger = require('./logging');

const readWebpackJson = require('./read_webpack_json');

const cliLogging = logger.getLogger('Kolibri CLI');

function list(val) {
  return val.split(',');
}

function filePath(val) {
  if (val) {
    return path.resolve(process.cwd(), val);
  }
}

let configFile;
try {
  configFile = fs.readFileSync(path.join(process.cwd(), './setup.cfg'), 'utf-8');
} catch (e) {
  // do nothing
}

const config = ini.parse(configFile || '');

program.version(version).description('Tools for Kolibri frontend plugins');

function statsCompletionCallback(bundleData, options) {
  const express = require('express');
  const http = require('http');
  const host = '127.0.0.1';
  const rootPort = options.port || 8888;
  if (bundleData.length > 1) {
    const app = express();
    let response = `<html>
    <body>
    <h1>Kolibri Stats Links</h1>
    <ul>`;
    bundleData.forEach((bundle, i) => {
      response += `<li><a href="http://${host}:${rootPort + i + 1}">${bundle.name}</a></li>`;
    });
    response += '</ul></body></html>';

    app.use('/', (req, res) => {
      res.send(response);
    });
    const server = http.createServer(app);
    server.listen(rootPort, host, () => {
      const url = `http://${host}:${server.address().port}`;
      logger.info(
        `Webpack Bundle Analyzer Reports are available at ${url}\n` + `Use ${'Ctrl+C'} to close it`
      );
    });
  } else {
    const url = `http://${host}:${rootPort + 1}`;
    logger.info(
      `Webpack Bundle Analyzer Report is available at ${url}\n` + `Use ${'Ctrl+C'} to close it`
    );
  }
}

// Build
program
  .command('build')
  .description('Build frontend assets for Kolibri frontend plugins')
  .arguments(
    '<mode>',
    'Mode to run in, options are: d/dev/development, p/prod/production, i/i18n/internationalization, c/clean, s/stats'
  )
  .option('-f , --file <file>', 'Set custom file which lists plugins that should be built')
  .option(
    '-p, --plugins <plugins...>',
    'An explicit comma separated list of plugins that should be built',
    list,
    []
  )
  .option(
    '--pluginPath <pluginPath>',
    'A system path to the plugin or module that should be added to the Python path so that it can be imported during build time',
    String,
    ''
  )
  .option('-s, --single', 'Run using a single core to reduce CPU burden', false)
  .option('-h, --hot', 'Use hot module reloading in the webpack devserver', false)
  .option(
    '-p, --port <port>',
    'Set a port number to start devservers or bundle stats servers on',
    Number,
    3000
  )
  .action(function(mode, options) {
    const { fork } = require('child_process');
    const buildLogging = logger.getLogger('Kolibri Build');
    const modes = {
      DEV: 'dev',
      PROD: 'prod',
      CLEAN: 'clean',
      STATS: 'stats',
    };
    const modeMaps = {
      c: modes.CLEAN,
      clean: modes.CLEAN,
      d: modes.DEV,
      dev: modes.DEV,
      development: modes.DEV,
      p: modes.PROD,
      prod: modes.PROD,
      production: modes.PROD,
      s: modes.STATS,
      stats: modes.STATS,
    };
    if (typeof mode !== 'string') {
      cliLogging.error('Build mode must be specified');
      process.exit(1);
    }
    mode = modeMaps[mode];
    if (!mode) {
      cliLogging.error('Build mode invalid value');
      program.help();
      process.exit(1);
    }
    // Use one less than the number of cpus to allow other
    // processes to carry on.
    const numberOfCPUs = Math.max(1, os.cpus().length - 1);
    // Don't bother using multiprocessor mode if there is only one processor that we can
    // use without bogging down the system.
    const multi = !options.single && !process.env.KOLIBRI_BUILD_SINGLE && numberOfCPUs > 1;

    if (options.hot && mode !== modes.DEV) {
      cliLogging.error('Hot module reloading can only be used in dev mode.');
      process.exit(1);
    }

    const buildOptions = { hot: options.hot, port: options.port };

    const bundleData = readWebpackJson({
      pluginFile: options.file,
      plugins: options.plugins,
      pluginPath: options.pluginPath,
    });
    if (!bundleData.length) {
      cliLogging.error('No valid bundle data was returned from the plugins specified');
      process.exit(1);
    }
    const buildModule = {
      [modes.PROD]: 'production.js',
      [modes.DEV]: 'webpackdevserver.js',
      [modes.STATS]: 'bundleStats.js',
      [modes.CLEAN]: 'clean.js',
    }[mode];

    const modulePath = path.resolve(__dirname, buildModule);

    function spawnWebpackProcesses({ completionCallback = null, persistent = true } = {}) {
      const numberOfBundles = bundleData.length;
      let currentlyCompiling = numberOfBundles;
      let firstRun = true;
      const start = new Date();
      // The way we are binding this callback to the webpack compilation hooks
      // it seems to miss this on first compilation, so we will only use this for
      // watched builds where rebuilds are possible.
      function startCallback() {
        currentlyCompiling += 1;
      }
      function doneCallback() {
        currentlyCompiling -= 1;
        if (currentlyCompiling === 0) {
          if (firstRun) {
            firstRun = false;
            buildLogging.info(`Initial build complete in ${(new Date() - start) / 1000} seconds`);
          } else {
            buildLogging.info('All builds complete!');
          }
          if (completionCallback) {
            completionCallback(bundleData, buildOptions);
          }
        }
      }
      const children = [];
      for (let index = 0; index < numberOfBundles; index++) {
        if (multi) {
          const data = JSON.stringify(bundleData[index]);
          const options_data = JSON.stringify(buildOptions);
          const childProcess = fork(modulePath, {
            env: {
              // needed to keep same context for child process (e.g. launching editors)
              ...process.env,
              data,
              index,
              // Only start a number of processes equal to the number of
              // available CPUs.
              start: Math.floor(index / numberOfCPUs) === 0,
              options: options_data,
            },
            stdio: 'inherit',
          });
          children.push(childProcess);
          if (persistent) {
            childProcess.on('exit', (code, signal) => {
              children.forEach(child => {
                if (signal) {
                  child.kill(signal);
                } else {
                  child.kill();
                }
              });
              process.exit(code);
            });
          }
          childProcess.on('message', msg => {
            if (msg === 'compile') {
              startCallback();
            } else if (msg === 'done') {
              doneCallback();
              const nextIndex = index + numberOfCPUs;
              if (children[nextIndex]) {
                children[nextIndex].send('start');
              }
            }
          });
        } else {
          const buildFunction = require(modulePath);
          buildFunction(bundleData[index], index, startCallback, doneCallback, buildOptions);
        }
      }
    }

    if (mode === modes.CLEAN) {
      const clean = require(modulePath);
      clean(bundleData);
    } else if (mode === modes.STATS) {
      spawnWebpackProcesses({
        completionCallback: statsCompletionCallback,
      });
    } else if (mode === modes.DEV) {
      spawnWebpackProcesses();
    } else {
      // Don't persist for production builds or message extraction
      spawnWebpackProcesses({
        persistent: false,
      });
    }
  });

const ignoreDefaults = ['**/node_modules/**', '**/static/**'];

// Lint
program
  .command('lint')
  .arguments('[files...]', 'List of custom file globs or file names to lint')
  .description('Run linting on files or files matching glob patterns')
  .option('-w, --write', 'Write autofixes to file', false)
  .option('-e, --encoding <string>', 'Text encoding of file', 'utf-8')
  .option('-m, --monitor', 'Monitor files and check on change', false)
  .option(
    '-i, --ignore <patterns...>',
    'Ignore these comma separated patterns',
    list,
    ignoreDefaults
  )
  .option('-p, --pattern <string>', 'Lint only files that match this comma separated pattern', null)
  .action(function(args, options) {
    const files = [];
    if (!(args instanceof program.Command)) {
      files.push(...args);
    } else {
      options = args;
    }

    let patternCheck;
    if (!files.length && !options.pattern) {
      cliLogging.error('Must specify files or glob patterns to lint!');
      process.exit(1);
    } else if (!files.length) {
      files.push(options.pattern);
    } else {
      const Minimatch = require('minimatch').Minimatch;
      patternCheck = new Minimatch(options.pattern, {});
    }
    const glob = require('glob');
    const { logging, lint, noChange } = require('./lint');
    const chokidar = require('chokidar');
    const watchMode = options.monitor;
    const ignore = options.ignore;

    if (!files.length) {
      program.help();
    } else {
      const runLinting = file => lint(Object.assign({}, options, { file }));
      if (watchMode) {
        if (patternCheck) {
          cliLogging.error('Must not specify files and --pattern in watch mode');
          process.exit(1);
        }
        logging.info('Initializing watcher for the following patterns: ' + files.join(', '));
        const watcher = chokidar.watch(files, { ignored: ignore });
        watcher.on('change', runLinting);
      } else {
        Promise.all(
          files.map(file => {
            const matches = glob.sync(file, {
              ignore,
            });
            return Promise.all(
              matches.map(globbedFile => {
                if (!patternCheck || patternCheck.match(globbedFile)) {
                  return runLinting(globbedFile)
                    .then(formatted => {
                      return formatted.code;
                    })
                    .catch(error => {
                      logging.error(`Error processing file: ${globbedFile}`);
                      logging.error(error.error ? error.error : error);
                      return error.code;
                    });
                } else {
                  return Promise.resolve(0);
                }
              })
            ).then(sources => {
              return sources.reduce((code, result) => {
                return Math.max(code, result);
              }, noChange);
            });
          })
        ).then(sources => {
          process.exit(
            sources.reduce((code, result) => {
              return Math.max(code, result);
            }, noChange)
          );
        });
      }
    }
  });

// Test
program
  .command('test')
  .option('--config [config]', 'Set configuration for jest tests')
  .allowUnknownOption()
  .action(function(options) {
    const baseConfigPath = path.resolve(__dirname, '../jest.conf');
    if (process.env.NODE_ENV == null) {
      process.env.NODE_ENV = 'test';
    }
    let config;
    if (options.config) {
      config = path.resolve(process.cwd(), options.config);
      const configIndex = process.argv.findIndex(item => item === '--config');
      process.argv.splice(configIndex, 2);
    } else {
      config = baseConfigPath;
    }
    // Remove the 'test' command that this was invoked with
    process.argv.splice(2, 1);
    process.argv.push('--config');
    process.argv.push(config);
    require('jest-cli/build/cli').run();
  });

// Compress
program
  .command('compress')
  .arguments('[files...]', 'List of custom file globs or file names to compress')
  .allowUnknownOption()
  .action(function(files) {
    if (!files.length) {
      program.command('compress').help();
    } else {
      const glob = require('glob');
      const compressFile = require('./compress');
      Promise.all(
        files.map(file => {
          const matches = glob.sync(file);
          return Promise.all(matches.map(compressFile));
        })
      );
    }
  });

const localeDataFolderDefault = filePath(get(config, ['kolibri:i18n', 'locale_data_folder']));

// Path to the kolibri locale language_info file, which we use if we are running
// from inside the Kolibri repository.
const _kolibriLangInfoPath = path.join(__dirname, '../../../kolibri/locale/language_info.json');

const langInfoDefault = fs.existsSync(_kolibriLangInfoPath)
  ? _kolibriLangInfoPath
  : path.join(__dirname, './i18n/language_info.json');

// I18N Intl and Vue-Intl Polyfill Code Generation
program
  .command('i18n-code-gen')
  .option(
    '--lang-info <langInfo>',
    'Set path for file that contains language information',
    filePath,
    langInfoDefault
  )
  .option(
    '--output-dir <outputDir>',
    'Directory in which to write JS intl polyfill files',
    filePath
  )
  .action(function(options) {
    const intlCodeGen = require('./i18n/intl_code_gen');
    intlCodeGen(options.outputDir, options.langInfo);
  });

// I18N Message Handling
program
  .command('i18n-extract-messages')
  .option('--pluginFile <pluginFile>', 'Set custom file which lists plugins that should be built')
  .option(
    '-p, --plugins <plugins...>',
    'An explicit comma separated list of plugins that should be built',
    list,
    []
  )
  .option(
    '--pluginPath <pluginPath>',
    'A system path to the plugin or module that should be added to the Python path so that it can be imported during build time',
    String,
    ''
  )
  .option(
    '-i, --ignore <patterns...>',
    'Ignore these comma separated patterns',
    list,
    ignoreDefaults
  )
  .option('-n , --namespace <namespace>', 'Set namespace for string extraction')
  .option(
    '--localeDataFolder <localeDataFolder>',
    'Set path to write locale files to',
    filePath,
    localeDataFolderDefault
  )
  .option(
    '--searchPath <searchPath>',
    'Set path to search for files containing strings to be extracted'
  )
  .action(function(options) {
    const bundleData = readWebpackJson.readPythonPlugins({
      pluginFile: options.pluginFile,
      plugins: options.plugins,
      pluginPath: options.pluginPath,
    });
    let pathInfo;
    if (bundleData.length) {
      pathInfo = bundleData.map(bundle => {
        return {
          moduleFilePath: bundle.plugin_path,
          name: bundle.module_path,
        };
      });
    } else if (options.namespace && options.localeDataFolder && options.searchPath) {
      pathInfo = [
        {
          moduleFilePath: options.searchPath,
          name: options.namespace,
        },
      ];
    } else {
      cliLogging.error(
        'Must specify either Kolibri plugins or search path, locale path, and namespace.'
      );
      program.command('i18n-extract-messages').help();
    }
    const extractMessages = require('./i18n/ExtractMessages');
    extractMessages(pathInfo, options.ignore, options.localeDataFolder);
  });

program
  .command('i18n-transfer-context')
  .option('--pluginFile <pluginFile>', 'Set custom file which lists plugins that should be built')
  .option(
    '-p, --plugins <plugins...>',
    'An explicit comma separated list of plugins that should be built',
    list,
    []
  )
  .option(
    '--pluginPath <pluginPath>',
    'A system path to the plugin or module that should be added to the Python path so that it can be imported during build time',
    String,
    ''
  )
  .option(
    '-i, --ignore <patterns...>',
    'Ignore these comma separated patterns',
    list,
    ignoreDefaults
  )
  .option('-n , --namespace <namespace>', 'Set namespace for string extraction')
  .option(
    '--localeDataFolder <localeDataFolder>',
    'Set path to write locale files to',
    filePath,
    localeDataFolderDefault
  )
  .option(
    '--searchPath <searchPath>',
    'Set path to search for files containing strings to be extracted'
  )
  .action(function(options) {
    const bundleData = readWebpackJson.readPythonPlugins({
      pluginFile: options.pluginFile,
      plugins: options.plugins,
      pluginPath: options.pluginPath,
    });
    let pathInfo;
    if (bundleData.length) {
      pathInfo = bundleData.map(bundle => {
        return {
          moduleFilePath: bundle.plugin_path,
          name: bundle.module_path,
        };
      });
    } else if (options.namespace && options.localeDataFolder && options.searchPath) {
      pathInfo = [
        {
          moduleFilePath: options.searchPath,
          name: options.namespace,
        },
      ];
    } else {
      cliLogging.error(
        'Must specify either Kolibri plugins or search path, locale path, and namespace.'
      );
      program.command('i18n-transfer-context').help();
    }
    const syncContext = require('./i18n/SyncContext');
    syncContext(pathInfo, options.ignore, options.localeDataFolder);
  });

// I18N Create runtime message files
program
  .command('i18n-create-message-files')
  .option('--pluginFile <pluginFile>', 'Set custom file which lists plugins that should be built')
  .option(
    '-p, --plugins <plugins...>',
    'An explicit comma separated list of plugins that should be built',
    list,
    []
  )
  .option(
    '--pluginPath <pluginPath>',
    'A system path to the plugin or module that should be added to the Python path so that it can be imported during build time',
    String,
    ''
  )
  .option(
    '-i, --ignore <patterns...>',
    'Ignore these comma separated patterns',
    list,
    ignoreDefaults
  )
  .option('-n , --namespace <namespace>', 'Set namespace for string extraction')
  .option(
    '--localeDataFolder <localeDataFolder>',
    'Set path to write locale files to',
    filePath,
    localeDataFolderDefault
  )
  .option(
    '--searchPath <searchPath>',
    'Set path to search for files containing strings to be extracted'
  )
  .option(
    '--lang-info <langInfo>',
    'Set path for file that contains language information',
    filePath,
    langInfoDefault
  )
  .action(function(options) {
    const bundleData = readWebpackJson({
      pluginFile: options.pluginFile,
      plugins: options.plugins,
      pluginPath: options.pluginPath,
    });
    let pathInfo;
    if (bundleData.length) {
      pathInfo = bundleData.map(bundle => {
        let buildConfig = require(bundle.config_path);
        if (bundle.index !== null) {
          buildConfig = buildConfig[bundle.index];
        }
        const entry = buildConfig.webpack_config.entry;
        return {
          moduleFilePath: bundle.plugin_path,
          namespace: bundle.module_path,
          name: bundle.name,
          entry,
        };
      });
    } else if (options.namespace && options.localeDataFolder && options.searchPath) {
      pathInfo = [
        {
          moduleFilePath: options.searchPath,
          namespace: options.namespace,
          name: options.namespace,
        },
      ];
    } else {
      cliLogging.error(
        'Must specify either Kolibri plugins or search path, locale path, and namespace.'
      );
      program.command('i18n-create-message-files').help();
    }
    const csvToJSON = require('./i18n/csvToJSON');
    csvToJSON(pathInfo, options.ignore, options.langInfo, options.localeDataFolder);
  });

// I18N Untranslated, used messages
program
  .command('i18n-untranslated-messages')
  .option('--pluginFile <pluginFile>', 'Set custom file which lists plugins that should be built')
  .option(
    '-p, --plugins <plugins...>',
    'An explicit comma separated list of plugins that should be built',
    list,
    []
  )
  .option(
    '--pluginPath <pluginPath>',
    'A system path to the plugin or module that should be added to the Python path so that it can be imported during build time',
    String,
    ''
  )
  .option(
    '-i, --ignore <patterns...>',
    'Ignore these comma separated patterns',
    list,
    ignoreDefaults
  )
  .option('-n , --namespace <namespace>', 'Set namespace for string extraction')
  .option(
    '--localeDataFolder <localeDataFolder>',
    'Set path to write locale files to',
    filePath,
    localeDataFolderDefault
  )
  .option(
    '--searchPath <searchPath>',
    'Set path to search for files containing strings to be extracted'
  )
  .option(
    '--lang-info <langInfo>',
    'Set path for file that contains language information',
    filePath,
    langInfoDefault
  )
  .action(function(options) {
    const bundleData = readWebpackJson({
      pluginFile: options.pluginFile,
      plugins: options.plugins,
      pluginPath: options.pluginPath,
    });
    let pathInfo;
    if (bundleData.length) {
      pathInfo = bundleData.map(bundle => {
        let buildConfig = require(bundle.config_path);
        if (bundle.index !== null) {
          buildConfig = buildConfig[bundle.index];
        }
        const entry = buildConfig.webpack_config.entry;
        return {
          moduleFilePath: bundle.plugin_path,
          namespace: bundle.module_path,
          name: bundle.name,
          entry,
        };
      });
    } else if (options.namespace && options.localeDataFolder && options.searchPath) {
      pathInfo = [
        {
          moduleFilePath: options.searchPath,
          namespace: options.namespace,
          name: options.namespace,
        },
      ];
    } else {
      cliLogging.error(
        'Must specify either Kolibri plugins or search path, locale path, and namespace.'
      );
      program.command('i18n-untranslated-messages').help();
    }
    const untranslatedMessages = require('./i18n/untranslatedMessages');
    untranslatedMessages(pathInfo, options.ignore, options.langInfo, options.localeDataFolder);
  });

// I18N Profile
program
  .command('i18n-profile')
  .option('--pluginFile <pluginFile>', 'Set custom file which lists plugins that should be built')
  .option(
    '-p, --plugins <plugins...>',
    'An explicit comma separated list of plugins that should be built',
    list,
    []
  )
  .option(
    '--pluginPath <pluginPath>',
    'A system path to the plugin or module that should be added to the Python path so that it can be imported during build time',
    String,
    ''
  )
  .option(
    '-i, --ignore <patterns...>',
    'Ignore these comma separated patterns',
    list,
    ignoreDefaults
  )
  .option('-n , --namespace <namespace>', 'Set namespace for string extraction')
  .option(
    '--searchPath <searchPath>',
    'Set path to search for files containing strings to be extracted'
  )
  .option(
    '--output-file <outputFile>',
    'File path and name to which to write out the profile to',
    filePath
  )
  .action(function(options) {
    const bundleData = readWebpackJson({
      pluginFile: options.pluginFile,
      plugins: options.plugins,
      pluginPath: options.pluginPath,
    });
    let pathInfo;
    if (bundleData.length) {
      pathInfo = bundleData.map(bundle => {
        let buildConfig = require(bundle.config_path);
        if (bundle.index !== null) {
          buildConfig = buildConfig[bundle.index];
        }
        const entry = buildConfig.webpack_config.entry;
        return {
          moduleFilePath: bundle.plugin_path,
          namespace: bundle.module_path,
          name: bundle.name,
          entry,
        };
      });
    } else if (options.namespace && options.searchPath) {
      pathInfo = [
        {
          moduleFilePath: options.searchPath,
          namespace: options.namespace,
          name: options.namespace,
        },
      ];
    } else {
      cliLogging.error('Must specify either Kolibri plugins or search path and namespace.');
      program.command('i18n-profile').help();
    }
    const profileStrings = require('./i18n/ProfileStrings');
    profileStrings(pathInfo, options.ignore, options.outputFile);
  });

// Check engines, then process args
try {
  const engines = require(path.join(process.cwd(), 'package.json')).engines;
  checkVersion(engines, (err, results) => {
    if (err) {
      cliLogging.break();
      cliLogging.error(err);
      process.exit(1);
    }

    if (results.isSatisfied) {
      program.parse(process.argv);
      return;
    }

    for (const packageName of Object.keys(results.versions)) {
      if (!results.versions[packageName].isSatisfied) {
        let required = engines[packageName];
        cliLogging.break();
        cliLogging.error(`Incorrect version of ${packageName}.`);
        cliLogging.error(`${packageName} ${required} is required.`);
      }
    }

    cliLogging.break();
    process.exit(1);
  });
} catch (e) {
  program.parse(process.argv);
}
