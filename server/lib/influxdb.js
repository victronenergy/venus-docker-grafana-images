const Influx = require('influx')
const _ = require('lodash')
const debug = require('debug')('venus-server:influxdb')

function InfluxDB (app) {
  this.app = app
  this.logger = app.getLogger('influxdb')
  this.debug = this.logger.debug.bind(this.logger)
  this.info = this.logger.info.bind(this.logger)
  this.connected = false

  this.accumulatedPoints = []
  this.lastWriteTime = Date.now()
  this.batchWriteInterval =
    (_.isUndefined(app.config.settings.influxdb.batchWriteInterval)
      ? 10
      : app.config.settings.influxdb.batchWriteInterval) * 1000

  app.on('settingsChanged', settings => {
    this.batchWriteInterval =
      (_.isUndefined(app.config.settings.influxdb.batchWriteInterval)
        ? 10
        : app.config.settings.influxdb.batchWriteInterval) * 1000

    if (!this.connected) {
      return
    }

    const { host, port, database } = settings.influxdb

    if (
      this.host !== host ||
      this.port !== port ||
      this.database !== database
    ) {
      this.connected = false
      this.connect()
        .then(() => {})
        .catch(err => {
          this.logger.error(err)
          const interval = setInterval(() => {
            app.influxdb
              .connect()
              .then(() => {
                clearInterval(interval)
              })
              .catch(err => {
                this.logger.error(err)
              })
          }, 5000)
        })
    }
  })
}

InfluxDB.prototype.setRetentionPolicy = function (client, retention) {
  const opts = {
    duration: retention,
    replication: 1,
    isDefault: true
  }
  return new Promise((resolve, reject) => {
    client
      .createRetentionPolicy('venus_default', opts)
      .then(resolve)
      .catch(err => {
        client
          .alterRetentionPolicy('venus_default', opts)
          .then(resolve)
          .catch(reject)
      })
  })
}

InfluxDB.prototype.connect = function () {
  const { host, port, database, retention } = this.app.config.settings.influxdb
  this.host = host
  this.port = port
  this.database = database
  this.info(`Attempting connection to ${host}:${port}/${database}`)
  this.client = new Promise((resolve, reject) => {
    const client = new Influx.InfluxDB({
      host: host,
      port: port,
      protocol: 'http',
      database: database
    })

    this.connected = true

    client
      .getDatabaseNames()
      .then(names => {
        this.info('Connected')
        if (names.includes(database)) {
          this.setRetentionPolicy(client, retention)
            .then(() => {
              resolve(client)
            })
            .catch(reject)
        } else {
          client.createDatabase(database).then(result => {
            this.info('Created InfluxDb database ' + database)
            this.setRetentionPolicy(client, retention)
              .then(() => {
                resolve(client)
              })
              .catch(reject)
          })
        }
      })
      .catch(reject)
  })
  return this.client
}

InfluxDB.prototype.store = function (
  portalId,
  name,
  instanceNumber,
  measurement,
  value
) {
  if (this.connected === false || _.isUndefined(value) || value === null) {
    return
  }

  let valueKey = 'value'
  if (typeof value === 'string') {
    if (value.length === 0) {
      //influxdb won't allow empty strings
      return
    }
    valueKey = 'stringValue'
  } else if (typeof value !== 'number') {
    return
  }

  const point = {
    timestamp: new Date(),
    measurement: measurement,
    tags: {
      portalId: portalId,
      instanceNumber: instanceNumber,
      name: name || portalId
    },
    fields: {
      [valueKey]: value
    }
  }

  this.accumulatedPoints.push(point)
  const now = Date.now()
  if (
    this.batchWriteInterval === 0 ||
    now - this.lastWriteTime > this.batchWriteInterval
  ) {
    this.lastWriteTime = now

    this.client
      .then(client => {
        client.writePoints(this.accumulatedPoints).catch(err => {
          //this.app.emit('error', err)
          this.debug(err)
        })
        this.accumulatedPoints = []
      })
      .catch(error => {
        //this.app.emit('error', error)
        this.debug(error)
        this.accumulatedPoints = []
      })
  }
}

module.exports = InfluxDB
