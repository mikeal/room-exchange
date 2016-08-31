const response = require('response')
const once = require('once')
const crypto = require('crypto')
const body = require('body/json')
const ec_pem = require('./ec-pem.js')
const rooms = {}

function createRedisGet (client, limit, prefix = 'room:') {
  let noop = () => {}
  if (!limit) limit = 100

  function _ret (room, pub, cb) {
    cb = once(cb)
    let key = `${prefix}${room}`
    let multi = client.multi()
    let value = new Buffer(pub, 'hex')
    multi.lrange(key, 0, limit - 1, (err, keys) => {
      if (err) return cb(err)
      cb(null, keys.map(k => k.toString('hex')))
    })
    multi.lpush(key, value, noop)
    multi.ltrim(key, 0, limit - 1, noop)
    multi.exec(err => {
      if (err) console.error(err)
      if (err) cb(err)
    })
  }
  return _ret
}

function memoryGet (room, pub, cb) {
  if (!rooms[room]) rooms[room] = []
  cb(null, rooms[room].reverse())
  rooms[room].push(pub)
  if (rooms[room].length > 100) rooms[room].shift()
}

function verify (value, publicKey, signature) {
  if (!Buffer.isBuffer(publicKey)) publicKey = new Buffer(publicKey, 'hex')
  if (!Buffer.isBuffer(signature)) signature = new Buffer(signature, 'hex')
  if (typeof value !== 'string') value = JSON.stringify(value)
  var c = 'secp521r1'
  var pem = ec_pem({public_key: publicKey, curve: c}, c).encodePublicKey()
  var algo = 'ecdsa-with-SHA1'
  return crypto.createVerify(algo).update(value).verify(pem, signature)
}

function createHandler (get) {
  if (!get) get = memoryGet
  function _ret (req, res) {
    if (req.method === 'GET') {
      return // TODO: Status message
    }
    if (req.method !== 'POST') {
      return // TODO: method not accepted erro
    }
    body(req, (err, data) => {
      if (err) return response.error(err).pipe(res)
      if (!data.room) return response.error(new Error('missing room'))
      if (!data.from) return response.error(new Error('missing from'))
      if (!data.value) return response.error(new Error('missing value'))
      if (!data.signature) return response.error(new Error('missing signature'))
      if (!verify(data.value, data.from, data.signature)) {
        return response.error(new Error('Signature validation failed.'))
      }
      get(data.room, data.from, (err, keys) => {
        if (err) return response.error(err).pipe(res)
        response.json({keys: keys}).pipe(res)
      })
    })
  }
  return _ret
}

module.exports = createHandler
module.exports.createRedisGet = createRedisGet
