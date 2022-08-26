const fs  = require('fs-extra')
const { getClient } = require('../redis')
const { THIRD_PARTY_AUTH_TOKEN_CONFIG_PATH } = require('../constant')

const AUTH_TOKEN_REDIS_NAME = 'AUTH_TOKEN_REDIS_NAME'

const getAuthTokenData = async () => {
  const client = getClient()
  return client.get(AUTH_TOKEN_REDIS_NAME)
  .then(data => {
    if(data) return data 
    return fs.readFile(THIRD_PARTY_AUTH_TOKEN_CONFIG_PATH)
  })
  .then(data => {
    if(!data) return {}
    return client.setex(AUTH_TOKEN_REDIS_NAME, data, 60)
    .then(() => JSON.parse(data))
  })
  .catch(err => {
    return {}
  })
}

const getAuthToken = async (key) => {
  const config = await getAuthTokenData()
  return (config[key] || {}).code 
}

module.exports = {
  getAuthToken
}
