import React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, CardHeader, Progress, Row, Col, Table } from 'reactstrap'
import '../../fa-pulse.css'

const Dashboard = props => {
  const {
    measurementRate,
    measurementCount,
    deviceStatistics,
  } = props.serverStatistics || {
    measurementRate: 0,
    measurementCount: 0,
    deviceStatistics: {},
  }
  return (
    <div className='animated fadeIn'>
      {props.websocketStatus === 'open' && (
        <div>
          <Card>
            <CardHeader>Stats</CardHeader>
            <CardBody>
              <Row>
                <Col xs='12' md='6'>
                  <div className='callout callout-primary'>
                    <small className='text-muted'>
                      Total Measurement Rate (measurements/second)
                    </small>
                    <br />
                    <strong className='h4'>{measurementRate.toFixed(1)}</strong>
                  </div>
                  <div className='callout callout-primary'>
                    <small className='text-muted'>
                      Total Number of Measurements
                    </small>
                    <br />
                    <strong className='h4'>{measurementCount}</strong>
                  </div>
                </Col>
                <Col xs='12' md='6'>
                  <div className='text-muted'>
                    Device activity (measurements/second)
                  </div>
                  <ul className='horizontal-bars type-2'>
                    {Object.keys(deviceStatistics || {}).map(portalId => {
                      const deviceStats = deviceStatistics[portalId]
                      const iconClass =
                        'icon-feed text-primary' +
                        (deviceStats.deltaRate > 50
                          ? ' fa-pulse-fast'
                         : deviceStats.deltaRate > 0 ? ' fa-pulse' : '')
                      return (
                        <li key={portalId}>
                          <i className={iconClass} />
                          <span className='title'>{portalId}</span>
                          <span className='value'>
                            {' '}
                            {deviceStats.measurementRate}{' '}
                            <span className='text-muted small'>
                              ({(
                                deviceStats.measurementRate /
                                measurementRate *
                                100
                              ).toFixed(0)}%)
                            </span>
                          </span>
                          <div className='bars'>
                            <Progress
                              className='progress-xs'
                              color='warning'
                              value={deviceStats.measurementRate / measurementRate * 100}
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </Col>
              </Row>
            </CardBody>
          </Card>

        </div>
      )}

      {props.websocketStatus === 'closed' && (
        <Card className='border-warning'>
          <CardHeader>Not connected to the server</CardHeader>
        </Card>
      )}
    </div>
  )
}

export default connect(({ serverStatistics, websocketStatus, providerStatus }) => ({
  serverStatistics,
  websocketStatus,
  providerStatus
}))(Dashboard)
