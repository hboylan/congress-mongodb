const mongodb = require('mongodb');
const congress = require('./congress');
const uri = process.env.MONGODB_URI;

module.exports = () => {

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
    return congress(db)
      .then(res => {
        console.log('Congress synced:', JSON.stringify(res, null, 2))
        console.log('Sync complete!')
        process.exit(0)
      }, err => {
        console.log('Congress error:', err)
        console.log('Sync failed!')
        process.exit(0)
      });
  });
};
