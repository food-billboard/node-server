const { ROLES_MAP, METHOD_MAP } = require('../mongodb')

const DEFAULT_ROLES_DATABASE = {
  resources: [],
  actions: [],
  attributes: [],
  where: [],
}


const ROLES_DATABASE_MAP = [
  {
    roles: ['SUPER_ADMIN'],
    allow: {
      ...DEFAULT_ROLES_DATABASE
    }
  },
  {
    roles: ['ADMIN'],
    allow: {
      ...DEFAULT_ROLES_DATABASE,
      actions: []
    }
  },
  {
    roles: ['CUSTOMER'],
    allow: {
      ...DEFAULT_ROLES_DATABASE,
      actions: []
    }
  },
  {
    roles: ['USER'],
    allow: {
      ...DEFAULT_ROLES_DATABASE,
      actions: []
    }
  }
]

const APIS_DATABASE_MAP = [

]

module.exports = {
  ROLES_DATABASE_MAP,
  APIS_DATABASE_MAP
}