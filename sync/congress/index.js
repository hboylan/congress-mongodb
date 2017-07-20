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
    paths: util.paths(data),
    dirs: _dirs,
    isDir: _isDir,
    flatten: _flatten,
    json: json,
    modules: {
      members: require('./getMembers'),
      membersHistorical: require('./getMembersHistorical'),
      committees: require('./getCommittees'),
      committeeMembers: require('./getCommitteeMembers'),
      bills: require('./getBills'),
      votes: require('./getVotes'),
    }
  }

  congress.session = (target, mapFn) => {

    // /data/congress/
    var sessionDirs = _dirs(congress.paths.session)
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
  for (let field in congress.modules) {
    promise = promise
      ? promise
        .then(congress.modules[field])
        .then(congress.res(field))
      : promise = congress.modules[field](congress)
        .then(congress.res(field));
  }

  return promise
    .then(() => res);

  // return congress.modules.bills(congress)
  //   .then(congress.res('bills'))
  //   .then(congress.modules.committees)
  //   .then(congress.res('committees'))
  //   ...
  //   .then(() => res);
}
