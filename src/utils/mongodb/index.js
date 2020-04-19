const MongoClient = require('mongodb').MongoClient
const url = ''

MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
  if(err) return new Error('fail connect')
  console.log('created')
  db.close()
})
