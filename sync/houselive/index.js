var db = require('../../config/mongoose')
  , config = require('../../config')
  , getHouseSessions = require('./getHouseSessions')

module.exports = () => {
  return getHouseSessions(db, config)
}
