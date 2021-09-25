const { 
  ROLES_NAME_MAP,
  MOVIE_SOURCE_TYPE,
  rolesAuthMapValidator
} = require('@src/utils')

function auth(value) {
  const { roles } = value 
  //获取待操作信息权限及操作用户权限
  const valid = rolesAuthMapValidator({
    userRoles: roles,
    opRoles: [{
      source_type: MOVIE_SOURCE_TYPE.USER,
      roles: [
        ROLES_NAME_MAP.SUB_DEVELOPMENT
      ]
    }]
  })
  if(valid) return value 
  return Promise.reject({ errMsg: 'forbidden', status: 403 })
}

module.exports = {
  auth
}