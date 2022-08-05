
let ID_PATH_MAP = {};

function useIdPathMap(
  force = false,
  components = [],
) {
  if (force && !Object.keys(ID_PATH_MAP).length) {
    useComponentPath(components);
  }
  return ID_PATH_MAP;
}

function useComponentPath(
  components,
  customReturn,
  config,
) {
  const componentPathMap = {};

  const deepReduce = (
    list,
    disabled,
    path,
    config,
  ) => {
    return list.reduce((acc, cur, index) => {
      const { components } = cur;

      const nextPath = path
        ? `${path}.${index.toString()}.components`
        : `${index.toString()}.components`;
      const currentPath = path
        ? `${path}.${index.toString()}`
        : index.toString();

      const curComponentDisabled = disabled; // * 这里不需要再去判断lock || !!cur.config.attr.lock;

      // id path map
      componentPathMap[cur.id] = {
        id: cur.id,
        path: currentPath,
        disabled: curComponentDisabled,
        lock: !!cur.config.attr.lock,
        filter: (cur.config.data || {}).filter || [],
        name: cur.name,
      };

      if (customReturn) {
        acc.push(
          customReturn(
            { ...cur, path: currentPath },
            nextPath,
            curComponentDisabled,
            deepReduce,
            config,
          ),
        );
      } else {
        acc.push({
          ...cur,
          path: currentPath,
          components: deepReduce(
            components,
            curComponentDisabled,
            nextPath,
            config,
          ),
        });
      }

      return acc;
    }, []);
  };

  const result = deepReduce(components, false, '', config);

  ID_PATH_MAP = {
    ...componentPathMap,
  };

  return result;
}

module.exports = {
  useIdPathMap,
  useComponentPath
}