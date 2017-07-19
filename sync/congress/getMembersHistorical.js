var Promise = require('bluebird')

module.exports = (sync) => {

  // get JSON
  return sync.json.readFileAsync(sync.paths.membersHistorical).then(list => {

    // upsert Mongo
    var bulk = sync.db.Member.initializeUnorderedBulkOp()
    for (var i in list) {
      let json = list[i]
      bulk.find({ 'id.thomas': json.id.thomas }).upsert().update({ $set: json })
    }
    return bulk.execute()
  })
}
