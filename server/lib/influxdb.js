const Influx = require('influx')
const _ = require('lodash')
const debug = require('debug')('venus-server:influxdb')

function InfluxDB (app) {
  this.app = app
  this.logger = app.getLogger('influxdb')
  this.debug = this.logger.debug.bind(this.logger)
  this.info = this.logger.info.bind(this.logger)
  this.connected = false

  app.on('settingsChanged', settings => {
    if (!this.connected) {
      return
    }

    const { host, port, database } = settings.influxdb
    if (this.host != host || this.port != port || this.database != database) {
      this.connected = false
      this.connect()
        .then(() => {})
        .catch(err => {
          app.emit('error', err)
          const interval = setInterval(() => {
            app.influxdb
              .connect()
              .then(() => {
                clearInterval(interval)
              })
              .catch(err => {
                app.emit('error', err)
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
            this.setRetentionPolicy(this.client, retention)
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
  if (this.connected == false || _.isUndefined(value) || value === null) {
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

  const body = [
    {
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
  ]

  this.client
    .then(client => {
      client.writePoints(body).catch(err => {
        //this.app.emit('error', err)
        this.debug(err)
      })
    })
    .catch(error => {
      //this.app.emit('error', error)
      this.debug(error)
    })
}

module.exports = InfluxDB
