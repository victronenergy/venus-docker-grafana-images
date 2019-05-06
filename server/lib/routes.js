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

  app.get('/log', (req, res, next) => {
    res.json(app.logTransport.entries)
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
