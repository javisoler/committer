const os = require('os');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');

const CONFIG_FILENAME = '.cmtr-config.json';
const CONFIG_PATH = path.resolve(os.homedir(), CONFIG_FILENAME);

const fetchConfig = () => {
  let cmtrConfig;

  try {
    cmtrConfig = require(CONFIG_PATH);
  } catch (e) {
    cmtrConfig = {};
  }

  return cmtrConfig;
};

const saveConfig = options => {
  try {
    const config = JSON.stringify(options, null, 2);

    fs.writeFileSync(CONFIG_PATH, config);
  } catch (error) {
    console.log(error);
  }
};

const interactiveConfig = async () => {
  console.log(
    `Configure ${chalk.yellowBright(
      'cmtr'
    )} with some defaults (leave empty if you don't want to set that)`
  );
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'userName',
      message: 'User name to show in commit message:',
    },
    {
      type: 'confirm',
      name: 'includeBranch',
      message: 'Do you want to show the branch name in commit message:',
    },
    {
      type: 'confirm',
      name: 'wrapper',
      message: 'Do you want to use `[]` to wrap user name and branch:',
    },
    {
      type: 'confirm',
      name: 'showFiles',
      message: 'Do you want to select files interactively before committing:',
    },
    {
      type: 'confirm',
      name: 'gitAddAll',
      message:
        'Do you want to add all files before committing (git add --all):',
      when: answers => !answers.showFiles,
    },
    {
      type: 'confirm',
      name: 'setProtectedBranches',
      message: 'Do you want to set up protected git branches:',
    },
    {
      type: 'input',
      name: 'protectedBranchesString',
      message:
        'Enter the names of the branches you want to protect (separated by spaces):',
      when: answers => answers.setProtectedBranches,
    },
  ]);

  if (answers.setProtectedBranches && answers.protectedBranchesString) {
    answers.protectedBranches = answers.protectedBranchesString.split(' ');
  }
  if (answers.userName.trim() === '') {
    delete answers.userName;
  }
  delete answers.setProtectedBranches;
  delete answers.protectedBranchesString;

  saveConfig(answers);

  console.log(`\n✨  ${chalk.greenBright('Configuration saved!')}`);
};

module.exports = {
  fetchConfig,
  interactiveConfig,
};
