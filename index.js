#!/usr/bin/env node

const congress = require('commander');
const commands = require('./commands');

congress.version('1.0.0')
  .arguments('[cmd]')
  .option('-s, --session [session]', 'Specify congressional session', 115)
  .action(commands)
  .parse(process.argv)
