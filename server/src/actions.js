const authFetch = (url, options) => {
  return fetch(url, {
    ...options,
    credentials: 'include'
  })
}

export function restart () {
  return dispatch => {
    if (confirm('Are you sure you want to restart?')) {
      fetch('/restart', {
        credentials: 'include',
        method: 'PUT'
      }).then(() => {
        dispatch({ type: 'SERVER_RESTART' })
      })
    }
  }
}

// Build actions that perform a basic authFetch to the backend. Pull #514.
export const buildFetchAction = (endpoint, type) => dispatch =>
  authFetch(endpoint)
    .then(response => response.json())
    .then(data =>
      dispatch({
        type,
        data
      })
    )

export function openServerEventsConnection (dispatch) {
  const proto = window.location.protocol == 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(
    proto +
      '://' +
      window.location.host +
      `/stream`
  )

  ws.onmessage = function (event) {
    const serverEvent = JSON.parse(event.data)
    if (serverEvent.type) {
      dispatch(serverEvent)
    }
  }
  ws.onclose = () => {
    console.log('closed')
    dispatch({
      type: 'WEBSOCKET_CLOSE'
    })
  }
  ws.onerror = error => {
    dispatch({
      type: 'WEBSOCKET_ERROR'
    })
  }
  ws.onopen = () => {
    console.log('connected')
    dispatch({
      type: 'WEBSOCKET_OPEN',
      data: ws
    })
  }
}
