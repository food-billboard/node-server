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

function getWordPinYin(word) {
  if(typeof word !== 'string') return word
  const firstWord = word.slice(0, 1)
  if(!checkCh(firstWord)) return firstWord.toUpperCase()
  const [ result ] = PinYin(firstWord, {
    style: pinyin.STYLE_INITIALS
  }) || []
  return typeof result === 'string' ? result.slice(0, 1).toUpperCase() : firstWord.toUpperCase()
}

module.exports = {
  getWordPinYin
}