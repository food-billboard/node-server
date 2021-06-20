

export default class Base<T extends object=any> {

  [key: string]: any

  constructor(initState: T) {
    for (const k in initState) {
      if (initState.hasOwnProperty(k)) {
        this[k as string] = initState[k]
      }
    }
  }
}