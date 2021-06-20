import { useStaticRendering, enableStaticRendering } from 'mobx-react'
import Config from './config'

const isServer = typeof window === 'undefined'

enableStaticRendering(isServer)

export class Store {
  [key: string]: any
  // Comment 2
  constructor(initialState: any = {}) {
    for (const k in Config) {
      if (Config.hasOwnProperty(k)) {
        this[k] = new Config[k](initialState[k])
      }
    }
  }
}

let store: any = null
// Comment 3
export function initializeStore(initialState = {}) {
  if (isServer) {
    return new Store(initialState)
  }
  if (store === null) {
    store = new Store(initialState)
  }

  return store
}