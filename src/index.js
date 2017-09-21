const errorMsgs = {
  actionsList: 'The actions list must be an array of strings',
  actionType: type => `The action "${type}" is not part of the provided actions list`,
  dispatch: '"dispatch" must be a function',
  meta: 'The action metadata must be an object',
  middleware: 'The middleware list must be an array of functions'
};

function validateMeta (meta) {
  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) throw new Error(errorMsgs.meta);
  return true;
}

export default (actionsList, dispatch, middleware) => {
  if (!Array.isArray(actionsList)) throw new Error(errorMsgs.actionsList);
  const actionsMap = {};
  actionsList.forEach(type => {
    if (typeof type !== 'string') throw new Error(errorMsgs.actionsList);
    actionsMap[type] = type;
  });
  function validateType (type) {
    if (actionsMap[type]) return type;
    else throw new Error(errorMsgs.actionType(type));
  }
  if (typeof dispatch !== 'function') throw new Error(errorMsgs.dispatch);
  if (middleware !== undefined) {
    if (!Array.isArray(middleware)) throw new Error(errorMsgs.middleware);
    middleware.reverse();
    middleware.forEach(func => {
      if (typeof func !== 'function') throw new Error(errorMsgs.middleware);
      const nextDispatch = dispatch;
      dispatch = action => func(action, () => nextDispatch(action), validateType);
    });
  }
  function dispatcher (type, data, meta) {
    validateType(type);
    if (meta !== undefined) {
      validateMeta(meta);
      return dispatch({ type, data, meta: { ...meta } });
    }
    return dispatch({type, data, meta: {}});
  }
  return dispatcher;
};
