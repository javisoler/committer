#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const os = require('os');
const path = require('path');
const inquirer = require('inquirer');

const { displayError, runCommand, getBranchName } = require('./lib/utils');
const { addFiles, getStagedFiles, getChangedFiles } = require('./lib/add');
const { fetchConfig, interactiveConfig } = require('./lib/config');

// READ CONFIG FROM FILE
const options = fetchConfig();

// PARSE ARGUMENTS AND OPTIONS
program
  .version('0.1.0')
  .option('-a, --all', 'Add all files to staging')
  .option('-m, --message <message>', 'Commit message')
  .option('-u, --user <user>', 'Add user name to commit message')
  .option('-b, --branch', 'Add current branch name to commit message')
  .option('-s, --status', 'Show git status')
  .option('-f, --files', 'Interactively select files to commit')
  .option('-c, --config', 'Configuration wizard')
  .parse(process.argv);

// LAUNCH CONFIGURATION SETUP
if (program.config) {
  interactiveConfig();
  return;
}

// MAIN
const start = async () => {
  let userMessage;
  let message;
  let branchName = '';

  // Get the branch name
  try {
    branchName = await getBranchName();
  } catch (err) {
    console.error(err);
  }

  if (program.status) {
    try {
      const command = `git status`;
      const output = await runCommand(command);

      console.log(chalk.dim(output));
    } catch (error) {
      console.log(error);
      return;
    }
  }

  if (program.files || options.showFiles) {
    await addFiles();

    // Check after files selection if any was staged
    const stagedFiles = await getStagedFiles();

    if (!stagedFiles || !stagedFiles.length) {
      displayError('No files staged for commit!');
      return;
    }
  } else {
    // If no files selection check for changed or staged files
    const stagedFiles = await getStagedFiles();
    const changedFiles = await getChangedFiles();

    // Exit if no `-a` selected and no staged files
    if (
      !(options.gitAddAll || program.all) &&
      !stagedFiles.length &&
      (changedFiles.add.length || changedFiles.remove.length)
    ) {
      displayError('No files staged for commit!');
      return;
    }

    // Exit if no changed nor staged files
    if (
      !changedFiles.add.length &&
      !changedFiles.remove.length &&
      !stagedFiles.length
    ) {
      displayError('Nothing to commit!');
      return;
    }
  }

  // PROMPT FOR MESSAGE IF NOT INCLUDED
  if (!program.message) {
    try {
      if (!program.status) console.log('');

      console.log(`💻  ${chalk.yellow.bold('Enter your commit message:')}`);

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'userMessageInput',
          message: '>>>',
          prefix: '',
        },
      ]);

      userMessage = answers.userMessageInput;

      if (!userMessage || !userMessage.trim().length) {
        displayError('Cannot commit without a message!');
        return;
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }

  // SET USER INITIALS
  if (options.userName || program.user) {
    message = `${options.wrapper ? '[' : ''}${program.user ||
      options.userName}${options.wrapper ? ']' : ''} `;
  }

  // SET BRANCH NAME
  if ((options.includeBranch || program.branch) && branchName.length) {
    message = `${message || ''}${options.wrapper ? '[' : ''}${branchName}${
      options.wrapper ? ']' : ''
    } `;
  }

  // CONFIRM FINAL COMMIT MESSAGE WITH USER
  message = JSON.stringify(`${message || ''}${program.message || userMessage}`);

  try {
    console.log(`\nYour commit message: ${chalk.greenBright(message)}`);

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldCommit',
        message: 'Commit?',
        prefix: '',
      },
    ]);

    if (!answers.shouldCommit) {
      return;
    }
  } catch (error) {
    console.log('');
    return;
  }

  // ANOTHER WARNING IF BRANCH IS PROTECTED
  if (
    options.protectedBranches &&
    options.protectedBranches.indexOf(branchName.toLowerCase()) > -1
  ) {
    try {
      console.log(
        `\n‼️  ${chalk.white.bgRed.bold(
          'WARNING!'
        )} You are about to commit to ${branchName.toLowerCase()}!`
      );
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldCommit',
          message: 'Commit?',
          default: false,
          prefix: '',
        },
      ]);

      if (!answers.shouldCommit) {
        console.log(chalk.magentaBright('\nPhew! Operation aborted!'));
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
    const output = await runCommand(command);

    console.log('');
    console.log(chalk.dim(output));
    console.log(`🏆  ${chalk.greenBright('Done!')}`);
  } catch (error) {
    console.log(error);
    return;
  }
};

async function checkIfGitRepo() {
  try {
    const command = `git rev-parse --is-inside-work-tree`;
    const isGitRepo = await runCommand(command);

    if (!isGitRepo) {
      return;
    }

    // Start the app
    start();
  } catch (error) {
    displayError('Committer can only be run inside a git repository!');
  }
}

checkIfGitRepo();
