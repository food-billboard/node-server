
const FIELDS_MAP = {
  name: "name", 
  description: "info.description", 
  author_description: "author_description"
}

function reg(content) {
  return {
    $regex: content,
    $options: 'gi'
  }
}

function sanitizersNameParams(originName) {
  const match = originName.match(/(?<=in:) (name|description|author_description) .+/)

  if(Array.isArray(match)) {
    const [ target ] = match 
    const [ key, value ] = target.trim().split(' ').filter(item => !!item)
    if(FIELDS_MAP[key]) {
      return {
        [FIELDS_MAP[key]]: reg(value)
      }
    }
  }

  return {
    $or: [
      {
        name: reg(originName)
      },
      {
        "info.description": reg(originName)
      },
      {
        author_description: reg(originName)
      },
    ]
  }
}

module.exports = {
  sanitizersNameParams,
  reg
}