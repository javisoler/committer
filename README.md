# CMTR (committer)

`cmtr` is a small command line utility to aid with [git](https://git-scm.com/) commits, especially the commit message.

The motivation for this project arises from trying to harmonise commit messages between members of a team. We wanted everybody to prepend their commit messages with their initials and the branch name, so that they're easier to identify and to facilitate integration with other tools that try to read branch names from commit messages.

As part of the experimentation with git and node that inspires this project, a very basic files selection tool has been included, to be able to view, select and de-select files before committing them.

## Installation

`cmtr` is written in JavaScript, so [Node](https://nodejs.org/) needs to be installed in the system. 

When Node is installed, `npm` will be available. So just run the following command to install:
```bash
npm install -g cmtr
```
You can use [Yarn](https://yarnpkg.com/) as well:
```bash
yarn global add cmtr
```

## Usage

Run `cmtr` inside a git repository:
```bash
cmtr
```
To run with options:
```bash
cmtr -am 'My commit message' -u 'JS'
```

### Options

| Option | Description |
| ---  | --- |
| `-a, --all` | Add all files to staging (just runs `git add --all`) |
| `-m, --message <msg>` | Commit message |
| `-u, --user <usr>` | Prepend user name to commit message |
| `-b, --branch` | Prepend current branch name to commit message |
| `-p, --parseIssue` | Attempt to parse issue name from the branch name |
| `-s, --status` | Show the `git status` to start with |
| `-f, --files` | Interactively select files to commit |
| `-c, --config` | Interactively set up configuration |

Sometimes we name branches with the Jira issue plus some description with a combination of dashes or underscores. The `parseIssue` option will try to extract the issue name from it. For instance, from the branch name "feature/CODE-100_Some-description" the program will extract "CODE-100" and prepend it to the commit message.

### Configuration
To turn on some options by default run the configuration utility with `cmtr --config`. The configuration will be saved in `~/.cmtr-config.json`, which can be created/edited manually if desired.

This is an example configuration:
```json
{
  "userName": "JS",
  "includeBranch": true,
  "parseIssue": true,
  "wrapper": true,
  "showFiles": true,
  "protectedBranches": [
    "master",
    "develop"
  ]
}
```
Possible values for the configuration file:

| Key | Type | Description |
| ---  | --- | --- |
| `userName` | `string` | Prepend user name |
| `includeBranch` | `boolean` | Prepend branch name |
| `parseIssue` | `boolean` | Extract Jira style issue name from the branch |
| `wrapper` | `boolean` | Wrap user and branch with `[]` |
| `showFiles` | `boolean` | Show interactive file selector |
| `gitAddAll` | `boolean` | Add all files to commit |
| `protectedBranches` | `array[string]` | Warn before committing to the branches specified |

Happy committing!
