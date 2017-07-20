#!/usr/bin/env node

const path = require('path');
const spawn = require('child_process').spawn;
const congress = require('commander');
const util = require('../util');

congress
  .option('-d, --data <directory>', 'Directory for congress data', 'congress')
  .parse(process.argv);

// validate
const root = congress.rawArgs.indexOf('-d') === -1 ? util.root : process.cwd();
congress.data = path.join(root, congress.data);
util.isDir(congress.data);
util.info(`fetching...\n${congress.data}\n`);

// bills
function getBills() {
  const bills = spawn('python', [util.run, 'bills'], {
    cwd: congress.data,
    stdio: [process.stdin, process.stdout, process.stderr]
  });

  bills.on('exit', code => {
    switch (code) {
      case 0:
        util.done();
        break;
      default:
        util.error(`error!\n${code}`);
    }
  });
}

// sitemaps
function getSitemaps() {
  const fdsys = spawn('python', [util.run, 'fdsys', '--collections=BILLSTATUS'], {
    cwd: congress.data,
    stdio: [process.stdin, process.stdout, process.stderr]
  });

  fdsys.on('exit', code => {
    if (!code) {
      getBills();
    }
  });
}

// copy congress-legislators
function copyLegislators() {
  if (util.isLocal(congress.data)) return getSitemaps();

  let copy = spawn('/bin/sh', [
    '-c',
    `cp ${path.join(util.legislators, '*.json')} ${congress.data}`
  ], {
    cwd: congress.data,
    stdio: [process.stdin, process.stdout, process.stderr]
  });

  copy.on('exit', code => {
    switch (code) {
      case 0:
        getSitemaps();
        break;
      default:
        util.error(`error!\n${code}`);
    }
  });
}

copyLegislators();
