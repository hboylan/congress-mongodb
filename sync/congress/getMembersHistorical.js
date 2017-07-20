const util = require('../util');

module.exports = sync => {
  util.info('Starting historical members...');

  // get JSON
  return sync.json.readFileAsync(sync.paths.membersHistorical)
    .then(list => {

      // upsert Mongo
      let bulk = sync.db.Member.initializeUnorderedBulkOp()
      for (let i in list) {
        const json = list[i];
        util.log(`${util.chalk.white('Member (historic):')} ${json.name.first} ${json.name.last}`);
        bulk.find({'id.bioguide': json.id.bioguide}).upsert().update({$set: json});
      }
      return bulk.execute()
    })
    .then(res => {
      util.info('Finished historical members...\n');
      return sync.response(res);
    });
};
