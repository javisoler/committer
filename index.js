#!/usr/bin/env node
const program = require('commander');
const chalk = require('chalk');
const exec = require('child_process').exec;
const fs = require('fs');
const os = require('os');
const path = require('path');
const read = require('read');

// READ CONFIG FROM FILE
let options;
try {
  options = require(path.resolve(os.homedir(), '.gitter.json'));
} catch (e) {
  options = {};
}


const displayError = (error) => {
  if (error && error.length) {
    console.log('');
    console.log(chalk.bgRed(`  ${error}`));
    console.log('');
  }
};

const getBranchName = () => {
  return new Promise((resolve, reject) => {
    const runScript = exec("git symbolic-ref HEAD | sed 's!refs\/heads\/!!'");

    runScript.stdout.on('data', data => resolve(data.trim()));
    runScript.stderr.on('data', data => reject(data));
  });
};

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    const runScript = exec(command);

    runScript.stdout.on('data', data => resolve(data));
    runScript.stderr.on('data', data => reject(data));
  });
};

const prompt = (message, defaultOption) => {
  return new Promise((resolve, reject) => {
    read({
      prompt: chalk.yellow(message),
      default: defaultOption,
    }, (error, result) => {
      if (error) {
        reject();
      } else {
        resolve(result);
      }
    });
  });
};

// EXIT IF NOT GIT REPO
if (!fs.existsSync('.git')) {
  displayError('Gitter can only be run inside a git repository!');
  return;
}


program
  .version('0.1.0')
  .option('-a, --all', 'Add all files to staging')
  .option('-m, --message <message>', 'Commit message')
  .option('-u, --user <user>', 'Add user initials to commit message')
  .option('-b, --branch', 'Add current branch name to commit message')
  .parse(process.argv);


const start = async () => {
  let userMessage;
  let message;
  let branchName = '';

  // PROMPT FOR MESSAGE IF NOT INCLUDED
  if (!program.message) {
    try {
      console.log('');
      userMessage = await prompt('Enter commit message:');

      if (!userMessage || !userMessage.trim().length) {
        displayError('Cannot commit without a message!');
        return;
      }
    } catch (error) {
      console.log('');
      return;
    }
  }

  // SET USER INITIALS
  if (options.userInitials || program.user) {
    message = `[${options.userInitials || program.user}] `;
  }

  // SET BRANCH NAME
  if (options.includeBranch || program.branch) {
    try {
      branchName = await getBranchName();
      message = `${message}[${branchName}] `;
    } catch (err) {
      console.error(err);
    }
  }

  // CONFIRM FINAL COMMIT MESSAGE WITH USER
  message = JSON.stringify(`${message}${program.message || userMessage}`);

  try {
    console.log(`\nYour commit message: ${chalk.green(message)}`);
    const shouldCommit = await prompt('Do you want to commit? ', 'Y');

    if (!/yes|y/.test(shouldCommit.toLowerCase())) {
      return;
    }
  } catch (error) {
    console.log('');
    return;
  }

  // ANOTHER WARNING IF BRANCH IS MASTER
  if (branchName.toLowerCase() === 'master') {
    try {
      console.log(`\n${chalk.white.bgRed.bold('WARNING!')} You are about to commit to master!`);
      const shouldCommit = await prompt('Do you want to proceed? ', 'N');

      if (/no|n/.test(shouldCommit.toLowerCase())) {
        console.log('\nOperation aborted!');
        return;
      }
    } catch (error) {
      console.log('');
      return;
    }
  }

  // ADD GIT OPTIONS
  let gitOptions = [];
  if (options.gitAddAll || program.all) {
    gitOptions.push('--all');
  }
  if (message) {
    gitOptions.push('--message');
  }

  // RUN GIT COMMIT
  try {
    const command = `git commit ${gitOptions.join(' ')} ${message}`;
    console.log(command);
    const output = await runCommand(command);
    console.log(output);
  } catch (error) {
    console.log(error);
    return;
  }
}

start();
