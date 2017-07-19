var xml2js = require('xml2js')
  , Promise = require('bluebird')
  , request = require('request')
  , moment = require('moment')
  , path = require('path')
  , parser = new xml2js.Parser()

function getActionsFromXML(db, session) {
  return new Promise((resolve, reject) => {

    request(session.links.xml, (err, res, xml) => {
      if (err) return reject(err)

      parser.parseString(xml, (err, json) => {
        if (err) return reject(err)

        // XML is missing
        if (!json.legislative_activity) {
          console.warn('Missing activities for session:', moment(session.date).format('YYYY-MM-DD HH:mm'))
          return resolve(session)
        }

        // parse action json
        var actions = json.legislative_activity.floor_actions[0].floor_action.map((action) => {
          delete action.$
          action.action_description = action.action_description[0]
          action.action_description = action.action_description._ || action.action_description

          // action model
          return {
            date: moment(action.action_time[0].$['for-search'], 'YYYYMMDD\THH:mm:ss').toDate(),
            description: action.action_description.replace(new RegExp('\n', 'g'), ''),
            item: action.action_item ? action.action_item[0] : null,
            session: session._id
          }
        }).reverse()

        // queue crawlers


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
      })
    })
  })
}

function getVideo(db, session) {
  return new Promise((resolve, reject) => {

    request(session.links.stream, (err, res, xml) => {
      if (err) return reject(err)

      parser.parseString(xml, (err, json) => {
        if (err) return reject(err)

        // get video link
        session.links.stream = json.ASX.ENTRY[0].REF[0].$.HREF
        resolve(session)
      })
    })
  })
}

module.exports = getVideo
