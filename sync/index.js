const Promise = require('bluebird');
const mongodb = require('mongodb');
const congress = require('./congress');
let uri = process.env.MONGODB_URI;

module.exports = (data, u) => {
  uri = u || uri;

  return new Promise((resolve, reject) => {
    if (!uri) return reject('$MONGODB_URI not set!');

    // MongoDB connect
    mongodb.MongoClient.connect(uri, (err, db) => {

      db.collections((err, collections) => {
        console.log(`Syncing to ${uri}:\n${collections.map(c => c.s.name).join('\n')}\n`);
      })

      // MongoDB Driver collections
      db.Bill = db.collection('bills');
      db.BillSubject = db.collection('bill_subjects');
      db.Committee = db.collection('committees');
      db.CommitteeMember = db.collection('committee_members');
      db.Member = db.collection('members');

      // sync congress
      return congress(data, db)
        .then(resolve, reject); // comment this to output error stack
    });
  });
};
