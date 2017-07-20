const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const util = {};


/* I/O */

util.root = path.join(__dirname, '../..');

util.data = path.join(util.root, 'congress');

util.legislators = path.join(util.root, 'congress-legislators');

util.run = path.join(util.data, 'run');

util.isLocal = data => {
  return data === util.data;
};


/* Helpers */

util.info = str => {
  console.log(chalk.white(str));
};

util.error = err => {
  console.log(chalk.red(err));
};

util.log = console.log;

util.isDir = str => {
  try {
    if (!fs.statSync(str).isDirectory()) throw new Error();
  } catch (e) {
    util.error('invalid directory!');
    return process.exit(1);
  }
}

util.done = msg => {
  util.info(msg || 'done!');
};

util.paths = data => {
  const isLocal = util.isLocal(data);
  const legislators = isLocal ? path.join(util.root, 'congress-legislators') : data;
  return {
    congress: path.join(data, 'data'),
    committeeMembers: `${legislators}/committee-membership-current.json`,
    committees: `${legislators}/committees-current.json`,
    committeesHistorical: `${legislators}/committees-historical.json`,
    members: `${legislators}/legislators-current.json`,
    membersHistorical: `${legislators}/legislators-historical.json`
  };
};

module.exports = util;
