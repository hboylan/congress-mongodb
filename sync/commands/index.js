#!/usr/bin/env node

const congress = require('commander');

congress
  .version('1.0.0')
  .option('-s, --session [session]', 'Specify congressional session', 115);

congress.command('fetch', 'Fetch congress data to directory');

congress.command('remove', `Remove congress 'cache' or 'data'`).alias('rm');

congress.command('sync', 'Import data to $MONGODB_URI');

congress.parse(process.argv);
