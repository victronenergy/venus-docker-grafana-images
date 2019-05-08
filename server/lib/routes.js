const fs = require('fs')
const _ = require('lodash')

module.exports = function (app) {
  app.get('/admin-api/config', (req, res, next) => {
    fs.readFile(app.config.configLocation, (err, contents) => {
      if (err) {
        app.logger.error(err)
        res.status(500).send('Unable to read config file')
      } else {
        const config = JSON.parse(contents)
        if (_.isUndefined(config.upnp.enabledPortalIds)) {
          config.upnp.enabledPortalIds = []
        }
        if (_.isUndefined(config.vrm.enabledPortalIds)) {
          config.vrm.enabledPortalIds = []
        }
        config.vrm.hasToken = !_.isUndefined(app.config.secrets.vrmToken)
        res.json(config)
      }
    })
  })

  app.put('/admin-api/config', (req, res, next) => {
    fs.writeFile(
      app.config.configLocation,
      JSON.stringify(req.body, null, 2),
      err => {
        if (err) {
          app.logger.error(err)
          res.status(500).send('Unable to write config file')
        } else {
          res.status(200).send('Configuration Saved')
          app.config.settings = req.body
          app.emit('settingsChanged', app.config.settings)
          delete req.body.vrm.hasToken
        }
      }
    )
  })

  app.post('/admin-api/security', (req, res, next) => {
    if (
      req.body.username &&
      req.body.username.length > 0 &&
      req.body.password &&
      req.body.password.length > 0
    ) {
      app.config.secrets.login = req.body
      fs.writeFile(
        app.config.secretsLocation,
        JSON.stringify(app.config.secrets, null, 2),
        err => {
          if (err) {
            app.logger.error(err)
            res.status(500).send('Unable to write secrets file')
          } else {
            res.send()
          }
        }
      )
    } else {
      res.status(400).send('Please enter a Username and Password')
    }
  })

  app.get('/admin-api/log', (req, res, next) => {
    res.json(app.logTransport.entries)
  })

  const upnpLog = app.getLogger('upnp')
  app.post('/log', (req, res, next) => {
    upnpLog[req.body.level](req.body.message)
    res.send()
  })

  app.post('/upnpDiscovered', (req, res, next) => {
    app.emit('upnpDiscovered', req.body)
    res.send()
  })

  app.put('/admin-api/refreshVRM', (req, res, next) => {
    app.vrmDiscovered = []
    app.emit('serverevent', {
      type: 'VRMDISCOVERY',
      data: []
    })
    app.vrm.loadPortalIDs()
    res.status(200).send()
  })

  app.put('/admin-api/debug', (req, res, next) => {
    app.rootLogger.level = req.body.value ? 'debug' : 'info'
    app.emit('serverevent', {
      type: 'DEBUG',
      data: req.body.value
    })
    res.send()
  })

  app.get('/grafana-api', (req, res, next) => {
    res.send('ok')
  })

  app.post('/grafana-api/search', (req, res, next) => {
    res.json(['portals'])
  })

  app.post('/grafana-api/query', (req, res, next) => {
    const request = req.body

    if (app.lastStats && request.targets) {
      if (request.targets.length > 0 && request.targets[0].type === 'table') {
        if (request.targets[0].target === 'portals') {
          const json = {
            columns: [
              { text: 'Name', type: 'string' },
              { text: 'Last Measurement', type: 'string' }
            ],
            type: 'table'
          }

          json.rows = _.values(app.lastStats.deviceStatistics).map(stats => {
            return [stats.name, stats.lastMeasurement.toString()]
          })
          res.json([json])
          return
        }
      }
    }
    res.json([])
  })
}
