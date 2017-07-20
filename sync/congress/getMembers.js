var Promise = require('bluebird')

const chambers = {
  sen: 'senate',
  rep: 'house'
}

module.exports = sync => {
  console.log('Starting members...');

  return sync.json.readFileAsync(sync.paths.members)
    .then(list => {
      let bulk = sync.db.Member.initializeUnorderedBulkOp()

      list.forEach(json => {
        console.log(`Found member: ${json.name.official_full}`)

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
      console.log('Finished members...');
      return sync.response(res);
    });
}
