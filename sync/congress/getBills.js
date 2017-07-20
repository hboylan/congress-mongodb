const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const util = require('../util');

module.exports = sync => {
  util.info('Starting bills...');

  // bill_subjects
  function _getBillSubjects(bills) {
    util.info('Starting bill subjects...');

    // bulk op
    let bulk = sync.db.BillSubject.initializeUnorderedBulkOp()
    return sync.db.Bill.distinct('subjects')
      .then(subjects => {

        // count num_bills
        return Promise
          .map(subjects, value => {
            util.log(`Found bill subject: ${value}`)
            return sync.db.Bill.count({subjects: value})
              .then(num_bills => {

                // upsert
                bulk.find({value})
                  .upsert()
                  .update({$set: {value, num_bills}})
              })
          })
      })
      .then(() => bulk.execute())
      .then(res => {
        bills.subjects = sync.response(res)
        util.info('Finished bill subjects...\n');
        return bills
      }, err => {
        return new Error('No bills')
      })
  }

  // /data/congress/{congress}/bills/{type}/text-versions/
  function _getTextVersions(bill) {
    let textVersionDirs = sync.dirs(path.join(bill, 'text-versions'))
    let list = []
    while (textVersionDirs.length) {
      const textJson = path.join(textVersionDirs.shift(), 'data.json')
      const textData = JSON.parse(fs.readFileSync(textJson, 'utf8'))
      list.push(textData)
    }
    return list
  }

  // find sponsor
  function _getSponsor(json) {
    const error = () => {
      return new Error("Failed to get sponsor: (" + json.thomas_id + ") " + json.name)
    };
    return sync.db.Member.findOne({ 'id.thomas': json.thomas_id })
      .then(sponsor => {
        if (!sponsor) return error();
        return sponsor._id
      }, error)
  }

  // /data/congress/{congress}/bills/{type}/data.json
  function _getBill(billPath) {
    const billJson = path.join(billPath, 'data.json')
    let json = JSON.parse(fs.readFileSync(billJson, 'utf8'))

    // text-versions
    // json.text_versions = _getTextVersions(billPath)

    // sponsor
    return _getSponsor(json.sponsor)
      .then(sponsorId => {
        json.sponsor = sponsorId

        // cosponsors
        return Promise.map(json.cosponsors, _getSponsor)
          .then(cosponsorIds => {
            json.cosponsors = cosponsorIds

            // resolve
            return json
          })
    })
  }

  // /data/congress/{congress}/bills/{type}/
  function _getBillTypes(type) {
    const billDirs = sync.dirs(type)

    // parse bills
    return Promise
      .map(billDirs, _getBill, {
        concurrency: 2
      })
      .then(bills => {

        let bulk = sync.db.Bill.initializeUnorderedBulkOp()
        bills.forEach(bill => {
          util.log(`Found bill: ${bill.official_title}`)
          bulk.find({'bill_id': bill.bill_id})
            .upsert()
            .update({$set: bill})
        })
        return bulk.execute()
      }, {
        concurrency: 2
      })
      .then(res => {
        let json = {}
        json[path.parse(type).base] = sync.response(res)
        return json
      })
  }

  return sync.session('bills', _getBillTypes)
    .then(bills => {
      util.info('Finished bills...\n');
      return bills;
    })
    .then(_getBillSubjects);
}
