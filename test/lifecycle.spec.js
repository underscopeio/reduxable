import Reduxable, { createStore, combineReducers } from '../src'

// const COMPONENT_WILL_MOUNT = 'componentWillMount'
const COMPONENT_DID_MOUNT = 'componentDidMount'
const STATE_WILL_CHANGE = 'stateWillChange'
// const STATE_DID_CHANGE = 'stateDidChange'
const ACTION_WILL_DISPATCH = 'actionWillDispatch'
const ACTION_DID_DISPATCH = 'actionDidDispatch'

class LifecycleTests extends Reduxable {
  constructor() {
    super(0, { increment: state => state + 1, decrement: state => state - 1 })
  }

  pushLifecycleEvent(type, args) {
    this.lifecycleEvents = this.lifecycleEvents || []
    this.lifecycleEvents.push({ type, args: [].slice.call(args) })
  }
}

class MountingEventsTest extends LifecycleTests {
  componentDidMount() {
    this.pushLifecycleEvent(COMPONENT_DID_MOUNT, arguments)
  }
}

class ActionEventsTest extends LifecycleTests {
  actionWillDispatch(action) {
    this.pushLifecycleEvent(ACTION_WILL_DISPATCH, arguments)
  }

  actionDidDispatch(action) {
    this.pushLifecycleEvent(ACTION_DID_DISPATCH, arguments)
  }
}

class StateEventsTest extends LifecycleTests {
  stateWillChange(newState) {
    this.pushLifecycleEvent(STATE_WILL_CHANGE, arguments)
  }
}

class WholeLifecycle extends LifecycleTests {
  componentDidMount() {
    this.pushLifecycleEvent(COMPONENT_DID_MOUNT, arguments)
  }

  stateWillChange(newState) {
    this.pushLifecycleEvent(STATE_WILL_CHANGE, arguments)
  }

  actionWillDispatch(action) {
    this.pushLifecycleEvent(ACTION_WILL_DISPATCH, arguments)
  }

  actionDidDispatch(action) {
    this.pushLifecycleEvent(ACTION_DID_DISPATCH, arguments)
  }
}

describe('Reduxable lifecycle', () => {
  beforeEach(() => {
    Reduxable._setStore(undefined)
  })

  describe('component mounting', () => {
    it('should call `componentDidMount`', () => {
      const lifecycleReduxable = new MountingEventsTest()

      expect(lifecycleReduxable.lifecycleEvents).toEqual([{ type: COMPONENT_DID_MOUNT, args: [] }])
    })

    it('should call `childDidMount` and then `parentDidMount`', () => {
      const events = []

      class Child extends Reduxable {
        constructor() {
          super(0, { reducer: x => x })
        }

        componentDidMount() {
          events.push('childDidMount')
        }
      }

      class Parent extends Reduxable {
        constructor() {
          super({ child: new Child() }, { reducer: x => x })
        }

        componentDidMount() {
          events.push('parentDidMount')
        }
      }
      new Parent()

      expect(events).toEqual(['childDidMount', 'parentDidMount'])
    })
  })

  describe('action dispatching', () => {
    it('should call `actionWillDispatch` and then `actionDidDispatch`', () => {
      const actionEventsTest = new ActionEventsTest()
      const store = createStore(actionEventsTest)
      Reduxable._setStore(store)

      actionEventsTest.reducers.increment()

      const expectedAction = { type: 'increment', payload: undefined, scope: undefined }

      expect(actionEventsTest.lifecycleEvents).toEqual([
        { type: ACTION_WILL_DISPATCH, args: [expectedAction] },
        { type: ACTION_DID_DISPATCH, args: [expectedAction] },
      ])
    })

    it('should call `actionWillDispatch` and `actionDidDispatch` twice if the reducer is called twice', () => {
      const actionEventsTest = new ActionEventsTest()
      const store = createStore(actionEventsTest)
      Reduxable._setStore(store)

      actionEventsTest.reducers.increment()
      actionEventsTest.reducers.increment()

      const expectedAction = { type: 'increment', payload: undefined, scope: undefined }

      expect(actionEventsTest.lifecycleEvents).toEqual([
        { type: ACTION_WILL_DISPATCH, args: [expectedAction] },
        { type: ACTION_DID_DISPATCH, args: [expectedAction] },
        { type: ACTION_WILL_DISPATCH, args: [expectedAction] },
        { type: ACTION_DID_DISPATCH, args: [expectedAction] },
      ])
    })

    it('should call `actionWillDispatch` and `actionDidDispatch` for different reducers', () => {
      const actionEventsTest = new ActionEventsTest()
      const store = createStore(actionEventsTest)
      Reduxable._setStore(store)

      actionEventsTest.reducers.increment()
      actionEventsTest.reducers.decrement()
      actionEventsTest.reducers.increment()

      const oneAction = { type: 'increment', payload: undefined, scope: undefined }
      const otherAction = { type: 'decrement', payload: undefined, scope: undefined }

      expect(actionEventsTest.lifecycleEvents).toEqual([
        { type: ACTION_WILL_DISPATCH, args: [oneAction] },
        { type: ACTION_DID_DISPATCH, args: [oneAction] },
        { type: ACTION_WILL_DISPATCH, args: [otherAction] },
        { type: ACTION_DID_DISPATCH, args: [otherAction] },
        { type: ACTION_WILL_DISPATCH, args: [oneAction] },
        { type: ACTION_DID_DISPATCH, args: [oneAction] },
      ])
    })
  })

  describe('state change', () => {
    it('should call `stateWillChange`', () => {
      const stateChangeTest = new StateEventsTest()
      const store = createStore(stateChangeTest)
      Reduxable._setStore(store)

      stateChangeTest.reducers.increment()

      const expectedNewState = 1

      expect(stateChangeTest.lifecycleEvents).toEqual([{ type: STATE_WILL_CHANGE, args: [expectedNewState] }])
    })

    it('should call `stateWillChange` twice if reducer is called twice', () => {
      const stateChangeTest = new StateEventsTest()
      const store = createStore(stateChangeTest)
      Reduxable._setStore(store)

      stateChangeTest.reducers.increment()
      stateChangeTest.reducers.increment()

      expect(stateChangeTest.lifecycleEvents).toEqual([
        { type: STATE_WILL_CHANGE, args: [1] },
        { type: STATE_WILL_CHANGE, args: [2] },
      ])
    })

    it('should call `stateWillChange` with different state if state changes', () => {
      const stateChangeTest = new StateEventsTest()
      const store = createStore(stateChangeTest)
      Reduxable._setStore(store)

      stateChangeTest.reducers.increment()
      stateChangeTest.reducers.decrement()
      stateChangeTest.reducers.decrement()

      expect(stateChangeTest.lifecycleEvents).toEqual([
        { type: STATE_WILL_CHANGE, args: [1] },
        { type: STATE_WILL_CHANGE, args: [0] },
        { type: STATE_WILL_CHANGE, args: [-1] },
      ])
    })
  })
})
