#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');

const {
  displayError,
  runCommand,
  getBranchName,
  getIssueNameFromBranchName,
} = require('./lib/utils');
const { addFiles, getStagedFiles, getChangedFiles } = require('./lib/add');
const { fetchConfig, interactiveConfig } = require('./lib/config');
const { branches } = require('./lib/branches');
const version = require('./package.json').version;

// READ CONFIG FROM FILE
const options = fetchConfig();

// PARSE ARGUMENTS AND OPTIONS
program
  .version(version)
  .option('-a, --all', 'Add all files to staging')
  .option('-m, --message <message>', 'Commit message')
  .option('-u, --user <user>', 'Add user name to commit message')
  .option('-b, --branch', 'Add current branch name to commit message')
  .option(
    '-p, --parseIssue',
    'Attempt to parse issue name from the branch name'
  )
  .option('-s, --status', 'Show git status')
  .option('-f, --files', 'Interactively select files to commit')
  .option('--branches', 'Interactively delete local branches')
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

    if (program.parseIssue || options.parseIssue) {
      branchName = getIssueNameFromBranchName(branchName);
    }
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
      console.log(` ✏️  ${chalk.yellow.bold('Enter your commit message:')}`);

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
      options.wrapper ? ']' : ':'
    } `;
  }

  // CONFIRM FINAL COMMIT MESSAGE WITH USER
  message = `${message || ''}${program.message || userMessage}`;

  try {
    console.log(`\n Your commit message: "${chalk.greenBright(message)}"`);

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'commitAction',
        message: `\n 🚦 ${chalk.yellow.bold('Options:')}`,
        prefix: '',
        choices: [
          { name: 'Commit with message', value: 'commit' },
          { name: 'Edit commit message', value: 'edit' },
          { name: 'Cancel and exit', value: 'cancel' },
        ],
      },
    ]);

    if (answers.commitAction === 'cancel' || !answers.commitAction) {
      return;
    }

    if (answers.commitAction === 'edit') {
      const editAnswers = await inquirer.prompt([
        {
          type: 'editor',
          name: 'editedMessage',
          message: `✏️  ${chalk.yellow.bold('Edit message:')}`,
          prefix: '',
          default: message,
        },
      ]);

      message = editAnswers.editedMessage;
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
        `\n ☢️  ${chalk.whiteBright.bgRed.bold(
          'WARNING'
        )} You are about to commit to ${branchName.toLowerCase()}!`
      );
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldCommit',
          message: `${chalk.yellow.bold('Commit?')}`,
          default: false,
          prefix: '',
        },
      ]);

      if (!answers.shouldCommit) {
        console.log(chalk.magentaBright('\n Phew! Operation aborted!'));
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
    const command = `git commit ${gitOptions.join(' ')} ${JSON.stringify(
      message
    )}`;
    console.log('');
    await runCommand(command, true);

    console.log(` 🏆  ${chalk.greenBright('Done!')}`);
  } catch (error) {
    return;
  }
};

const startBranches = () => {
  branches();
};

async function checkIfGitRepo() {
  try {
    const command = `git rev-parse --is-inside-work-tree`;
    const isGitRepo = await runCommand(command);

    if (!isGitRepo) {
      return;
    }

    // Start the app
    if (!program.branches) start();
    else startBranches();
  } catch (error) {
    displayError('Committer can only be run inside a git repository!');
  }
}

checkIfGitRepo();
