
const FIELDS_MAP = [ "name", "description", "author_description" ]

function sanitizersNameParams(originName) {
  const match = originName.match(/(?<=in:) (name|description|author_description) .+/)
  function reg(content) {
    return {
      $regex: content,
      $options: 'gi'
    }
  }
  if(Array.isArray(match)) {
    const [ target ] = match 
    const [ key, value ] = target.trim().split(' ').filter(item => !!item)
    if(FIELDS_MAP.includes(key)) {
      return {
        [key]: reg(value)
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
  sanitizersNameParams
}