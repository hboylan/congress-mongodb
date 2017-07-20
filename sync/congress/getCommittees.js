const extend = require('util')._extend;
const Promise = require('bluebird');
const util = require('../util');

module.exports = sync => {
  util.info('Starting committees...');

  // return subcommittee ids
  function _subcommittees(committee) {
    util.log(`Found ${committee.type } committee: ${committee.name}`)
    if (!Array.isArray(committee.subcommittees)) return;

    let bulk = sync.db.Committee.initializeUnorderedBulkOp()
    for (let i in committee.subcommittees) {
      let sub = ({}, committee.subcommittees[i])
      util.log(`Found sub committee: ${sub.name}`)
      sub.leadership = {}
      sub.thomas_id = committee.thomas_id + sub.thomas_id
      sub.type = 'sub'
      bulk.find({thomas_id: sub.thomas_id})
        .upsert()
        .update({$set: sub})
    }

    return bulk.execute()
      .then(res => res.getUpsertedIds().map(item => item._id))
  }

  /**
   * Sync committees
   */
  return sync.json.readFileAsync(sync.paths.committees)
    .then(list => {
      let bulk = sync.db.Committee.initializeUnorderedBulkOp()

      return Promise
        .map(list, _subcommittees)
        .each((subcommittees, i) => {

          let committee = list[i]
          committee.leadership = {}

          // set subcommittee ids
          committee.subcommittees = subcommittees

          // bulk upsert
          bulk.find({thomas_id: committee.thomas_id})
            .upsert()
            .update({$set: committee})
        })
        .then(() => bulk.execute())
        .then(res => {
          util.info('Finished committees...\n');
          return sync.response(res);
        });
    })
}
