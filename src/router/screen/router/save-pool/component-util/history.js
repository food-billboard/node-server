const { set } = require('lodash');
const UndoHistory = require('react-undo-component/lib/Component/history').default

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

  isFirst = true;

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
      set(globalValue, 'components', result);
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

module.exports = HistoryUtil
