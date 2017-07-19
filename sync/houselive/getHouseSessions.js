var Crawler = require('crawler')
  , moment = require('moment')
  , getHouseSessionActions = require('./getHouseSessionActions')
  , getHouseSessionMinutes = require('./getHouseSessionMinutes')
  , getHouseSessionVideo = require('./getHouseSessionVideo')
  , db;

var c = new Crawler({
  maxConnections: 1
})

function process(doc) {
  // return getHouseSessionActions(db, doc).then((doc) => {
    return getHouseSessionVideo(db, doc).then((doc) => {
      return getHouseSessionMinutes(db, doc)
    })
  // })
}

function processFIFO(sessionIds) {
  return new Promise((resolve, reject) => {

    // empty queue
    if (sessionIds.length === 0) {
      return resolve()
    }

    // get mongoose doc
    db.Session.findWithError(sessionIds.shift(), (err, doc) => {
      if (err) return processFIFO(sessionIds).then(resolve)

      process(doc).then((doc) => {

        // save updates
        doc.save((err, doc) => {
          if (err) return reject(err)
          console.info('Session updated:', moment(doc.date).format('YYYY-MM-DD'))
          return processFIFO(sessionIds).then(resolve)
        })
      }, (err) => {
        return processFIFO(sessionIds).then(resolve)
      })
    })
  })
}

const limit = 100
function getExistingSessions(list, page) {
  return new Promise((resolve, reject) => {
    list = list || []
    page = page || 1
    var q = { actions: { $exists: true, $not: { $size: 0 } } }

    // get page
    db.Session.find(q).skip((page - 1) * limit).limit(limit).select('_id date').exec((err, existingDocs) => {
      if (err) return reject(err)

      // get count
      db.Session.count(q, (err, count) => {
        if (err) return reject(err)

        // recursion
        if (count - page * limit > 0) {
          getExistingSessions(list.concat(existingDocs), page + 1).then(resolve)
        } else {
          resolve(list.concat(existingDocs))
        }
      })
    })
  })
}

function processSessions(sessions) {

  return getExistingSessions().then((existingSessions) => {
    var existingSessionDates = []
      , existingSessionIds = []

    for (var i in existingSessions) {
      var s = existingSessions[i]
      existingSessionIds.push(s._id)
      existingSessionDates.push(moment(s.date).format('YYYY-MM-DD'))
    }

    // filter out existing sessions
    var len = sessions.length
    sessions = sessions.filter((s) => {
      return existingSessionDates.indexOf(moment(s.date).format('YYYY-MM-DD')) === -1
    })
    console.info('%d sessions were already stored', len - sessions.length)

    // save data
    return new Promise((resolve, reject) => {
      db.Session.collection.insert(sessions, (err, docs) => {
        console.info('%d sessions were successfully stored', err ? 0 : docs.result.n)

        // process new sessions
        processFIFO(err ? [] : docs.insertedIds).then(resolve, reject)

          // update existing sessions
          // processFIFO(existingSessionIds).then(() => {

          // })
        // })
      })
    })
  })
}

module.exports = (database) => {
  db = database

  return new Promise((resolve, reject) => {

    // sessions
    c.queue([{
      uri: 'http://houselive.gov/ViewPublisher.php?view_id=14',
      callback: (err, result, $) => {

        // parse data from page
        processSessions($('.archiveListing').map((i, tr) => {
          tr = $(tr)

          var timestamp = tr.find('.name-date > div > span').first().text() + '000'
          var links = {}

          // file links
          tr.find('.additional-media li li a').each((i, a) => {
            a = $(a)
            var text = a.text()

            if (text === 'Download and Listen (MP3)') {
              links.mp3 = a.attr('href')
            } else if (text === 'Download and Watch (MP4)') {
              links.mp4 = a.attr('href')
            } else if (text === 'Floor Summary (XML)') {
              links.xml = a.attr('href').replace('Download.aspx?file=', '') // resolve to actual file
            } else if (text === 'Read Floor Summary') {
              links.pdf = a.attr('href')
            }
          })

          // watch and stream links
          links.stream = tr.find('.watch-link a').last().attr('href').replace('&sn=houselive.gov', '')
          links.watch = links.stream.replace('ASX.php', 'MediaPlayer.php')
          links.stream += '&stream_type=http'

          // duration
          var durationStr = tr.find('.duration').first().text()
          var durationHrs = parseInt(durationStr.substring(0, 2))
          var durationMins = parseInt(durationStr.substring(4, 6))
          durationMins = (durationHrs * 60) + durationMins

          // Session model
          return {
            date: new Date(new Number(timestamp)),
            duration: durationMins,
            duration_string: durationStr,
            links: links
          }
        }).get()).then(resolve, reject) // compass thingy
      }
    }])
  })
}
