# congress-mongodb

[![npm version](https://badge.fury.io/js/congress-mongodb.svg)](http://badge.fury.io/js/congress-mongodb)
[![dependencies Status](https://david-dm.org/hboylan/congress-mongodb/status.svg)](https://david-dm.org/hboylan/congress-mongodb)
[![peerDependencies Status](https://david-dm.org/hboylan/congress-mongodb/peer-status.svg)](https://david-dm.org/hboylan/congress-mongodb?type=peer)
[![GitHub issues](https://img.shields.io/github/issues/hboylan/congress-mongodb.svg)](https://github.com/hboylan/congress-mongodb/issues)
[![GitHub stars](https://img.shields.io/github/stars/hboylan/congress-mongodb.svg)](https://github.com/hboylan/congress-mongodb/stargazers)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/hboylan/congress-mongodb/master/LICENSE)
<!-- [![Join the chat at https://gitter.im/congress-mongodb/Lobby](https://badges.gitter.im/congress-mongodb/Lobby.svg)](https://gitter.im/congress-mongodb/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) -->


## Table of contents

- [Dependencies](#dependencies)
- [Install](#install)
- [Integrate](#integrate)
- [Develop](#develop)
- [Todo](#todo)
- [License](#license)


## Dependencies

#### CLI
- [congress](https://github.com/unitedstates/congress)
- [congress-legislators](https://github.com/unitedstates/congress)
- [MongoDB](https://www.mongodb.com/download-center#community)
- 4GB RAM+ to sync

#### Integration
- [mongoose](https://npmjs.org/packages/mongoose)


## Install

```sh
# CLI
yarn global add congress-mongodb
congress -h

# Integration
yarn add congress-mongodb
./node_modules/.bin/congress -h
```

## Integrate

#### Command - fetch
Downloads sitemaps, json, etc.
```sh
congress fetch -h
congress fetch
congress fetch -d tmp
```

#### Command - sync
Imports data from files to mongodb in structured format
```sh
congress sync -h
congress sync
congress sync -d tmp
congress sync -d tmp -u mongodb://localhost:27017/my-db # or $MONGODB_URI
```

#### Integration - connection
Integrate mongoose models in your app
```js
import congress from 'congress-mongodb';
import mongoose from 'mongoose';

// pass uri or set $MONGODB_URI
congress.connection(mongoose, uri)
  .then(db => {
    db.Member.find().then(console.log)
  });
```

#### Integration - models
Integrate mongoose models in your app with an existing connection
```js
import congress from 'congress-mongodb';
import mongoose from 'mongoose';
const db = congress.models(mongoose);

db.Member.find({current: true, chamber: 'senate'})
  .skip(0)
  .limit(50)
  .exec()
  .then(senate => {
    console.log(`Current senators:\n${senate.join('\n')}`)
  })
```


## Develop

```sh
npm link          # init project and link for development
congress fetch    # download data
congress sync     # import to mongodb (default mongodb://localhost:27017/congress)
```


## Todo

- Implement options for more specific fetch/sync
- Implement remove command


## License

MIT
