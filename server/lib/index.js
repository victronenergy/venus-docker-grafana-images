const express = require('express')
const path = require('path')
const http = require('http')
const _ = require('lodash')
const fs = require('fs')
const Loader = require('./loader')
const InfluxDB = require('./influxdb')
const winston = require('winston')
const LogStorageTransport = require('./transport')

const logMessages = []

function Server (opts) {
  process.on('SIGINT', function () {
    process.exit()
  })

  const bodyParser = require('body-parser')
  const app = express()
  this.app = app

  app.__argv = process.argv.slice(2)
  app.argv = require('minimist')(app.__argv)

  const format = winston.format.printf((info, oppts) => {
    return `[${info.level}] [${info.label}] ${info.message} ${info.stack || ''}`
  })

  app.logTransport = new LogStorageTransport(app, {
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.timestamp(),
      winston.format.json()
    )
  })

  app.rootLogger = winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.errors({ stack: true }),
          winston.format.splat(),
          format
        )
      }),
      this.app.logTransport
    ]
  })

  this.app.logger = this.app.rootLogger.child({ label: 'venus-server' })
  this.app.getLogger = label => {
    return this.app.rootLogger.child({ label: label })
  }
  this.app.debug = this.app.logger.debug.bind(this.app.logger)
  this.app.info = this.app.logger.info.bind(this.app.logger)

  app.use(bodyParser.json())

  app.use('/admin', express.static(__dirname + '/../public'))

  app.get('/', (req, res) => {
    res.redirect('/admin')
  })

  let configDir = app.argv.c

  if (!configDir) {
    configDir = '/config'
  }

  app.config = {
    configLocation: path.join(configDir, 'config.json'),
    secretsLocation: path.join(configDir, 'secrets.json')
  }

  try {
    const contents = fs.readFileSync(app.config.configLocation)
    app.config.settings = JSON.parse(contents)
  } catch (err) {
    app.config.settings = {
      upnp: {
        enabled: false,
        disabled: []
      },
      vrm: {
        enabled: false,
        disabled: []
      },
      manual: {
        enabled: false,
        hosts: []
      },
      influxdb: {
        host: 'influxdb',
        port: 8086,
        database: 'venus',
        retention: '30d'
      }
    }

    fs.writeFileSync(
      app.config.configLocation,
      JSON.stringify(app.config.settings, null, 2)
    )
  }

  if (app.config.settings.debug) {
    app.rootLogger.level = 'debug'
  }

  try {
    const contents = fs.readFileSync(app.config.secretsLocation)
    app.config.secrets = JSON.parse(contents)
  } catch (err) {
    app.config.secrets = {}
  }

  app.debug('Settings %j', app.config.settings)

  app.started = false
  _.merge(app, opts)
}

module.exports = Server

Server.prototype.start = function () {
  const self = this
  const app = this.app

  app.lastServerEvents = {}
  app.on('serverevent', event => {
    if (event.type) {
      app.lastServerEvents[event.type] = event
    }
  })
  app.upnpDiscovered = {}
  app.emit('serverevent', {
    type: 'UPNPDISCOVERY',
    data: []
  })
  app.on('upnpDiscovered', info => {
    if (_.isUndefined(app.upnpDiscovered[info.portalId])) {
      app.upnpDiscovered[info.portalId] = info
      app.emit('upnpDiscoveredChanged', app.upnpDiscovered)
      app.info('Found new UPNP device %j', info)

      app.emit('serverevent', {
        type: 'UPNPDISCOVERY',
        data: _.keys(app.upnpDiscovered)
      })
    }
  })

  app.vrmDiscovered = []
  app.emit('serverevent', {
    type: 'VRMDISCOVERY',
    data: []
  })
  app.on('vrmDiscovered', devices => {
    app.vrmDiscovered = devices
    app.emit('vrmDiscoveredChanged', app.vrmDiscovered)
    app.debug('Found vrm devices %j', devices)

    app.emit('serverevent', {
      type: 'VRMDISCOVERY',
      data: devices
    })
  })

  app.emit('serverevent', {
    type: 'DEBUG',
    data: app.logger.level === 'debug'
  })

  app.on('vrmStatus', status => {
    app.emit('serverevent', {
      type: 'VRMSTATUS',
      data: status
    })
  })

  app.upnp = require('./upnp')(this.app)
  app.vrm = require('./vrm')(this.app)
  app.loader = new Loader(app)
  app.influxdb = new InfluxDB(app)
  app.influxdb
    .connect()
    .then(() => {
      app.loader.start()
      app.emit('settingsChanged', app.config.settings)
    })
    .catch(err => {
      app.logger.error(err)
      const interval = setInterval(() => {
        app.influxdb
          .connect()
          .then(() => {
            clearInterval(interval)
            app.loader.start()
            app.emit('settingsChanged', app.config.settings)
          })
          .catch(err => {
            app.logger.error(err)
          })
      }, 5000)
    })

  function settingsChanged (settings) {
    if (settings.upnp.enabled && app.upnp.isRunning() === false) {
      if (!app.argv['external-upnp']) {
        app.upnp.start()
      }
    }
    if (!settings.upnp.enabled && app.upnp.isRunning()) {
      if (!app.argv['external-upnp']) {
        app.upnp.stop()
      }
    }

    if (settings.vrm.enabled && _.keys(app.vrmDiscovered).length === 0) {
      /*
      app.vrmDiscovered = []
      app.emit('serverevent', {
        type: 'VRMDISCOVERY',
        data: []
      })
      */
      app.vrm.loadPortalIDs()
    }
    if (!settings.vrm.enabled && _.keys(app.vrmDiscovered).length > 0) {
      /*
      app.vrmDiscovered = []
      app.emit('serverevent', {
        type: 'VRMDISCOVERY',
        data: []
      })
      */
    }

    app.emit('serverevent', {
      type: 'SETTINGSCHANGED',
      data: settings
    })
  }

  app.on('settingsChanged', settingsChanged)
  app.emit('settingsChanged', app.config.settings)

  return new Promise((resolve, reject) => {
    createServer(app, function (err, server) {
      if (err) {
        reject(err)
        return
      }
      app.server = server

      app.websocket = require('./websocket')(app)
      app.websocket.start()

      require('./routes')(app)

      const primaryPort = 8088
      server.listen(primaryPort, function () {
        app.logger.info(`running at 0.0.0.0:${primaryPort}`)
        app.started = true
        resolve(self)
      })
    })
  })
}

function createServer (app, cb) {
  let server
  try {
    server = http.createServer(app)
  } catch (e) {
    cb(e)
    return
  }
  cb(null, server)
}

Server.prototype.stop = function (cb) {
  return new Promise((resolve, reject) => {
    if (!this.app.started) {
      resolve(this)
    } else {
      try {
        this.app.debug('Closing server...')

        const that = this
        this.app.server.close(function () {
          that.app.debug('Server closed')
          that.app.started = false
          cb && cb()
          resolve(that)
        })
      } catch (err) {
        reject(err)
      }
    }
  })
}
