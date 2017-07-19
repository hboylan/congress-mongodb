var Crawler = require('crawler')
  , Promise = require('bluebird')
  , db;

var c = new Crawler({
  maxConnections: 4
})

function getMinutes(database, session) {
  db = database

  return new Promise((resolve, reject) => {

    if (typeof session.links.watch === 'string') {
      c.queue([{
        uri: session.links.watch,

        callback: (err, result, $) => {

          // get data from links
          var actions = $('.indexPoints a').map((i, a) => {
            a = $(a)
            var txt = a.text()

            return {
              time: a.attr('time'),
              description: txt.substring(2, txt.length - 2), // "\r\nSTR\r\n"
              session: session._id
            }
          }).get()

          // store actions
          db.SessionAction.collection.insert(actions, (err, docs) => {
            if (err) return reject(err)
            console.info('%d actions were successfully stored', docs.result.n)

            // add action ids to session
            session.actions = docs.ops.map((action) => {
              return action._id
            })

            resolve(session)
          })
        }
      }])
    } else {
      resolve(session)
    }
  })
}

module.exports = getMinutes
