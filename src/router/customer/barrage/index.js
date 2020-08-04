const Router = require('@koa/router')
const { verifyTokenToData, UserModel, MovieModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {
  
})
.put('/', async(ctx) => {

})

module.exports = router