// console.log(process.argv);

const originalConsoleLog = console.log;
console.log = () => {
}

const JestCircus = require('jest-circus/runner');
const JestNodeEnvironment = require ('jest-environment-node');


console.log(require.toString());

async function run() {
  try {
    const result = await JestCircus({
      maxConcurrency: 1,
    }, {
      snapshotSerializers: [],
      fakeTimers: {},
      setupFilesAfterEnv: [],
      injectGlobals: false,


    }, JestNodeEnvironment, {
      requireInternalModule: (module) => {
        console.log('requireInternalModule', module);
        try {
          return require(module);
        } catch (e) {
          console.log('requireInternalModule error', e);
          throw e;
        }
      },
      requireModule: require,

      unstable_shouldLoadAsEsm: () => {
        console.log('unstable_shouldLoadAsEsm')
        return false;
      },
      setGlobalsForRuntime: (runtimeGlobals) => {
        Object.assign(global, runtimeGlobals);
      },
    }, process.argv[2], () => {
      console.log('XX message to jest');
    });

    originalConsoleLog(JSON.stringify(result));

  } catch (e) {
    console.log('error', e);
  }
}

console.log('start');

run();

console.log('end2');
