const PinYin = require('pinyin')

function checkCh(str){
  var len = 0
  for(var i = 0; i < str.length; i++) {
      if(str.charCodeAt(i) > 255) {
      len += 2
    }else{
      len++
    }  
  }
  return len == 2
} 

function internalGetWordPinYin(word) {
  if(typeof word !== 'string') return word
  const firstWord = word.slice(0, 1)
  if(!checkCh(firstWord)) return firstWord.toUpperCase()
  const [ result ] = PinYin(firstWord, {
    style: pinyin.STYLE_INITIALS
  }) || []
  return typeof result === 'string' ? result.slice(0, 1).toUpperCase() : firstWord.toUpperCase()
}

const WORD_MAP = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U',
  'V', 'W', 'X', 'Y', 'Z'
]

function getWordPinYin(word) {
  let text = word 
  let result = text
  while(typeof text === 'string' && text.length && !WORD_MAP.includes(result)) {
    result = internalGetWordPinYin(text)
    text = text.slice(1)
  }
  return result
}

module.exports = {
  getWordPinYin
}