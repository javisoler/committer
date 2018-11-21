const inquirer = require('inquirer');
const chalk = require('chalk');
const { runCommand } = require('./utils');

const branches = async () => {
  try {
    const command = "git for-each-ref --format='%(refname:short)' refs/heads/";
    const output = await runCommand(command);

    if (output && output.length) {
      const lines = output.split('\n');
      const choices = lines.filter(line => line.length);

      const filesAnswers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedBranches',
          message: `\n 🗑  ${chalk.yellow(
            'Select the branches you want to delete:'
          )}`,
          choices,
          prefix: '',
          pageSize: 20,
        },
      ]);

      // console.log(filesAnswers.selectedBranches);

      console.log(
        `\n ☢️  ${chalk.whiteBright.bgRed.bold(
          'WARNING'
        )} You are about to delete the selected branches!`
      );
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldDelete',
          message: `${chalk.yellow.bold('Proceed?')}`,
          default: false,
          prefix: '',
        },
      ]);

      if (!answers.shouldDelete) {
        console.log(chalk.magentaBright('\n Phew! Operation aborted!'));
        return;
      }

      const commands = filesAnswers.selectedBranches.map(async branch => {
        const command = `git branch -d ${branch}`;
        await runCommand(command, true);
      });

      console.log('');
      await Promise.all(commands);

      console.log(` 🏆  ${chalk.greenBright('Done!')}`);
    }
  } catch (error) {
    return;
  }
};

module.exports = { branches };
