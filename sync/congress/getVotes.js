var fs = require('fs'),
  path = require('path'),
  Promise = require('bluebird')

module.exports = (sync) => {

  let _getMember = (json) => {
    const error = () => {
      return new Error("Failed to get member: (" + json.id + ") " + json.display_name)
    }
    return sync.db.Member.findOne({ $or: [{'id.bioguide': json.id }, {'id.lis': json.id}] })
      .then(member => {
        if (!member) return error();
        return member._id
      }, error)
  }

  // /data/congress/{congress}/{year}/{votes}/
  let _getVote = (votePath) => {
    var file = path.join(votePath, 'data.json')
    var json = JSON.parse(fs.readFileSync(file, 'utf8'))

    // iterate votes
    return Promise.map(Object.keys(json.votes), (key) => {

      // iterate members
      return Promise.map(json.votes[key], _getMember).then((members) => {

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

  // /data/congress/{congress}/{year}/
  let _getVotes = (year) => {
    var dirs = sync.dirs(year), chunked = [], chunk = 100;
    for (var i = 0; i < dirs.length; i += chunk) {
      chunked.push(dirs.slice(i, i + chunk))
    }

    // parse votes
    return Promise
      .map(chunked, dirs => Promise.map(dirs, _getVote, { concurrency: 4 }))
      .then(chunkedVotes => {

        // chunked bulk save
        return Promise.map(chunkedVotes, votes => {
          var bulk = sync.db.Vote.initializeUnorderedBulkOp()
          votes.forEach(vote => {
            bulk.find({ 'vote_id': vote.vote_id }).upsert().update({ $set: vote })
          })

          return bulk.execute(res => {
            var json = {}
            json[path.parse(year).base] = res
            return json
          })
        })
      }, {concurrency: 1})
  }

  return sync.session('votes', _getVotes)
}
