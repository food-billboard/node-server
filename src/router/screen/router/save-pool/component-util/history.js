const { set } = require('lodash');
const UndoHistory = require('react-undo-component/lib/Component/history').default

// 最大的流式保存有效时间
const MAX_POOL_LIVE_TIME = 1000 * 60 * 10

// 最大等待存活接口时间
const MAX_WAITING_LIVE_TIME = 1000 * 4
class ScreenPoolUtil {


  // {
  //   key: {
  //     timestamps: Date.now(),
  //     checktimestamps: Date.now(),
  //     value: JSON.parse(data),
  //     version,
  //     _id: id,
  //     history: {
  //       history,
  //       isUndoDisabled: true,
  //       isRedoDisabled: true,
  //     },
  //   }
  // }
  DATASOUCE = {}

  getState = (id) => this.DATASOUCE[id] 

  isOvertime = (id) => {
    const result = !this.DATASOUCE[id] || (this.DATASOUCE[id].timestamps + MAX_POOL_LIVE_TIME < Date.now())
    if(result) delete this.DATASOUCE[id]
    return result 
  }

  createScreenPool = (id, screenData) => {
    const { data, version } = screenData
    const history = new HistoryUtil()
    this.DATASOUCE[id] = {
      timestamps: Date.now(),
      checktimestamps: Date.now(),
      version,
      _id: id,
      history: {
        history,
        isUndoDisabled: true,
        isRedoDisabled: true,
        value: JSON.parse(data),
      },
    }
  }

  isCheckTimestampsOvertime = (id) => {
    if(!this.DATASOUCE[id]) return true 
    const result = this.DATASOUCE[id].checktimestamps + MAX_WAITING_LIVE_TIME < Date.now() 
    if(result) delete this.DATASOUCE[id]
    return result 
  }

  updateScreenPoolCheckTimestamps = (id) => {
    if(!this.DATASOUCE[id]) throw new Error('id is not found')
    this.DATASOUCE[id].checktimestamps = Date.now() 
  }

  updateScreenPoolData = (id, config) => {
    this.DATASOUCE[id] = {
      ...config,
      timestamps: Date.now(),
    } 
  }

}

class HistoryUtil {
  constructor() {
    this.history = new UndoHistory({
      limit: 10,
      debug: false,
    });
  }

  history

  get isUndoDisabled() {
    return !this.history.history.past.length;
  }

  get isRedoDisabled() {
    return !this.history.history.future.length;
  }

  enqueue = (
    globalValue,
    state,
    prevState
  ) => {
    this.history.enqueue(state, prevState);

    set(globalValue, 'history.isUndoDisabled', this.isUndoDisabled);
    set(globalValue, 'history.isRedoDisabled', this.isRedoDisabled);
    return globalValue;
  };

  undo = (globalValue) => {
    const result = this.history.undo();
    set(globalValue, 'history.isUndoDisabled', this.isUndoDisabled);
    set(globalValue, 'history.isRedoDisabled', this.isRedoDisabled);
    if (this.history.isActionDataValid(result)) {
      set(globalValue, 'history.value', result);
    }
    return globalValue;
  };

  redo = (globalValue) => {
    const result = this.history.redo();
    set(globalValue, 'history.isUndoDisabled', this.isUndoDisabled);
    set(globalValue, 'history.isRedoDisabled', this.isRedoDisabled);
    if (this.history.isActionDataValid(result)) {
      set(globalValue, 'history.value', result);
    }
    return globalValue;
  };
}

module.exports = {
  HistoryUtil,
  MAX_LIMIT_COUNT: 10,
  ScreenPoolUtil: new ScreenPoolUtil()
}
