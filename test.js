const test = require('tape')
const http = require('http')
const corsify = require('corsify')
const crypto = require('crypto')
const serverDestroy = require('server-destroy')
const handler = require('./server')()
const getRoom = require('./')

const cors = corsify({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization'
})

const app = http.createServer(cors(handler))

function generate () {
  let key = crypto.createECDH('secp521r1')
  key.generateKeys()
  let pub = key.getPublicKey().toString('hex')
  let priv = key.getPrivateKey().toString('hex')
  return {pub, priv}
}

test('setup server', t => {
  t.plan(1)
  serverDestroy(app)
  app.listen(6688, () => t.ok(true))
})

test('basic signal exchange', t => {
  t.plan(3)
  let user1 = generate()
  let user2 = generate()
  let server = 'http://localhost:6688'
  getRoom(server, 'testroom', user1.priv, user1.pub, (err, data) => {
    if (err) throw err
    t.equal(data.keys.length, 0)
    getRoom(server, 'testroom', user2.priv, user2.pub, (err, data) => {
      if (err) throw err
      t.equal(data.keys.length, 1)
      t.equal(data.keys[0], user1.pub)
    })
  })
})

test('teardown', t => {
  t.plan(1)
  app.close(() => t.ok(true))
})
