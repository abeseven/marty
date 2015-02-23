var sinon = require('sinon');
var expect = require('chai').expect;
var UnknownStoreError = require('../../errors/unknownStore');

describe('Marty#rehydrate()', function () {
  var serverStores, browserStores, ServerMarty, BrowserMarty;
  var store1ExpectedState, store2ExpectedState, dehydratedState;

  beforeEach(function () {
    store2ExpectedState = { bar: 'bar' };
    store1ExpectedState = { initial: 'store1' };

    ServerMarty = require('../../index').createInstance();
    BrowserMarty = require('../../index').createInstance();

    serverStores = createStoresFor(ServerMarty);
    browserStores = createStoresFor(BrowserMarty);

    ServerMarty.replaceState({
      store1: store1ExpectedState,
      store2: store2ExpectedState
    });

    dehydratedState = ServerMarty.dehydrate();
  });

  afterEach(function () {
    window.__marty = null;
  });

  describe('when you pass in the state', function () {
    var Store1, Store2;

    beforeEach(function () {
      Store1 = BrowserMarty.createStore({
        id: 'test1'
      });

      Store2 = BrowserMarty.createStore({
        id: 'test2'
      });
    });

    describe('when you pass in state for an unknown store', function () {
      it('should throw an UnknownStoreError', function () {
        expect(function () {
          BrowserMarty.rehydrate({foo: {}});
        }).to.throw(UnknownStoreError);
      });
    });

    describe('when you pass in state for a known store', function () {
      var store1State, store2State;

      beforeEach(function () {
        store1State = { foo: 'bar' };
        store2State = { bar: 'baz' };

        BrowserMarty.rehydrate({
          test1: store1State,
          test2: store2State
        });
      });

      it('should set the state of the store', function () {
        expect(Store1.state).to.equal(store1State);
        expect(Store2.state).to.equal(store2State);
      });
    });
  });

  describe('when there is state on the window object', function () {
    beforeEach(function () {
      eval(dehydratedState.toString()); // jshint ignore:line
      BrowserMarty.rehydrate();
    });

    it('should set the stores initial state based on the serialized state', function () {
      expect(browserStores.store1.state).to.eql(store1ExpectedState);
      expect(browserStores.store2.state).to.eql(store2ExpectedState);
    });
  });

  describe('when there is only state for some stores', function () {
    beforeEach(function () {
      delete dehydratedState.store1;
      eval(dehydratedState.toString()); // jshint ignore:line
      BrowserMarty.rehydrate();
    });

    it('should only call `rehydrate` for stores it knows about', function () {
      expect(browserStores.store1.rehydrate).to.not.be.called;
      expect(browserStores.store2.rehydrate).to.be.calledWith(store2ExpectedState);
    });
  });

  function createStoresFor(Marty) {
    return {
      store1: Marty.createStore({
        id: 'store1',
        displayName: 'store1',
        getInitialState: function () {
          return {};
        },
        rehydrate: sinon.spy(function (state) {
          this.replaceState(state);
        })
      }),
      store2: Marty.createStore({
        id: 'store2',
        displayName: 'store2',
        getInitialState: function () {
          return {};
        },
        rehydrate: sinon.spy(function (state) {
          this.replaceState(state);
        })
      })
    };
  }
});