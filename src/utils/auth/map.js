const { ROLES_MAP, METHOD_MAP } = require('../constant')

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
      ...DEFAULT_ROLES_DATABASE,
      actions: [
        {
          methods: '*', //or [ get, post ]
          url: '/api/manage/'
        }
      ]
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
    roles: ['DEVELOPMENT'],
    allow: {
      ...DEFAULT_ROLES_DATABASE,
      actions: []
    }
  },
  {
    roles: ['SUB_DEVELOPMENT'],
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