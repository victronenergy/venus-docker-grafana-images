const _ = require('lodash')
const mqtt = require('mqtt')

const collectStatsInterval = 5
const vrmAddress = 'mqtt.victronenergy.com'
const keepAliveInterval = 59.0

function Loader (app) {
  this.app = app
  this.upnpConnections = {}
  this.manualConnections = {}
  this.vrmClient = null

  this.deviceStats = {}
  this.deviceMeasurements = {}
  this.totalCount = 0
  this.lastIntervalCount = 0
  this.vrmSubscriptions = []

  this.logger = app.getLogger('loader')
}

Loader.prototype.start = function () {
  this.logger.debug('starting...')
  this.app.emit('serverevent', {
    type: 'SERVERSTATISTICS'
  })

  this.app.on('upnpDiscovered', info => {
    const upnp = this.app.config.settings.upnp
    if (
      !this.upnpConnections[info.portalId] &&
      (_.isUndefined(upnp.disabled) ||
        upnp.disabled.indexOf(info.portalId) === -1)
    ) {
      this.connectUPNP(info)
    }
  })

  this.app.on('vrmDiscovered', devices => {
    if (this.app.config.settings.vrm.enabled) {
      this.connectVRM(devices)
    }
  })

  this.app.on('settingsChanged', this.settingsChanged.bind(this))

  this.collectInterval = setInterval(
    this.collectStats.bind(this),
    collectStatsInterval * 1000
  )
}

Loader.prototype.getPortalName = function (id) {
  if (this.app.config.settings.upnp.enabled) {
    const info = this.app.upnpDiscovered[id]
    if (info && info.name) {
      return info.name
    }
  }
  if (this.app.config.settings.vrm.enabled) {
    info = this.app.vrmDiscovered.find(info => info.portalId === id)
    if (info && info.name) {
      return info.name
    }
  }
}

Loader.prototype.sendKeepAlive = function (client, portalId) {
  this.logger.debug('sending keep alive for %s', portalId)
  client.publish(`R/${portalId}/system/0/Serial`)
}

Loader.prototype.keepAlive = function (client) {
  if (client === this.vrmClient) {
    this.vrmSubscriptions.forEach(id => this.sendKeepAlive(client, id))
  } else if (client.portalId) {
    this.sendKeepAlive(client, client.portalId)
  }
}

Loader.prototype.onMessage = function (client, topic, message) {
  //console.log(`${topic} : ${message}`)

  if (_.isUndefined(message) || message == null || message.length === 0) {
    return
  }

  const split = topic.split('/')
  const id = split[1]
  const instanceNumber = split[3]

  split.splice(0, 2)
  split.splice(1, 1)
  const measurement = split.join('/')

  try {
    const json = JSON.parse(message)

    //console.log(`${id} ${instanceNumber} ${measurement} ${json.value}`)

    if (client.venusNeedsID && measurement === 'system/Serial') {
      this.logger.info('Detected portalId %s', json.value)
      client.subscribe(`N/${json.value}/+/#`)
      client.publish(`R/${json.value}/system/0/Serial`)
      client.venusNeedsID = false
      client.portalId = json.value
      return
    }

    let portalStats
    let measurements
    this.totalCount++
    if (this.deviceStats[id]) {
      portalStats = this.deviceStats[id]
      measurements = this.deviceMeasurements[id]
    } else {
      portalStats = {
        measurementCount: 0,
        measurementRate: 0,
        lastIntervalCount: 0
      }
      this.deviceStats[id] = portalStats
      measurements = []
      this.deviceMeasurements[id] = measurements
    }

    portalStats.measurementCount++

    if (measurements.indexOf(measurement) === -1) {
      measurements.push(measurement)
    }

    const name = this.getPortalName(id)
    //this.logger.debug(`name: ${name}`)

    this.app.influxdb.store(id, name, instanceNumber, measurement, json.value)
  } catch (e) {
    this.app.emit('error', `can't record ${topic}: ${message}`)
    this.app.emit('error', e)
  }
}

Loader.prototype.close = function (connectionInfo) {
  this.logger.info(
    'closing connection to %s',
    connectionInfo.client.portalId || connectionInfo.address
  )
  connectionInfo.client.end(true)
}

Loader.prototype.settingsChanged = function (settings) {
  //close existing connections if upnp disabled or a device is disabled
  _.keys(this.upnpConnections).forEach(id => {
    if (!settings.upnp.enabled || settings.upnp.disabled.indexOf(id) !== -1) {
      this.close(this.upnpConnections[id])
      delete this.upnpConnections[id]
    }
  })

  // open connections for upnpn devices that were previously disabled
  if (settings.upnp.enabled) {
    _.keys(this.app.upnpDiscovered).forEach(id => {
      if (
        !this.upnpConnections[id] &&
        settings.upnp.disabled.indexOf(id) === -1
      ) {
        this.connectUPNP(this.app.upnpDiscovered[id])
      }
    })
  }

  if (settings.vrm.enabled) {
    this.connectVRM(this.app.vrmDiscovered)
  } else if (this.vrmClient) {
    this.logger.info('closing vrm connection')
    this.vrmClient.end(true)
    this.vrmClient = null
    this.vrmSubscriptions = []
    this.app.emit('vrmStatus', {
      status: 'success',
      message: 'Connection Closed'
    })
  }

  if (settings.manual.enabled) {
    settings.manual.hosts.forEach(host => {
      if (host.enabled) {
        if (!this.manualConnections[host.hostName]) {
          this.connectManual({ address: host.hostName })
        }
      } else if (this.manualConnections[host.hostName]) {
        this.close(this.manualConnections[host.hostName])
        delete this.manualConnections[host.hostName]
      }
    })
    _.keys(this.manualConnections).forEach(ip => {
      if (!settings.manual.hosts.find(host => host.hostName === ip)) {
        this.close(this.manualConnections[ip])
        delete this.manualConnections[ip]
      }
    })
  } else {
    _.keys(this.manualConnections).forEach(ip => {
      this.close(this.manualConnections[ip])
    })
    this.manualConnections = {}
  }
}

Loader.prototype.connectUPNP = function (info) {
  const client = this.connect(info.address, 1883, [info])
  this.upnpConnections[info.portalId] = {
    client: client,
    name: info.name,
    address: info.address
  }
  return client
}

Loader.prototype.connectManual = function (info) {
  const client = this.connect(info.address, 1883, [info])
  this.manualConnections[info.address] = {
    client: client,
    name: info.name,
    address: info.address
  }
  return client
}

Loader.prototype.connectVRM = function (portalInfos) {
  const address = this.app.config.settings.vrm.address || vrmAddress
  const port = this.app.config.settings.vrm.port || 8883
  const enabled = portalInfos.filter(info => {
    return this.app.config.settings.vrm.disabled.indexOf(info.portalId) === -1
  })
  return this.connect(address, port, enabled, true)
}

Loader.prototype.connect = function (address, port, portalInfos, isVrm = false) {
  let client
  if (isVrm) {
    if (!this.vrmClient) {
      this.logger.info('connecting to %s:%d', address, port)
      client = mqtt.connect(`mqtts:${address}:${port}`, {
        rejectUnauthorized: false,
        username: 'scott@scottbender.net',
        password: 'Pcgr8aPcBsHMzQ'
      })
      this.vrmClient = client
      /*
      client = mqtt.connect(`wss://mqtt.victronenergy.com/mqtt:443`, {
        rejectUnauthorized: false,
        wsOptions: {
          headers: { 'X-Authorization': `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImEzY2MxYzUxNDFkZWJhZWJiYmNhODM4ZjExMDQwZWQzIn0.eyJpc3MiOiJ2cm1hcGkudmljdHJvbmVuZXJneS5jb20iLCJhdWQiOiJodHRwczpcL1wvdnJtYXBpLnZpY3Ryb25lbmVyZ3kuY29tXC8iLCJpYXQiOjE1NTM5NjgyMTcsImV4cCI6MTU2OTUyMDIxNywianRpIjoiYTNjYzFjNTE0MWRlYmFlYmJiY2E4MzhmMTEwNDBlZDMiLCJ1aWQiOiIxODgxNCIsInRva2VuX3R5cGUiOiJyZW1lbWJlcl9tZSJ9.J1zqdsIAISp4rq6m36YuUWajaCWKyN1lKzCabFeJaXwcjejH33TaTxQUFmsFLYSK_9zXbcjpjyfulDmjkMvr7F_js1w0JTh_Dy5MmILYMAQeGvJz13LyQXLbcWgMeUG6-axUrOCbcA0EmaoFLWal_RO5OhYu7Np6CweQ-k_cjxz5sP7sBO4jfTz-At16GIZStMDj3ffvPqyme7wz4WDaIF034w-OdGlbwlnLzeK7wFqa5hmfRtxOJx04LWYtHmDj2lWZ8-t4qP-I8_h1Y9HkTnoLugJlHgt6-Y0kmsPc4pUSeCPAGRtfrMXku64-eHtubyV6VjFJDR7nt3V4z4LfjQ` }
        }
      })
      */
    } else {
      const remaining = []
      this.vrmSubscriptions.forEach(id => {
        if (
          !portalInfos.find(info => {
            return info.portalId === id
          })
        ) {
          this.logger.info('UnSubscribing to portalId %s', id)
          this.vrmClient.unsubscribe(`N/${id}/+/#`)
        } else {
          remaining.push(id)
        }
      })
      this.vrmSubscriptions = remaining
      portalInfos.forEach(info => {
        if (this.vrmSubscriptions.indexOf(info.portalId) === -1) {
          this.logger.info('Subscribing to portalId %s', info.portalId)
          this.vrmClient.subscribe(`N/${info.portalId}/+/#`)
          this.vrmClient.publish(`R/${info.portalId}/system/0/Serial`)
          this.vrmSubscriptions.push(info.portalId)
        }
      })
      return this.vrmClient
    }
  } else {
    this.logger.info('connecting to %s:%d', address, port)
    client = mqtt.connect(`mqtt:${address}:${port}`)
  }

  client.on('connect', () => {
    this.logger.info('connected to %s', address)
    if (portalInfos.length === 1 && !portalInfos[0].portalId) {
      this.logger.info('Detecting portalId...')
      client.subscribe('N/+/+/#')
      client.venusNeedsID = true
    } else {
      portalInfos.forEach(info => {
        this.logger.info('Subscribing to portalId %s', info.portalId)
        client.subscribe(`N/${info.portalId}/+/#`)
        client.publish(`R/${info.portalId}/system/0/Serial`)
        if (isVrm) {
          this.vrmSubscriptions.push(info.portalId)
        } else {
          client.portalId = info.portalId
        }
      })
    }
    client.keepAlive = setInterval(
      this.keepAlive.bind(this, client),
      keepAliveInterval * 1000
    )
  })

  client.on('message', (topic, message) =>
    this.onMessage(client, topic, message)
  )

  client.on('error', error => {
    this.app.emit('error', error)
  })

  client.on('close', () => {
    this.logger.debug('connection to %s closed', address)
  })
  client.on('offline', () => {
    this.logger.debug('connection to %s offline', address)
  })
  client.on('end', () => {
    this.logger.info('connection to %s ended', address)
    if (client.keepAlive) {
      clearInterval(client.keepAlive)
      delete client.keepAlive
    }
  })
  client.on('reconnect', () => {
    this.logger.debug('connection to %s reconnect', address)
  })

  return client
}

Loader.prototype.collectStats = function () {
  //this.logger.debug('collecting stats...')

  let measurementCount = 0
  _.keys(this.deviceStats).forEach(id => {
    const stats = this.deviceStats[id]
    stats.measurementRate =
      (stats.measurementCount - stats.lastIntervalCount) / collectStatsInterval
    stats.lastIntervalCount = stats.measurementCount
    measurementCount += this.deviceMeasurements[id].length
  })

  const stats = {
    measurementRate:
      (this.totalCount - this.lastIntervalCount) / collectStatsInterval,
    measurementCount: measurementCount,
    deviceStatistics: this.deviceStats
  }

  this.lastIntervalCount = this.totalCount

  this.app.emit('serverevent', {
    type: 'SERVERSTATISTICS',
    data: stats
  })
}

module.exports = Loader
