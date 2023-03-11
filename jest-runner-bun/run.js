const os = require('os');
const fs = require('fs');
const path = require('path');
const { pass, fail } = require('create-jest-runner');
const babel = require('@babel/core');


const execSync = require('child_process').execSync;

module.exports = async ({ testPath, config }) => {
  const start = new Date();
  const cfg = {}
  const runnerConfig = Object.assign(
    { monorepo: false, outDir: 'dist', srcDir: 'src' },
    cfg.config
  );

  runnerConfig.isMonorepo =
    typeof runnerConfig.isMonorepo === 'function'
      ? runnerConfig.isMonorepo
      : () => runnerConfig.monorepo;

  let result = null;

  try {
    const stdout = execSync(`bun ${require.resolve('./bunRunner.js')} ${testPath}`, {stdio : 'pipe' });
    // console.log(`stdout: ${stdout}`);
    // console.error(`stderr: ${stderr}`);

    result = JSON.parse(stdout);
  } catch (err) {
    console.error('err', err.stderr);
    return fail({
      start,
      end: new Date(),
      test: { path: testPath, title: 'Babel', errorMessage: err.message },
    });
  }

  // Classics in the genre! Yes, it's possible, sometimes.
  // Old habit for ensurance
  if (!result) {
    return fail({
      start,
      end: new Date(),
      test: {
        path: testPath,
        title: 'Babel',
        errorMessage: 'Babel failing to transform...',
      },
    });
  }


  return result;
};
