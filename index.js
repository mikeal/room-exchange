const defaultHeaders = {'User-Agent': 'room-exchange-0.1.0'}
const request = require('request').defaults({headers: defaultHeaders})
const crypto = require('crypto')
const ec_pem = require('./ec-pem')
const defaultHost = 'https://roomexchange.now.sh/'

function sign (privateKey, value) {
  if (typeof value !== 'string') value = JSON.stringify(value)
  let c = 'secp521r1'
  let pem = ec_pem({private_key: new Buffer(privateKey, 'hex'), curve: c}, c)
  let pemPrivateKey = pem.encodePrivateKey()
  let algo = 'ecdsa-with-SHA1'
  let _sign = crypto.createSign(algo)
  _sign.update(value)
  return _sign.sign(pemPrivateKey).toString('hex')
}

function register (host, room, privateKey, publicKey, cb) {
  if (!cb) {
    cb = publicKey
    publicKey = privateKey
    privateKey = room
    room = host
    host = defaultHost
  }

  if (host[host.length - 1] !== '/') host += '/'
  let value = {nonce: crypto.randomBytes(30).toString('hex')}
  let signature = sign(privateKey, value)
  let payload = {from: publicKey, room, value, signature}
  request.put(`${host}register`, {json: payload}, (err, resp) => {
    if (err) return cb(err)
    let status = resp.statusCode
    if (status !== '201') return cb(new Error('Not 201, ' + status))
    cb(null)
  })
}
function getRoom (host, room, privateKey, publicKey, cb) {
  if (!cb) {
    cb = publicKey
    publicKey = privateKey
    privateKey = room
    room = host
    host = defaultHost
  }

  if (host[host.length - 1] !== '/') host += '/'
  let value = {nonce: crypto.randomBytes(30).toString('hex')}
  let signature = sign(privateKey, value)
  let payload = {from: publicKey, room, value, signature}
  request.post(`${host}getRoom`, {json: payload}, (err, resp, roomData) => {
    if (err) return cb(err)
    let status = resp.statusCode
    if (status !== 200) return cb(new Error('Not 200, ' + status))
    cb(null, roomData)
  })
}

module.exports = getRoom
module.exports.register = register