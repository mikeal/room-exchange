const http = require('http')
const corsify = require('corsify')
const crypto = require('crypto')
const handler = require('./server')()

const cors = corsify({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization'
})

const app = http.createServer(cors(handler))
app.listen(6689, () => console.log('listening on 6689'))
