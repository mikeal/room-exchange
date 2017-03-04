const defaultHeaders = {'User-Agent': 'room-exchange-1.0.0'}
const request = require('request').defaults({headers: defaultHeaders})
const sodi = require('sodi')
const encryption = require('sodium-encryption')
const defaultHost = 'https://roomexchange-1.now.sh/'
const nonce = encryption.nonce

function register (host, room, keypair, cb) {
  if (!cb) {
    cb = keypair
    keypair = room
    room = host
    host = defaultHost
  }

  let crypto = sodi(keypair)

  if (host[host.length - 1] !== '/') host += '/'
  let value = nonce().toString('hex')
  let signature = crypto.sign(value).toString('hex')
  let payload = {from: crypto.public, room, value, signature}
  request.put(`${host}register`, {json: payload}, (err, resp) => {
    if (err) return cb(err)
    let status = resp.statusCode
    if (status !== '201') return cb(new Error('Not 201, ' + status))
    cb(null)
  })
}
function getRoom (host, room, keypair, cb) {
  if (!cb) {
    cb = keypair
    keypair = room
    room = host
    host = defaultHost
  }

  let crypto = sodi(keypair)

  if (host[host.length - 1] !== '/') host += '/'
  let value = nonce().toString('hex')
  let signature = crypto.sign(value).toString('hex')
  let payload = {from: crypto.public, room, value, signature}
  request.post(`${host}getRoom`, {json: payload}, (err, resp, roomData) => {
    if (err) return cb(err)
    let status = resp.statusCode
    if (status !== 200) return cb(new Error('Not 200, ' + status))
    cb(null, roomData)
  })
}

module.exports = getRoom
module.exports.register = register
