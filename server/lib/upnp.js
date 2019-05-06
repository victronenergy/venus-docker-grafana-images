const Client = require('node-ssdp').Client
const fetch = require('node-fetch')
const parseXml = require('xml2js').parseString

module.exports = function (app) {
  const logger = app.getLogger('upnp')
  const client = new Client()
  let isRunning = false

  return {
    stop: () => {
      logger.info('Stopping UPNP Discovery')
      isRunning = false
      client.stop()
    },

    isRunning: () => {
      return isRunning
    },

    start: () => {
      client.on('response', function (headers, statusCode, rinfo) {
        if (
          headers.USN &&
          headers.USN.startsWith('uuid:com.victronenergy.ccgx')
        ) {
          fetch(headers.LOCATION)
            .then(response => response.text())
            .then(text => {
              parseXml(text, (err, result) => {
                if (err) {
                  logger.error(err)
                } else {
                  try {
                    const info = {
                      portalId: result.root.device[0]['ve:X_VrmPortalId'][0]._,
                      address: rinfo.address
                    }
                    logger.info(
                      'Found a venus device with id %s at %s',
                      info.portalId,
                      info.address
                    )
                    app.emit('upnpDiscovered', info)
                  } catch (err) {
                    logger.error(err)
                  }
                }
              })
            })
            .catch(err => {
              logger.error(err)
            })
        }
      })

      logger.info('Running UPNP Discovery...')
      isRunning = true
      client.search('urn:schemas-upnp-org:device:Basic:1')
    }
  }
}

if (require.main === module) {
  module.exports().start()
}
