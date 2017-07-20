#!/usr/bin/env node

const chalk = require('chalk');
const path = require('path');
const spawn = require('child_process').spawn;
const congress = require('commander');

congress
  .parse(process.argv);

if (!congress.args.length) {
  console.log(chalk.red('missing target!'));
  return process.exit(1);
}

const targets = congress.args;
const root = path.join(__dirname, '..');
const dirs = {
  cache: 'congress/cache',
  data: 'congress/data'
};

// validate
const opts = Object.keys(dirs);
const invalid = [];
targets.forEach((t, i) => {
  if (opts.indexOf(t) == -1) {
    invalid.push(t);
  } else {
    targets[i] = path.join(root, dirs[t]);
  }
});

// failure
if (invalid.length) {
  console.log(`invalid target${invalid.length === 1 ? '' : 's'}: ${invalid.join(', ')}`);
  return process.exit(1);
}

// execute
const str = targets.join('\n');
console.log(`removing...\n${str}`);
const rm = spawn('rm', ['-rf'].concat(targets));

rm.stdout.on('data', data => {
  console.log('stdout: ' + data.toString());
});

rm.stderr.on('data', err => {
  console.log('stderr: ' + err.toString());
});

rm.on('exit', code => {
  switch (code) {
    case 0:
      console.log(`done!`);
      break;
    default:
      console.log(`failed!\n${code}`);
  }
});
