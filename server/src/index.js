import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Route, Switch } from 'react-router-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

// Styles
// Import Font Awesome Icons Set
import 'font-awesome/css/font-awesome.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
// Import Simple Line Icons Set
import 'simple-line-icons/css/simple-line-icons.css'
// Import Main styles for this application
import '../scss/style.scss'
// Temp fix for reactstrap
import '../scss/core/_dropdown-menu-right.scss'

// Containers
import Full from './containers/Full/'

import { openServerEventsConnection } from './actions'

const state = {
  loginStatus: {},
  websocketStatus: 'initial',
  webSocket: null,
  debug: false,
  log: {
    entries: []
  }
}

let store = createStore(
  (state, action) => {
    let newState = {}
    if (action.type === 'SERVERSTATISTICS') {
      return {
        ...state,
        serverStatistics: action.data
      }
    }
    if (action.type === 'UPNPDISCOVERY') {
      return {
        ...state,
        upnpDiscovered: action.data
      }
    }
    if (action.type === 'VRMDISCOVERY') {
      return {
        ...state,
        vrmDiscovered: action.data
      }
    }
    if (action.type === 'VRMSTATUS') {
      return {
        ...state,
        vrmStatus: action.data
      }
    }
    if (action.type === 'SETTINGSCHANGED') {
      return {
        ...state,
        settings: action.data
      }
    }
    if (action.type === 'DEBUG') {
      return {
        ...state,
        debug: action.data
      }
    }
    if (action.type === 'LOG') {
      state.log.entries.push(action.data)
      return {
        ...state,
        log: {
          entries: state.log.entries
        }
      }
    }
    if (action.type === 'WEBSOCKET_CONNECTED') {
      return {
        ...state,
        websocketStatus: 'connected'
      }
    }
    if (action.type === 'WEBSOCKET_OPEN') {
      if (state.webSocketTimer) {
        clearInterval(state.webSocketTimer)
        delete state.webSocketTimer
      }
      if (state.restarting) {
        state.restarting = false
      }
      return {
        ...state,
        websocketStatus: 'open',
        webSocket: action.data
      }
    }
    if (action.type === 'WEBSOCKET_ERROR') {
      return {
        ...state,
        websocketStatus: 'error'
      }
    }
    if (action.type === 'WEBSOCKET_CLOSE') {
      if (!state.webSocketTimer) {
        state.webSocketTimer = setInterval(() => {
          console.log(`retry...`)
          openServerEventsConnection(store.dispatch)
        }, 5 * 1000)
      }
      return {
        ...state,
        websocketStatus: 'closed',
        webSocket: null
      }
    }
    return state
  },
  state,
  applyMiddleware(thunk)
)

function nameCollator (left, right) {
  if (left.name < right.name) {
    return -1
  } else if (left.name > right.name) {
    return 1
  } else {
    return 0
  }
}

ReactDOM.render(
  <HashRouter>
    <Switch>
      <Provider store={store}>
        <Route path='/' name='Home' component={Full} />
      </Provider>
    </Switch>
  </HashRouter>,
  document.getElementById('root')
)
