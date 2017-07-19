var path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  json = Promise.promisifyAll(require('jsonfile')),
  exec = require('child_process').exec,
  paths = {
    congress: 'congress/data',
    committeeMembers: 'congress-legislators/committee-membership-current.json',
    committees: 'congress-legislators/committees-current.json',
    committeesHistorical: 'congress-legislators/committees-historical.json',
    members: 'congress-legislators/legislators-current.json',
    membersHistorical: 'congress-legislators/legislators-historical.json'
  }

function _path (p) {
  return path.join(__dirname, '../../', p || '')
}

for (var p in paths) {
  paths[p] = _path(paths[p])
}

function _isDir(path) {
  try {
    return fs.statSync(path).isDirectory()
  } catch (err) {
    return false
  }
}

function _dirs(dir) {
  return _isDir(dir)
    ? fs.readdirSync(dir)
      .filter(file => _isDir(path.join(dir, file)))
      .map(file => path.join(dir, file))
    : []
}

function _flatten(res) {
  var dict = {}
  res.forEach(obj => {
    for (var key in obj) {
      dict[key] = obj[key]
    }
  })
  return dict
}

module.exports = db => {
  let congress = {
    db: db,
    path: _path,
    dirs: _dirs,
    isDir: _isDir,
    flatten: _flatten,
    paths: paths,
    json: json,
    modules: {
      votes: require('./getVotes'),
      bills: require('./getBills'),
      members: require('./getMembers'),
      membersHistorical: require('./getMembersHistorical'),
      committees: require('./getCommittees'),
      committeeMembers: require('./getCommitteeMembers'),
    }
  }

  congress.session = (target, mapFn) => {

    // /data/congress/
    var sessionDirs = _dirs(paths.session)
    return Promise.map(sessionDirs, session => {
      var dirs = _dirs(path.join(session, target))

      // /data/congress/{session}/
      return Promise.map(dirs, mapFn)
        .then(res => {
          let json = {}
          json[path.parse(session).base] = _flatten(res)
          return json
        }, {concurrency: 1})
    }).then(_flatten)
  }

  congress.response = res => {
    res = res.toJSON()
    delete res.upserted
    return res
  }

  let res = {};
  congress.res = field => {
    return data => {
      res[field] = data;
      return congress;
    };
  };

  let promise;
  // for (let field in congress.modules) {
  //   promise = promise
  //     ? promise
  //       .then(congress.modules[field])
  //       .then(congress.res(field))
  //     : promise = congress.modules[field](congress)
  //       .then(congress.res(field));
  // }
  //
  // return promise
  //   .then(() => res);

  return congress.modules.membersHistorical(congress)
    .then(congress.res('membersHistorical'))
    .then(congress.modules.members)
    .then(congress.res('members'))
    .then(congress.modules.committees)
    .then(congress.res('committees'))
    .then(congress.modules.committeeMembers)
    .then(congress.res('committeeMembers'))
    .then(congress.modules.bills)
    .then(congress.res('bills'))
    .then(congress.modules.votes)
    .then(congress.res('votes'))
    .then(() => res);
}
