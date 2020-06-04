const itemList = document.querySelectorAll(".item")
const methodList = document.querySelectorAll('.method')
const exampleList = document.querySelectorAll('.example')
const modalList = document.querySelectorAll('.modal')
const codeDetailList = document.querySelectorAll(".code-detail")

itemList.forEach(i => {
  i.addEventListener('click', controlItemListShow, false)
})

methodList.forEach(m => {
  m.parentNode.addEventListener("click", controlMethodItemShow, false)
})

exampleList.forEach(e => {
  e.addEventListener("click", controlExampleItemShow, false)
})

modalList.forEach(m => {
  m.addEventListener("click", controlModalItemShow, false)
})

codeDetailList.forEach(c => {
  c.addEventListener("click", controlCodeShow, false)
})

function controlItemListShow() {
  const bro = this.nextElementSibling
  if(bro && bro.classList) {
    bro.classList.toggle("hide")
  }
}

function controlMethodItemShow() {
  const bro = this.nextElementSibling
  bro.classList.toggle('hide')
} 

function controlExampleItemShow() {
  const bro = this.nextElementSibling
  const target = this.parentNode && this.parentNode.nextElementSibling
  const targetBro = target && target.nextElementSibling
  !this.classList.contains("active") && this.classList.add("active")
  bro.classList.contains("active") && bro.classList.remove("active")
  if(targetBro && !targetBro.classList.contains("hide")) targetBro.classList.add("hide")
  if(target && target.classList.contains("hide")) target.classList.remove("hide")
}

function controlModalItemShow() {
  const bro = this.previousElementSibling
  const targetBro = this.parentNode && this.parentNode.nextElementSibling
  const target = targetBro && targetBro.nextElementSibling
  !this.classList.contains("active") && this.classList.add("active")
  bro.classList.contains("active") && bro.classList.remove("active")
  if(targetBro && targetBro.classList && !targetBro.classList.contains("hide")) targetBro.classList.add("hide")
  if(target && target.classList.contains("hide")) target.classList.remove("hide")
  if(target) target.classList.toggle("scroll")
}

function controlCodeShow() {
  this.classList.toggle("code-hide")
  this.classList.toggle("code-show")
  const bro = this.nextElementSibling
  if(bro) {
    bro.classList.toggle("hide")
  }
}