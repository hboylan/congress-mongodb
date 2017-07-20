const util = require('../util');
const titleMap = {
  'Chair': 'chair',
  'Chairman': 'chairman',
  'Cochairman': 'co_chairman',
  'Co-Chairman': 'co_chairman',
  'Ex Officio': 'ex_officio',
  'Ranking Member': 'ranking_member',
  'Vice Chair': 'vice_chair',
  'Vice Chairman': 'vice_chairman'
}

module.exports = sync => {
  util.info('Starting committee-members...');

  /**
   * Sync committee members
   */
  return sync.json.readFileAsync(sync.paths.committeeMembers)

    // map committee.thomas_id -> [committee_member]
    .then(committeeMap => {

      let ids = Object.keys(committeeMap)
      let bulkCommittee = sync.db.Committee.initializeUnorderedBulkOp()
      let bulkCommitteeMember = sync.db.CommitteeMember.initializeUnorderedBulkOp()

      return Promise
        .map(ids, thomas => {

          // get committee
          return sync.db.Committee
            .findOne({thomas_id: thomas})
            .then(committee => {

              // get members
              const memberIds = committeeMap[thomas].map(m => m.thomas)
              return sync.db.Member
                .find({'id.thomas': {$in: memberIds}})
                .toArray()
                .then(members => {
                  return {
                    committee: committee,
                    thomas: thomas,
                    members: members
                  }
                })
          })
        })
        .each(res => {

          // map member.id.thomas -> member._id
          const memberMap = {}
          res.members.forEach(m => {
            memberMap[m.id.thomas] = m
          })

          // iterate committee member data
          committeeMap[res.thomas].forEach(committeeMember => {
            const member = memberMap[committeeMember.thomas]

            // parse member
            if (committeeMember.title) {
              committeeMember.title = titleMap[committeeMember.title]
              res.committee.leadership[committeeMember.title] = member._id
            }
            if (member.id.govtrack) {
              committeeMember.govtrack = member.id.govtrack;
            }

            // upsert member
            bulkCommitteeMember.find({
                member: member._id,
                committee: res.committee._id
              })
              .upsert()
              .update({$set: committeeMember})
          })

          // update committee
          bulkCommittee.find({_id: res.committee._id})
            .update({$set: res.committee});
        })
        .then(() => bulkCommittee.execute())
        .then(() => bulkCommitteeMember.execute())
        .then(res => {
          util.info('Finished committee-members...\n');
          return sync.response(res);
        });
  })
}
