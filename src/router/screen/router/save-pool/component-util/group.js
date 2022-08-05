const { get, set, merge, pick, isNil } = require('lodash');
const { useIdPathMap, useComponentPath } = require('./hook');
const {
  getParentComponent,
  getParentPath,
  createGroupComponent,
  isGroupComponent,
  getParentComponentIds,
} = require('./component');

function mergeWithoutArray(...args) {
  // @ts-ignore
  return mergeWith(...args, (value, srcValue) => {
    if (Array.isArray(value)) {
      return srcValue;
    }
  });
}

class GroupUtil {
  getComponentPosition = (
    value,
    components,
  ) => {
    const idPathMap = useIdPathMap();
    const {
      id,
      parent,
      config: {
        style: { left, top, width, height },
        attr: { scaleX = 1, scaleY = 1 },
      },
    } = value;
    const targetPath = idPathMap[id];
    const { path } = targetPath;
    let initPosition = {
      left,
      top,
      width,
      height,
      scaleX,
      scaleY,
    };

    if (parent) {
      let parentPath = path;
      let parentComponent = getParentComponent(
        components,
        parentPath,
      );

      function getParent() {
        parentPath = getParentPath(parentPath);
        parentComponent = getParentComponent(components, parentPath);
        if (Array.isArray(parentComponent)) {
          getParent();
        }
      }

      getParent();

      while (parentComponent) {
        const {
          config: {
            style: { left, top },
            attr: { scaleX = 1, scaleY = 1 },
          },
        } = parentComponent;

        initPosition.left = initPosition.left * scaleX + left;
        initPosition.top = initPosition.top * scaleY + top;

        initPosition.width *= scaleX;
        initPosition.height *= scaleY;

        initPosition.scaleX *= scaleX;
        initPosition.scaleY *= scaleY;

        getParent();
      }
    } else {
      initPosition = {
        left,
        top,
        width,
        height,
        scaleX,
        scaleY,
      };
    }

    return initPosition;
  };

  mergeParentConfig = (
    {
      components,
      path,
      parent,
    },
    callback
  ) => {
    let parentComponent = getParentComponent(
      components,
      path,
    );

    parentComponent = callback(parentComponent);

    if (parent) {
      set(components, getParentPath(path), parentComponent);
      return components;
    } else {
      return parentComponent;
    }
  };

  updateSelectConfig = (
    {
      select,
      components,
    },
    callback
  ) => {
    // format the sub component position
    const updateComponents = select.map(
      (item) => {
        useComponentPath(components);
        const idPathMap = useIdPathMap();

        const targetPath = idPathMap[item];

        const { path } = targetPath;
        const target = get(components, path);

        return callback(target, path);
      },
    );

    return updateComponents;
  };

  deletePrevComponent = (
    component,
    components,
    path,
  ) => {
    const { id } = component;

    const parentPath = getParentPath(path);
    const superParentPath = getParentPath(parentPath);
    const parentComponent = get(components, parentPath);
    const superParentComponent = get(components, superParentPath);

    // outer
    if (!parentPath) {
      components = components.filter((component) => component.id !== id);
    }
    // inner
    else {
      superParentComponent.components = parentComponent.filter(
        (component) => component.id !== id,
      );
      set(components, superParentPath, superParentComponent);
    }

    return components;
  };

  // ? 1.5
  deleteAndMoveComponent = ({
    select,
    components,
    clickTarget,
    groupComponent,
  }) => {
    const actionComponents = [];
    let idPathMap = useIdPathMap();

    function formatComponent(component) {
      return mergeWithoutArray({}, component, {
        parent: groupComponent.id,
        config: {
          style: {
            left:
              component.config.style.left - groupComponent.config.style.left,
            top: component.config.style.top - groupComponent.config.style.top,
          },
        },
      });
    }

    const needDealSelect = [...select];
    const targetIdIndex = needDealSelect.indexOf(clickTarget.id);
    needDealSelect.splice(targetIdIndex, 1);

    groupComponent.components.push(formatComponent(clickTarget));

    needDealSelect.forEach((selectId) => {
      const { path } = idPathMap[selectId];

      groupComponent.components.push(formatComponent(get(components, path)));

      actionComponents.push({
        value: {},
        id: selectId,
        action: 'delete',
      });
    });

    actionComponents.push({
      value: groupComponent,
      id: clickTarget.id,
      action: 'cover_update',
    });

    return actionComponents;
  };

  // 成组组件的新宽高位置
  generateGroupComponentSizeAndPosition(
    groupComponents,
    components,
    calculated = false,
  ) {
    // 从group中抽出其left和top
    let formatSelectPositionMap = {};

    // the component parent limit position
    return groupComponents.reduce(
      (acc, cur) => {
        let left = cur.config.style.left;
        let top = cur.config.style.top;
        let width = cur.config.style.width;
        let height = cur.config.style.height;
        if (!calculated) {
          const result = this.getComponentPosition(cur, components);
          left = result.left;
          top = result.top;
          width = result.width;
          height = result.height;
        }

        formatSelectPositionMap[cur.id] = {
          left,
          top,
          width,
          height,
        };

        if (left < acc.left) acc.left = left;
        if (left + width > acc.right) acc.right = left + width;
        if (top < acc.top) acc.top = top;
        if (top + height > acc.bottom) acc.bottom = top + height;

        return acc;
      },
      {
        left: 99999,
        right: 0,
        top: 99999,
        bottom: 0,
      },
    );
  }

  // 成组
  generateGroupConfig = ({
    select,
    components,
    clickTarget,
    callback,
  }) => {
    const idPathMap = useIdPathMap();
    const { parent } = clickTarget;

    const path = (idPathMap[parent] || {}).path;
    const parentComponent = get(components, path);

    const addComponents = select.map((item) => {
      const path = idPathMap[item].path;
      const component = get(components, path);
      const formatComponentPosition = this.getComponentPosition(
        component,
        components,
      );
      const newComponent = merge({}, component, {
        config: {
          style: {
            ...pick(
              formatComponentPosition || {},
              'left',
              'top',
              'width',
              'height',
            ),
          },
        },
      });

      if (isGroupComponent(newComponent)) {
        newComponent.config.attr = {
          ...newComponent.config.attr,
          prevScaleX: newComponent.config.attr.scaleX,
          prevScaleY: newComponent.config.attr.scaleY,
          ...pick(formatComponentPosition || {}, 'scaleX', 'scaleY'),
        };
      }

      return newComponent;
    });

    const result = this.addComponentsToGroup(
      components,
      parentComponent,
      addComponents,
    );

    // 实际更改
    let realResult = [];
    // 新增的组件 即需要成组的组件
    let addResult = [];
    result.forEach((actionItem) => {
      const { action, id } = actionItem;
      if (action === 'add') {
        addResult.push(actionItem);
      } else if (action === 'update') {
        if (id !== clickTarget.id) {
          realResult.push(actionItem);
        }
      }
    });

    const {
      left: groupComponentLeft,
      top: groupComponentTop,
      right,
      bottom,
    } = this.generateGroupComponentSizeAndPosition(
      addResult.map((item) => {
        return {
          config: {
            style: {
              left: get(item, "value.config.style.left") || 0,
              top: get(item, "value.config.style.top") || 0,
              width: get(item, "value.config.style.width") || 0,
              height: get(item, "value.config.style.height") || 0,
            },
          },
        };
      }),
      [],
      true,
    );
    // 创建新组
    const newGroupComponent = createGroupComponent({
      parent: (parentComponent || {}).id,
      config: {
        style: {
          left: groupComponentLeft,
          top: groupComponentTop,
          width: right - groupComponentLeft,
          height: bottom - groupComponentTop,
        },
      },
      components: [],
    });
    newGroupComponent.components = addResult.map((item) => {
      return merge({}, item.value, {
        parent: newGroupComponent.id,
        config: {
          style: {
            left: (get(item, "value.config.style.left") || 0) - groupComponentLeft,
            top: (get(item, "value.config.style.top") || 0) - groupComponentTop,
          },
        },
      });
    });

    realResult.push(
      ...(addComponents
        .filter((item) => item.id !== clickTarget.id)
        .map((item) => {
          return {
            action: 'delete',
            value: {},
            id: item.id,
          };
        })),
      {
        action: 'cover_update',
        id: clickTarget.id,
        value: newGroupComponent,
      },
    );

    callback && callback(newGroupComponent.id);

    return realResult;
  };

  // 取消成组
  splitGroupConfig = ({
    clickTarget,
    components,
    select,
  }) => {
    const {
      config: {
        style: { left, top },
      },
      id,
      parent,
    } = clickTarget;
    const idPathMap = useIdPathMap();
    const { path } = idPathMap[id] || {};

    // format the sub component position
    const [updateComponents] =
      this.updateSelectConfig(
        {
          select,
          components,
        },
        (config) => {
          const {
            components,
            parent,
            config: {
              attr: { scaleX = 1, scaleY = 1 },
            },
          } = config;

          const newConfig = {
            ...config,
            components: components.map((config) => {
              const {
                config: {
                  style: { left: compLeft, top: compTop, width, height },
                  attr: { scaleY: compScaleY = 1, scaleX: compScaleX = 1 },
                },
              } = config;

              const newConfig = mergeWithoutArray(
                {},
                config,
                {
                  config: {
                    style: {
                      left: compLeft * scaleX + left,
                      top: compTop * scaleY + top,
                      width: width * scaleX,
                      height: height * scaleY,
                    },
                  },
                },
                isGroupComponent(config)
                  ? {
                      config: {
                        attr: {
                          scaleY: compScaleY * scaleY,
                          scaleX: compScaleX * scaleX,
                        },
                      },
                    }
                  : {},
              );
              // * avoid undefined
              newConfig.parent = parent;

              return newConfig;
            }),
          };

          return newConfig;
        },
      );

    return this.mergeParentConfig(
      {
        components,
        path,
        parent,
      },
      (parentComponent) => {
        const targetIndex = (parentComponent || components).findIndex((item) =>
          select.includes(item.id),
        );
        // generate the list
        const newComponents = [...(parentComponent || components)];
        newComponents.splice(targetIndex, 1, ...updateComponents.components);
        return newComponents;
      },
    );
  };

  // 粘贴组件
  addComponentsToGroup = (
    components,
    groupComponent,
    addComponents,
  ) => {
    const { id: originGroupComponentId } = groupComponent || {};
    const idPathMap = useIdPathMap();

    const originGroupComponentPath =
      (idPathMap[originGroupComponentId] || {}).path || '';
    const path = originGroupComponentPath.split('.')[0];

    const topParentComponent =
      get(components, path) || groupComponent;

    const initialAddComponentsPosition =
      this.generateGroupComponentSizeAndPosition(
        addComponents,
        components,
        true,
      );

    let templateAddComponentsPosition = {
      ...initialAddComponentsPosition,
    };

    let calculateScaleX = 1;
    let calculateScaleY = 1;

    const addComponentsDistance = addComponents.map((item) => {
      return {
        left: item.config.style.left - templateAddComponentsPosition.left,
        top: item.config.style.top - templateAddComponentsPosition.top,
      };
    });

    const parentIds = getParentComponentIds(originGroupComponentId, components);
    originGroupComponentId && parentIds.push(originGroupComponentId);

    const deepFormat = (
      groupComponent,
      isOuter,
    ) => {
      let result = [];

      const {
        config: {
          style: { left, top, width, height },
          attr: { scaleX = 1, scaleY = 1 },
        },
        id,
        components: groupChildren,
      } = groupComponent || {
        config: {
          style: { left: 0, top: 0, width: 999999, height: 999999 },
          attr: { scaleX: 1, scale: 1 },
        },
        id: undefined,
        components: [],
      };

      const isRelationGroupComponent = isOuter || parentIds.includes(id);

      let newLeft = left;
      let newTop = top;
      let newRight = left + width;
      let newBottom = top + height;
      let newWidth = width;
      let newHeight = height;
      let newTempAddComponentLeft = 0;
      let newTempAddComponentTop = 0;

      if (isRelationGroupComponent) {
        newLeft = Math.min(templateAddComponentsPosition.left, left);
        newTop = Math.min(templateAddComponentsPosition.top, top);
        newRight = Math.max(left + width, templateAddComponentsPosition.right);
        newBottom = Math.max(
          top + height,
          templateAddComponentsPosition.bottom,
        );
        newWidth = newRight - newLeft;
        newHeight = newBottom - newTop;
        calculateScaleX *= scaleX;
        calculateScaleY *= scaleY;

        const tempAddComponentWidth =
          (templateAddComponentsPosition.right -
            templateAddComponentsPosition.left) /
          scaleX;
        const tempAddComponentHeight =
          (templateAddComponentsPosition.bottom -
            templateAddComponentsPosition.top) /
          scaleY;
        newTempAddComponentLeft =
          (templateAddComponentsPosition.left - newLeft) / scaleX;
        newTempAddComponentTop =
          (templateAddComponentsPosition.top - newTop) / scaleY;

        templateAddComponentsPosition = {
          left: newTempAddComponentLeft,
          top: newTempAddComponentTop,
          right: newTempAddComponentLeft + tempAddComponentWidth,
          bottom: newTempAddComponentTop + tempAddComponentHeight,
        };
      }

      const changeLeft = (left - newLeft) / scaleX;
      const changeTop = (top - newTop) / scaleY;

      const isConfigChanged =
        !!changeLeft ||
        !!changeTop ||
        newWidth !== width ||
        newHeight !== height;

      // 更改当前组
      isConfigChanged &&
        !!id &&
        result.push(
          // 非目标组
          {
            action: 'update',
            id,
            value: {
              config: {
                style: {
                  width: newWidth,
                  height: newHeight,
                  left: newLeft,
                  top: newTop,
                },
              },
            },
          },
        );

      // 当前组下的子组件
      isRelationGroupComponent &&
        !!id &&
        result.push(
          ...groupChildren.reduce<any>((acc, item) => {
            // 未改变且为组件
            if (!isConfigChanged && !isGroupComponent(item)) return acc;

            const path = idPathMap[item.id].path;

            // 改变了且为组件
            if (
              (!isGroupComponent(item) ||
                !originGroupComponentPath.startsWith(path)) &&
              isConfigChanged
            ) {
              acc.push({
                action: 'update',
                id: item.id,
                value: {
                  config: {
                    style: {
                      left: item.config.style.left + changeLeft,
                      top: item.config.style.top + changeTop,
                    },
                  },
                },
              });
            }
            // 改变了且为目标上层组
            else {
              acc.push(
                ...deepFormat(
                  merge({}, item, {
                    config: {
                      style: {
                        left: item.config.style.left + changeLeft,
                        top: item.config.style.top + changeTop,
                      },
                    },
                  }),
                  false,
                ),
              );
            }

            return acc;
          }, []),
        );

      // 目标组
      if (originGroupComponentId === id) {
        const path = (idPathMap[id] || {}).path;

        const scaleX = get(item, 'config.attr.scaleX')
        const scaleY = get(item, 'config.attr.scaleY')

        result.push(
          ...addComponents.map((item, index) => {
            return {
              value: merge({}, item, {
                parent: id,
                config: {
                  style: {
                    left:
                      addComponentsDistance[index].left / calculateScaleX +
                      newTempAddComponentLeft,
                    top:
                      addComponentsDistance[index].top / calculateScaleY +
                      newTempAddComponentTop,
                    width: item.config.style.width / calculateScaleX,
                    height: item.config.style.height / calculateScaleY,
                  },
                  attr: {
                    scaleX:
                      (isNil(scaleX) ? 1 : scaleX) / calculateScaleX,
                    scaleY:
                      (isNil(scaleY) ? 1 : scaleY) / calculateScaleY,
                  },
                },
              }),
              id: item.id,
              path: path ? path + '.components' : undefined,
              action: 'add',
            };
          }),
        );
      }

      return result;
    };

    return deepFormat(topParentComponent, true);
  };
}

module.exports = new GroupUtil();
