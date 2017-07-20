const glob = require('glob');
const path = require('path');
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/congress';
const database = {};

// get mongoose models for congress
database.models = mongoose => {
  const db = {};
  glob.sync(path.join(__dirname, 'sync/models/*.js'))
    .forEach(modelPath => {
      const model = require(modelPath)(mongoose);
      if (model.name === 'Member'){
        db[model.name] = mongoose.model(model.name, model.schema);
      }
    });
  return db;
};

// mongoose connection
database.connect = (mongoose, uri) => {
  return mongoose.connect(uri || URI)
    .then(() => database.models(mongoose));
};

module.exports = database;
