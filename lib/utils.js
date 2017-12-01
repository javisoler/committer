const { exec } = require('child_process');
const chalk = require('chalk');

const displayError = (error) => {
  if (error && error.length) {
    console.log('');
    console.log(`⛔️  ${chalk.magentaBright(error)}`);
    console.log('');
  }
};

const isGitRepo = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const command = `git rev-parse --is-inside-work-tree`;
      const output = await runCommand(command);

      resolve(output);
    } catch (error) {
      reject(error);
    }
  });
}

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    const runScript = exec(command);

    runScript.stdout.on('data', data => resolve(data));
    runScript.stderr.on('data', data => reject(data));
    runScript.on('exit', (code, signal) => resolve());
  });
};

// TODO: BUG: This returns undefined if the branch is new and without commits
const getBranchName = () => {
  return new Promise((resolve, reject) => {
    const runScript = exec("git symbolic-ref HEAD | sed 's!refs\/heads\/!!'");

    runScript.stdout.on('data', data => resolve(data.trim()));
    runScript.stderr.on('data', data => reject(data));
  });
};


module.exports = {
  displayError,
  runCommand,
  getBranchName,
  isGitRepo,
}
