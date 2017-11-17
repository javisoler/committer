const fs = require('fs');
const inquirer = require('inquirer');

const { runCommand } = require('./utils');

const getStagedFiles = async () => {
  try {
    const files = [];
    const command = `git diff --name-status --cached`;
    const output = await runCommand(command);

    if (output && output.length) {
      const lines = output.replace(new RegExp(/[A-Z]\t/, 'g'), '').split('\n');

      lines.forEach(line => line.length && files.push(line));
    }

    return files;
  } catch (error) {
    console.log(error);
    return;
  }
};

const getChangedFiles = async () => {
  try {
    const files = [];
    const command = `git add -A --dry-run`;
    const output = await runCommand(command);

    if (output && output.length) {
      const lines = output.split('\n');

      lines.forEach(line => {
        if (line.length) {
          let parsedLine = line.match(/'(.*)'/);
          if (parsedLine && parsedLine[1]) {
            files.push(parsedLine[1]);
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

    if (changedFiles.length) {
      let shouldPopSeparator = true;
      choices.push(new inquirer.Separator('---- CHANGED ---'));

      changedFiles.forEach(file => {
        if (stagedFiles.indexOf(file) < 0) {
          choices.push({ value: file });
          shouldPopSeparator = false;
        }
      });

      shouldPopSeparator && choices.pop();
    }

    const filesAnswers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'files',
        message: 'Select files to add to the commit:',
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
          console.log(resetCommand);
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
          console.log(stageCommand);
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
