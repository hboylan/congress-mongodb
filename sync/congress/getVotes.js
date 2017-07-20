const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const util = require('../util');

module.exports = sync => {
  util.info('Starting votes...');

  const _getMember = json => {
    const error = () => {
      return new Error("Failed to get member: (" + json.id + ") " + json.display_name)
    }
    return sync.db.Member.findOne({ $or: [{'id.bioguide': json.id }, {'id.lis': json.id}] })
      .then(member => !member ? error() : member._id, error);
  }

  // /data/congress/{congress}/votes/{year}/{vote}
  const _getVote = votePath => {
    var file = path.join(votePath, 'data.json')
    var json = JSON.parse(fs.readFileSync(file, 'utf8'))

    // iterate votes
    return Promise.map(Object.keys(json.votes), key => {

      // iterate members
      return Promise.map(json.votes[key], _getMember).then(members => {

        // reduce members
        return Promise.reduce(members, (list, next) => {
          return Array.isArray(list) ? list.concat([next]) : [next]
        })

      // relate members to key
      }).then(members => {
        return { key: key, members: members}
      }, { concurrency: 1 })

    // done
    }).then(list => {
      list.forEach(next => {
        delete json.votes[next.key]
        let key = next.key.replace('.', '\u2024')
        json.votes[key] = next.members || []
      })
      return json
    })
  }

  // /data/congress/{congress}/votes/{year}
  const _getVotes = year => {
    const yr = path.parse(year).base;
    const dirs = sync.dirs(year), chunked = [], chunk = 100;
    for (let i = 0; i < dirs.length; i += chunk) {
      chunked.push(dirs.slice(i, i + chunk))
    }

    // parse votes
    return Promise
      .map(chunked, dirs => Promise.map(dirs, _getVote, {concurrency: 2}))
      .then(chunkedVotes => {

        // chunked bulk save
        return Promise
          .map(chunkedVotes, votes => {
            let bulk = sync.db.Vote.initializeUnorderedBulkOp()
            votes.forEach(vote => {
              bulk.find({vote_id: vote.vote_id}).upsert().update({$set: vote})
            })
            return bulk.execute()
              .then(sync.response);
          });
      }, {
        concurrency: 1
      })
      .then(res => {
        const json = {};
        json[yr] = res;
        return json;
      });
  }

  return sync.session('votes', _getVotes)
    .then(res => {
      util.info('Finished votes...\n');
      return res;
    });
}
