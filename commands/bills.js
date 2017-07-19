const path = require('path');
const spawn = require('child_process').spawn;

module.exports = congress => {

  const run = path.join(__dirname, '..', 'congress/run');
  const bills = spawn(`.${run} bills`);

  bills.stdout.on('data', data => {
    console.log('stdout: ' + data.toString());
  });

  bills.stderr.on('data', err => {
    console.log('stderr: ' + err.toString());
  });

  bills.on('exit', code => {
    console.log('exit: ' + code.toString());
  });
};
