const { nanoid } = require('nanoid')
const { mergeWith } = require('lodash')

function mergeWithoutArray(...args) {
  return mergeWith(...args, (value, srcValue) => {
    if (Array.isArray(value)) {
      return srcValue;
    }
  });
}

const DEFAULT_CONFIG = {
  style: {
    width: 200,
    height: 200,
    left: 0,
    top: 0,
    opacity: 1,
    rotate: 0,
    zIndex: 2,
    skew: {
      x: 0,
      y: 0,
    },
  },
  attr: {
    visible: true,
    lock: false,
  },
};

const DEFAULT_CONDITION_CONFIG_ITEM_RULE_VALUE =
  () => ({
    id: nanoid(),
    params: '',
    condition: 'equal',
    value: '',
  });

const DEFAULT_CONDITION_CONFIG_ITEM_RULE =
  () => ({
    id: nanoid(),
    type: 'and',
    rule: [
      {
        ...DEFAULT_CONDITION_CONFIG_ITEM_RULE_VALUE(),
      },
    ],
  });

const DEFAULT_CONDITION_CONFIG =
  () => ({
    value: [
      {
        id: nanoid(),
        action: 'hidden',
        type: 'condition',
        value: {
          code: {
            relation: [],
            code: `
            // 可从参数中获取相关数据
            // 在这里添加逻辑
            // 返回true | false 表示是否符合条件
            return true 
          `,
          },
          condition: {
            id: nanoid(),
            type: 'and',
            rule: [
              {
                ...DEFAULT_CONDITION_CONFIG_ITEM_RULE(),
              },
            ],
          },
        },
      },
    ],
    initialState: 'visible',
  });

module.exports = {
  DEFAULT_CONFIG,
  DEFAULT_CONDITION_CONFIG,
  mergeWithoutArray
}