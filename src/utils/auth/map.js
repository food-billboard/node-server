const { ROLES_MAP, METHOD_MAP } = require('../constant')

const DEFAULT_ROLES_DATABASE = {
  resources: [],
  actions: [],
  attributes: [],
  where: [],
}

const PREFIX_URL = '\\/api\\/'


const ROLES_DATABASE_MAP = [
  {
    roles: ['SUPER_ADMIN'],
    allow: {
      ...DEFAULT_ROLES_DATABASE,
      actions: '*'
    }
  },
  {
    roles: ['ADMIN'],
    allow: {
      ...DEFAULT_ROLES_DATABASE,
      actions: [
        {
          methods: '*', //or [ get, post ]
          url: `${PREFIX_URL}dashboard.+`
        },
        {
          methods: [ 'get', 'post', 'put' ],
          url: `${PREFIX_URL}manage\\/movie$`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/edit$`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail(\\/(comment|user))?`
        },
        {
          methods: '*',
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/info.+`
        },
        {
          methods: '*',
          url: `${PREFIX_URL}manage\\/user$`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail$`
        },
        {
          methods: [ 'get', 'delete' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/comment.?`
        },
        {
          methods: [ 'get', 'delete', 'put' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/feedback.?`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/(issue|rate).?`
        },
        {
          methods: '*',
          url: `${PREFIX_URL}manage\\/admin.?`
        },
        {
          methods: '*',
          url: `${PREFIX_URL}manage\\/media(\\/valid)?`
        }
      ]
    }
  },
  {
    roles: ['DEVELOPMENT'],
    allow: {
      ...DEFAULT_ROLES_DATABASE,
      actions: [
        {
          methods: '*', //or [ get, post ]
          url: `${PREFIX_URL}dashboard.+`
        },
        {
          methods: [ 'get', 'post', 'put' ],
          url: `${PREFIX_URL}manage\\/movie$`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/edit$`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail(\\/(comment|user))?`
        },
        {
          methods: [ 'get', 'post', 'put' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/info.+`
        },
        {
          methods: [ 'get', 'post', 'put' ],
          url: `${PREFIX_URL}manage\\/user$`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail$`
        },
        {
          methods: [ 'get', 'delete' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/comment.?`
        },
        {
          methods: [ 'get', 'put' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/feedback.?`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/(issue|rate).?`
        },
        {
          methods: '*',
          url: `${PREFIX_URL}manage\\/admin.?`
        },
        {
          methods: [ 'get', 'post', 'put' ],
          url: `${PREFIX_URL}manage\\/instance\\/(info|special)`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/media(\\/valid)?`
        }
      ]
    }
  },
  {
    roles: ['SUB_DEVELOPMENT'],
    allow: {
      ...DEFAULT_ROLES_DATABASE,
      actions: [
        {
          methods: '*', //or [ get, post ]
          url: `${PREFIX_URL}dashboard.+`
        },
        {
          methods: [ 'get', 'put' ],
          url: `${PREFIX_URL}manage\\/movie$`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/edit$`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail(\\/(comment|user))?`
        },
        {
          methods: [ 'get', 'post' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/info.+`
        },
        {
          methods: [ 'get', 'post' ],
          url: `${PREFIX_URL}manage\\/user$`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail$`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/comment.?`
        },
        {
          methods: [ 'get', 'put' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/feedback.?`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/movie\\/detail\\/(issue|rate).?`
        },
        {
          methods: '*',
          url: `${PREFIX_URL}manage\\/admin.?`
        },
        {
          methods: [ 'get' ],
          url: `${PREFIX_URL}manage\\/instance\\/(info|special)`
        }
      ]
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