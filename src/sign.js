// Deterministic Usage of the Digital Signature Algorithm (DSA) and Elliptic Curve Digital Signature Algorithm (ECDSA)
// https://datatracker.ietf.org/doc/rfc6979
const bs58 = require('bs58')
const BigInteger = require('bigi')
const crypto = require('crypto')

const secp256k1 = require('secp256k1')

const ecdsa = require('eosjs-ecc/lib/ecdsa')
const ecsignature = require('eosjs-ecc/lib/ecsignature')
const curve = require('ecurve').getCurveByName('secp256k1')
const {sha256} = require('eosjs-ecc/lib/hash')
const ecc = require('eosjs-ecc')

module.exports = {ecurveSign, signSecp256k1}

const {Signature} = ecc

function ecurveSign(privateKey, buf, noncePerRfc6979 = true) {
  var dataSha256 = sha256(buf)

  var der, e, ecsignature, i, lenR, lenS;
  i = null;
  let nonce = noncePerRfc6979 ? 0 : 1;
  e = BigInteger.fromBuffer(dataSha256);

  let attempts = 1
  while (true) {
    ecsignature = ecdsa.sign(curve, dataSha256, privateKey.d, nonce);
    der = ecsignature.toDER();
    lenR = der[3];
    lenS = der[5 + lenR];
    if (lenR === 32 && lenS === 32) {
      i = ecdsa.calcPubKeyRecoveryParam(curve, e, ecsignature, privateKey.toPublic().Q);
      i += 4;  // compressed
      i += 27; // compact  //  24 or 27 :( forcing odd-y 2nd key candidate)
      break;
    }
    attempts++

    if (nonce % 10 === 0) {
      console.log("WARN: " + nonce + " attempts to find canonical signature");
    }
    nonce++;
  }
  console.info('Generated signature using nonce:', nonce)
  return {attempts, sig: Signature(ecsignature.r, ecsignature.s, i)}
}

/**
 * Sign buf.
 * @param {Buffer} buf 32-byte buf.
 * @return Signature
 */
function signSecp256k1(privateKeyBuffer, buf, noncePerRfc6979 = true) {
    buf = sha256(buf)
    let rv
    let attempts = 0
    let nonce = noncePerRfc6979 ? 0 : 1

    do {
      attempts++
      const hash = nonce === 0 ?
        Buffer.concat([buf, Buffer.alloc(1, nonce++)]) :
        buf;

      const options = {data: sha256(hash)}
      rv = secp256k1.sign(buf, privateKeyBuffer, options)
    } while (!isCanonicalSignature(rv.signature))

    const i = rv.signature.readUInt8(0)

    const r = Buffer.alloc(32)
    rv.signature.copy(r, 0, 1, 33)

    const s = Buffer.alloc(32)
    rv.signature.copy(s, 0, 34, 65)

    return {attempts, sig: Signature(r, s, i)}
}

// buf = new Buffer(65);
// buf.writeUInt8(i, 0);
// r.toBuffer(32).copy(buf, 1);
// s.toBuffer(32).copy(buf, 33);

// secp256k1.privateKeyVerify(key)

/**
 * Return true if signature is canonical, otherwise false.
 * @arg {Buffer} signature
 * @return {bool}
 */
function isCanonicalSignature(signature) {
  return (
    !(signature[0] & 0x80) &&
    !(signature[0] === 0 && !(signature[1] & 0x80)) &&
    !(signature[32] & 0x80) &&
    !(signature[32] === 0 && !(signature[33] & 0x80))
  )
}
