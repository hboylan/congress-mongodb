const Promise = require('bluebird');
const mongodb = require('mongodb');
const congress = require('./congress');
const util = require('./util');

module.exports = (data, u) => {
  let uri = u;

  return new Promise((resolve, reject) => {
    if (!uri) return reject('$MONGODB_URI not set!');

    // MongoDB connect
    mongodb.MongoClient.connect(uri, (err, db) => {
      console.log(err)

      db.collections((err, collections) => {
        util.info(`Database:\n${uri}\n`);
        util.info(`Collections:\n${collections.map(c => c.s.name).join('\n')}\n`);

        // MongoDB driver collections
        db.Bill = db.collection('bills');
        db.BillSubject = db.collection('bill_subjects');
        db.Committee = db.collection('committees');
        db.CommitteeMember = db.collection('committee_members');
        db.Member = db.collection('members');
        db.Vote = db.collection('votes');

        // sync congress
        congress(data, db)
          .then(resolve, reject); // comment this to output error stack
      })
    });
  });
};
