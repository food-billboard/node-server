const { get } = require('lodash')
const { nanoid } = require('nanoid')
const { useIdPathMap } = require('./hook');
const { DEFAULT_CONFIG, DEFAULT_CONDITION_CONFIG, mergeWithoutArray } = require('./constants')

const EComponentType = {
  GROUP_COMPONENT: "GROUP_COMPONENT",
  COMPONENT: "COMPONENT"
}

function isComponentParentEqual(targetA, targetB) {
  if (typeof targetA === 'string' && typeof targetB === 'string')
    return targetA === targetB;
  return !!targetA === !!targetB;
}

const isGroupComponent = (
  component,
) => {
  return EComponentType.GROUP_COMPONENT === component.type;
};

const getParentComponentIds = (
  id,
  sourceComponents
) => {
  let components;
  if (sourceComponents) {
    components = sourceComponents;
  } else {
    const state = getDvaGlobalModelData();
    components = state ? state.components : [];
  }
  const idPathMap = useIdPathMap();

  let parentIds = [];
  let path = (idPathMap[id] || {}).path;
  let target = get(components, path);

  while ((target || {}).parent) {
    parentIds.push(target.parent);
    path = (idPathMap[target.parent] || {}).path;
    target = get(components, path);
  }

  return parentIds;
};

const getParentPath = (path) => {
  const pathList = path.split('.');
  const parentPath = pathList.slice(0, -1).join('.');
  return parentPath;
};

const getParentComponent = (components, path) => {
  return get(components, getParentPath(path));
};

const createGroupComponent = (
  component
) => {
  const name = `组-${Date.now()}`;
  return mergeWithoutArray(
    {},
    {
      id: nanoid(),
      description: name,
      name,
      type: EComponentType.GROUP_COMPONENT,
      componentType: "GROUP_COMPONENT",
      config: {
        ...DEFAULT_CONFIG,
        options: {
          condition: DEFAULT_CONDITION_CONFIG(),
        },
      },
    },
    component,
  );
};

module.exports = {
  isComponentParentEqual,
  isGroupComponent,
  getParentComponentIds,
  getParentPath,
  getParentComponent,
  createGroupComponent
}