var path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  util = require('../util'),
  json = Promise.promisifyAll(require('jsonfile'));

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

module.exports = (data, db) => {
  let congress = {
    db: db,
    dirs: _dirs,
    isDir: _isDir,
    flatten: _flatten,
    json: json,
    paths: util.paths(data),

    // order matters
    modules: {
      members: require('./getMembers'),
      membersHistorical: require('./getMembersHistorical'),
      committees: require('./getCommittees'),
      committeeMembers: require('./getCommitteeMembers'),
      bills: require('./getBills'),
      votes: require('./getVotes'),
    }
  }

  // iterate session directories
  congress.session = (target, mapFn) => {

    // /data/congress/
    var sessionDirs = _dirs(congress.paths.congress)
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

  // parse bulk response
  congress.response = res => {
    res = res.toJSON()
    delete res.upserted
    return res
  }

  // link promises below
  let res = {};
  congress.res = field => {
    return data => {
      res[field] = data;
      return congress;
    };
  };

  // iterate modules
  let promise;
  for (let field in congress.modules) {
    promise = promise
      ? promise
        .then(congress.modules[field])
        .then(congress.res(field))
      : promise = congress.modules[field](congress)
        .then(congress.res(field));
  }

  // sync
  return promise
    .then(() => {
      console.log(`Finished syncing...\n${JSON.stringify(res, null, 2)}\n`);
      process.exit(0);
    }, err => {
      console.error(`Failed to sync...\n${err}\n`);
      process.exit(1);
    });

  // ...reference for compact version...
  //
  // return congress.modules.bills(congress)
  //   .then(congress.res('bills'))
  //   .then(congress.modules.committees)
  //   .then(congress.res('committees'))
  //   ...
  //   .then(() => res);
}
