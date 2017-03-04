const test = require('tape')
const http = require('http')
const corsify = require('corsify')
const sodi = require('sodi')
const serverDestroy = require('server-destroy')
const handler = require('./server')()
const getRoom = require('./')

const cors = corsify({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization'
})

const app = http.createServer(cors(handler))

test('setup server', t => {
  t.plan(1)
  serverDestroy(app)
  app.listen(6688, () => t.ok(true))
})

test('basic signal exchange', t => {
  t.plan(3)
  let user1 = sodi.generate()
  let user2 = sodi.generate()
  let server = 'http://localhost:6688'
  getRoom(server, 'testroom', user1, (err, data) => {
    if (err) throw err
    t.equal(data.keys.length, 0)
    getRoom(server, 'testroom', user2, (err, data) => {
      if (err) throw err
      t.equal(data.keys.length, 1)
      t.equal(data.keys[0], user1.publicKey.toString('hex'))
    })
  })
})

test('teardown', t => {
  t.plan(1)
  app.close(() => t.ok(true))
})
