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
| `-s, --status` | Show the `git status` to start with |
| `-f, --files` | Interactively select files to commit |
| `-c, --config` | Interactively set up configuration |

### Configuration
To turn on some options by default run the configuration utility with `cmtr --config`. The configuration will be saved in `~/.cmtr-config.json`, which can be created/edited manually if desired.

```json
{
  "userName": "JS",         /* Prepend user name */
  "includeBranch": true,    /* Prepend branch name */
  "wrapper": true,          /* Wrap user and branch with `[]` */
  "showFiles": true,        /* Show interactive file selector */
  "gitAddAll": false,       /* Add all files to commit */
  "protectedBranches": [    /* Warn before committing to these branches */
    "master",
    "develop"
  ]
}
```

Happy committing!
