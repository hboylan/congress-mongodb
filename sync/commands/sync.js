#!/usr/bin/env node --max_old_space_size=4096

const path = require('path');
const spawn = require('child_process').spawn;
const congress = require('commander');
const util = require('../util');

congress
  .option('-d, --data <directory>', 'Directory for congress data', 'congress')
  .option('-u, --uri <uri>', 'MongoDB URI', process.env.MONGODB_URI || 'mongodb://localhost:27017/congress')
  .parse(process.argv);

// validate
const root = congress.rawArgs.indexOf('-d') === -1 ? util.root : process.cwd();
congress.data = path.join(root, congress.data);
util.isDir(congress.data);
util.info(`syncing...\n\nData:\n${congress.data}\n`);

// sync
require(path.join(util.root, 'sync'))(congress.data, congress.uri);
