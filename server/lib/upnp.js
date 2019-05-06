const Client = require('node-ssdp').Client
const fetch = require('node-fetch')
const parseXml = require('xml2js').parseString
const util = require('util')

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
  let cachedLogs = []
  let cachedDiscovery = []

  process.on('SIGINT', function () {
    process.exit()
  })

  function postLog (info) {
    return new Promise((resolve, reject) => {
      fetch('http://localhost:8088/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(info)
      })
        .then(response => response.text())
        .then(resolve)
        .catch(err => {
          console.log(err)
          cachedLogs.push(info)
          reject(err)
        })
    })
  }

  function postDiscovery (info) {
    fetch('http://localhost:8088/upnpDiscovered', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(info)
    })
      .then(response => response.text())
      .catch(err => {
        console.log(err)
        cachedDiscovery.push(info)
      })
  }

  module
    .exports({
      getLogger: mame => {
        return {
          info: (...args) => {
            const msg = util.format(...args)
            console.log(msg)
            postLog({ level: 'info', message: msg })
              .then(() => {})
              .catch(() => {})
          },
          error: err => {
            console.error(err)
            postLog({ level: 'error', message: err.toString() })
              .then(() => {})
              .catch(() => {})
          }
        }
      },
      emit: (event, data) => {
        postDiscovery(data)
      }
    })
    .start()

  setInterval(() => {
    const logs = cachedLogs
    const discovered = cachedDiscovery

    cachedLogs = []
    cachedDiscovery = []

    logs.forEach(log => {
      postLog(log)
        .then(() => {})
        .catch(err => {
          console.log(err)
        })
    })
    discovered.forEach(info => {
      postDiscovery(info)
    })
  }, 5000)
}
