const { exec } = require('child_process');
const chalk = require('chalk');

const displayError = error => {
  if (error && error.length) {
    console.log('');
    console.log(` ⛔️  ${chalk.magentaBright(error)}`);
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
};

const runCommand = command => {
  return new Promise((resolve, reject) => {
    const runScript = exec(command);

    runScript.stdout.on('data', data => resolve(data));
    runScript.stderr.on('data', data => reject(data));
    runScript.on('exit', (code, signal) => resolve());
  });
};

const getBranchName = () => {
  return new Promise((resolve, reject) => {
    const runScript = exec("git symbolic-ref HEAD | sed 's!refs/heads/!!'");

    runScript.stdout.on('data', data => resolve(data.trim()));
    runScript.stderr.on('data', data => reject(data));
  });
};

const getIssueNameFromBranchName = branch => {
  let issue = branch;

  if (branch && branch.length) {
    // Get the last item separated by forward slashes
    if (branch.indexOf('/') > -1) {
      issue = branch.split('/').pop();
    }
    
    // the first block that matches WORD-NUMBER.
    const matches = issue.match(/\w+-\d+/gi);
    if (matches && matches.length) {
      issue = matches[0];
    }
  }

  return issue;
};

module.exports = {
  displayError,
  runCommand,
  getBranchName,
  getIssueNameFromBranchName,
  isGitRepo,
};
