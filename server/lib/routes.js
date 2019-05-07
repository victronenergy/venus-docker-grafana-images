const fs = require('fs')
const _ = require('lodash')

module.exports = function (app) {
  app.get('/config', (req, res, next) => {
    fs.readFile(app.config.configLocation, (err, contents) => {
      if (err) {
        app.logger.error(err)
        res.status(500).send('Unable to read config file')
      } else {
        const config = JSON.parse(contents)
        config.vrm.hasToken = !_.isUndefined(app.config.secrets.vrmToken)
        res.json(config)
      }
    })
  })

  app.put('/config', (req, res, next) => {
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

  app.post('/security', (req, res, next) => {
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

  app.get('/log', (req, res, next) => {
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

  app.put('/refreshVRM', (req, res, next) => {
    app.vrmDiscovered = []
    app.emit('serverevent', {
      type: 'VRMDISCOVERY',
      data: []
    })
    app.vrm.loadPortalIDs()
    res.status(200).send()
  })

  app.put('/debug', (req, res, next) => {
    app.rootLogger.level = req.body.value ? 'debug' : 'info'
    app.emit('serverevent', {
      type: 'DEBUG',
      data: req.body.value
    })
    res.send()
  })
}
