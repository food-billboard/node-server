const { fileEncoded } = require('@src/utils')

const SHARE_COOKIE_KEY = 'share_cookie_key'

function getUserAgent(ctx) {
  const headers = ctx.headers
  const userAgent = headers['user-agent'] || headers['User-Agent']
  return fileEncoded(userAgent)
}

module.exports = {
  SHARE_COOKIE_KEY,
  getUserAgent
}