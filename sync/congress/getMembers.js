const util = require('../util');
const chambers = {
  sen: 'senate',
  rep: 'house'
};

module.exports = sync => {
  util.info('Starting members...');

  return sync.json.readFileAsync(sync.paths.members)
    .then(list => {
      let bulk = sync.db.Member.initializeUnorderedBulkOp()

      list.forEach(json => {
        util.log(`${util.chalk.white('Member (current):')} ${json.name.official_full}`);

        let term = json.terms[json.terms.length - 1]
        json.current = true
        json.chamber = chambers[term.type]
        json.party = term.party.toLowerCase()
        json.state = term.state
        bulk.find({'id.govtrack': json.id.govtrack})
          .upsert()
          .update({$set: json })
      })

      return bulk.execute()
    })
    .then(res => {
      util.info('Finished members...\n');
      return sync.response(res);
    });
};
