/* eslint-env mocha */
import assert from 'assert'
import {ecurveSign, signSecp256k1} from './sign'
import Eos from 'eosjs'

const signParams = {
  noncePerRfc6979: true,
  attempts: 0
}

describe('signature', function() {

  it('ecurve', async function() {
    await ecurveEos.transfer('source', 'life', '0.0001 SYS', '')
    console.log(signParams)
  })

  it('secp256k1', async function() {
    await secpEos.transfer('source', 'life', '0.0001 SYS', '')
    console.log(signParams)
  })

})

const {ecc} = Eos.modules

const pvt = ecc.PrivateKey('5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3')
const pub = ecc.privateToPublic(pvt)

const ecurveSignProvider = ({buf}) => {
  const res = ecurveSign(pvt, buf, signParams.noncePerRfc6979 = true)
  signParams.attempts = res.attempts
  return res.sig
}

const ecurveEos = Eos({signProvider: ecurveSignProvider})

const pvtBuffer = pvt.toBuffer()
const secpSignProvider = ({buf}) => {
  const res = signSecp256k1(pvtBuffer, buf, signParams.noncePerRfc6979 = true)
  signParams.attempts = res.attempts
  return res.sig
}

const secpEos = Eos({signProvider: secpSignProvider})
