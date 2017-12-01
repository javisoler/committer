const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');

const { runCommand } = require('./utils');

const typesMap = {
  M:     chalk.yellow('MODIFIED'),
  D:     chalk.red('DELETED '),
  A:     chalk.green('ADDED   '),
  R100:  chalk.magenta('RENAMED '),
}

const getStagedFiles = async () => {
  try {
    const files = [];
    const command = `git diff --name-status --cached`;
    const output = await runCommand(command);

    if (output && output.length) {
      const lines = output.split('\n');

      lines.forEach(line => {
        if (line.length) {
          const parsed = line.split('\t');
          let formattedLine = `${typesMap[parsed[0]]} ${parsed[1]}`;
          if (parsed[2]) {
            formattedLine += ` > ${parsed[2]}`;
          }

          files.push(formattedLine);
        }
      });
    }

    return files;
  } catch (error) {
    console.log(error);
    return;
  }
};

const getChangedFiles = async () => {
  try {
    const files = {
      add: [],
      remove: [],
    };

    const command = `git add -A --dry-run`;
    const output = await runCommand(command);

    if (output && output.length) {
      const lines = output.split('\n');

      lines.forEach(line => {
        if (line.length) {
          let parsedLine = line.match(/(\w+\s)\'(.+)\'/i);

          if (parsedLine) {
            const group = parsedLine[1].trim();
            const file = parsedLine[2].trim();

            files[group].push(file);
          }
        }
      });
    }

    return files;
  } catch (error) {
    console.log(error);
    return;
  }
};

const addFiles = () => {
  return new Promise(async (resolve, reject) => {
    const stagedFiles = await getStagedFiles();
    const changedFiles = await getChangedFiles();

    const choices = [];

    if (stagedFiles.length) {
      choices.push(new inquirer.Separator('---- STAGED ----'));

      stagedFiles.forEach(file => {
        choices.push({
          value: file,
          checked: true,
        });
      });
    }

    if (changedFiles && changedFiles.add.length) {
      let shouldPopSeparator = true;
      choices.push(new inquirer.Separator('---- CHANGES ---'));

      changedFiles.add.forEach(file => {
        if (stagedFiles.indexOf(file) < 0) {
          choices.push({ value: file });
          shouldPopSeparator = false;
        }
      });

      shouldPopSeparator && choices.pop();
    }

    if (changedFiles && changedFiles.remove.length) {
      let shouldPopSeparator = true;
      choices.push(new inquirer.Separator('--- DELETED ---'));

      changedFiles.remove.forEach(file => {
        if (stagedFiles.indexOf(file) < 0) {
          choices.push({ value: file });
          shouldPopSeparator = false;
        }
      });

      shouldPopSeparator && choices.pop();
    }

    // TODO: check if there are any files to commit before showing this msg
    const filesAnswers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'files',
        message: `\n📂  ${chalk.yellow('Select files to add to the commit:')}`,
        choices,
        prefix: '',
        pageSize: 20
      }
    ]);

    if (filesAnswers.files) {
      // Go through staged files and check they're still 
      // on the final list, otherwise remove.
      let resetCommand = 'git reset';

      stagedFiles.forEach(stagedFile => {
        if (filesAnswers.files.indexOf(stagedFile) < 0) {
          resetCommand += ` ${stagedFile}`;
        }
      });

      if (resetCommand !== 'git reset') {
        try {
          await runCommand(resetCommand);
          resolve();
        } catch (error) {
          reject(error);
        }
      }

      // Stage the rest of the files
      let stageCommand = 'git add';

      filesAnswers.files.forEach(file => {
        // Ignore already staged files
        if (stagedFiles.indexOf(file) < 0) {
          stageCommand += ` ${file}`;
        }
      });

      if (stageCommand !== 'git add') {
        try {
          await runCommand(stageCommand);
          resolve();
        } catch (error) {
          resolve(error);
        }
      } else {
        resolve();
      }
    } else {
      resolve();
    }
  });
};

module.exports = { addFiles, getStagedFiles };
