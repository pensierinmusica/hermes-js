import hermes from '../src/index.js';

const actionsList = [
  'NEW_MESSAGE',
  'NOTIFICATION',
  'USER_LOGIN'
];
const dispatch = action => action;
const middleware = [(action, next) => next()];
const dispatcher = hermes(actionsList, dispatch, middleware);
const actionType = 'USER_LOGIN';
const data = Symbol();
const meta = { prop: Symbol() };
const action = { type: actionType, data: undefined, meta: {} };
const actionWithData = { type: actionType, data, meta: {} };
const actionWithDataAndMeta = { type: actionType, data, meta };
const res = Symbol();

describe('Hermes', () => {

  describe('Initializer', () => {

    it('throws if the actions list is not an array', () => {
      expect(() => hermes(undefined, dispatch, middleware)).toThrow();
      expect(() => hermes({}, dispatch, middleware)).toThrow();
      expect(() => hermes(() => {}, dispatch, middleware)).toThrow();
    });

    it('throws if an element of the actions list is not a string', () => {
      expect(() => hermes([...actionsList, {}], dispatch, middleware)).toThrow();
      expect(() => hermes([...actionsList, () => {}], dispatch, middleware)).toThrow();
    });

    it('throws if dispatch is not a function', () => {
      expect(() => hermes(actionsList, undefined, middleware)).toThrow();
      expect(() => hermes(actionsList, {}, middleware)).toThrow();
    });

    it('throws if it receives a middleware list that is not an array', () => {
      expect(() => hermes(actionsList, dispatch, null)).toThrow();
      expect(() => hermes(actionsList, dispatch, {})).toThrow();
      expect(() => hermes(actionsList, dispatch, () => {})).toThrow();
    });

    it('throws if an element of the middleware list is not a function', () => {
      expect(() => hermes(actionsList, dispatch, [...middleware, {}])).toThrow();
      expect(() => hermes(actionsList, dispatch, [...middleware, undefined])).toThrow();
    });

    it('returns a function when all arguments are passed correctly', () => {
      expect(typeof hermes(actionsList, dispatch)).toBe('function');
      expect(typeof hermes(actionsList, dispatch, middleware)).toBe('function');
    });

  });

  describe('Dispatcher', () => {

    it('throws if the dispatched action type is not a string', () => {
      expect(() => dispatcher()).toThrow();
      expect(() => dispatcher({})).toThrow();
      expect(() => dispatcher([])).toThrow();
      expect(() => dispatcher(5)).toThrow();
      expect(() => dispatcher(() => {})).toThrow();
      expect(() => dispatcher(null)).toThrow();
      expect(() => dispatcher(Symbol())).toThrow();
    });

    it('throws if the dispatched action type is not part of the original actions list', () => {
      expect(() => dispatcher('foo')).toThrow();
    });

    it('throws if the dispatched metadata is not an object', () => {
      expect(() => dispatcher(actionType, data, null)).toThrow();
      expect(() => dispatcher(actionType, data, 'foo')).toThrow();
      expect(() => dispatcher(actionType, data, [])).toThrow();
      expect(() => dispatcher(actionType, data, () => {})).toThrow();
    });

    it('invokes the dispatch function with the dispatched action', () => {
      const dispatch1 = jest.fn();
      const dispatch2 = jest.fn();
      const dispatchFunctions = [dispatch1, dispatch2];
      const dispatcher1 = hermes(actionsList, dispatch1);
      const dispatcher2 = hermes(actionsList, dispatch2, middleware);
      const dispatchers = [dispatcher1, dispatcher2];
      const actions = [action, actionWithData, actionWithDataAndMeta];
      dispatchers.forEach(dispatcher => {
        dispatcher(actionType);
        dispatcher(actionType, data);
        dispatcher(actionType, data, meta);
      });
      dispatchFunctions.forEach(dispatch => {
        expect(dispatch.mock.calls.length).toBe(3);
        for (let i = 0; i < 3; i++) {
          expect(dispatch.mock.calls[i].length).toBe(1);
          expect(dispatch.mock.calls[i][0]).toEqual(actions[i]);
        }
      });
    });

    it('returns action responses', () => {
      const dispatch = jest.fn();
      dispatch.mockReturnValue(res);
      const dispatcher1 = hermes(actionsList, dispatch);
      const dispatcher2 = hermes(actionsList, dispatch, middleware);
      expect(dispatcher1(actionType)).toBe(res);
      expect(dispatcher2(actionType)).toBe(res);
    });

    it('invokes every middleware function passing the action, the next callback, and a validator function', () => {
      const middleware1 = jest.fn((action, next) => next());
      const middleware2 = jest.fn();
      const middlewares = [middleware1, middleware2];
      const dispatcher = hermes(actionsList, dispatch, middlewares);
      const actions = [action, actionWithData, actionWithDataAndMeta];
      dispatcher(actionType);
      dispatcher(actionType, data);
      dispatcher(actionType, data, meta);
      middlewares.forEach(middleware => {
        expect(middleware.mock.calls.length).toBe(3);
        for (let i = 0; i < 3; i++) {
          expect(middleware.mock.calls[i].length).toBe(3);
          expect(middleware.mock.calls[i][0]).toEqual(actions[i]);
          expect(typeof middleware.mock.calls[i][1]).toBe('function');
          expect(typeof middleware.mock.calls[i][2]).toBe('function');
        }
      });
    });

    it('the validator simply returns an action name or throws an error if it’s not part of the original actions list', () => {
      let validator;
      const middleware = (action, next, at) => (validator = at);
      const dispatcher = hermes(actionsList, dispatch, [middleware]);
      dispatcher(actionType);
      expect(() => validator('foo')).toThrow();
      expect(validator(actionType)).toBe(actionType);
    });

    it('invokes each middleware in the correct order, and dispatch at the end', () => {
      const middleware1 = jest.fn((action, next) => {
        expect(middleware2.mock.calls.length).toBe(0);
        expect(dispatch.mock.calls.length).toBe(0);
        next();
      });
      const middleware2 = jest.fn((action, next) => {
        expect(middleware1.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls.length).toBe(0);
        next();
      });
      const dispatch = jest.fn();
      const dispatcher = hermes(actionsList, dispatch, [middleware1, middleware2]);
      dispatcher(actionType);
      expect(middleware1.mock.calls.length).toBe(1);
      expect(middleware2.mock.calls.length).toBe(1);
      expect(dispatch.mock.calls.length).toBe(1);
    });

    it('if a middleware does not invoke the next callback the dispatch cycle stops', () => {
      const middleware1 = jest.fn();
      middleware1.mockReturnValue(res);
      const middleware2 = jest.fn();
      const dispatch = jest.fn();
      const dispatcher = hermes(actionsList, dispatch, [middleware1, middleware2]);
      expect(dispatcher(actionType)).toBe(res);
      expect(middleware1.mock.calls.length).toBe(1);
      expect(middleware2.mock.calls.length).toBe(0);
      expect(dispatch.mock.calls.length).toBe(0);
    });

  });

});
