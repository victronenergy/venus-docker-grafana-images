import React, { Component } from 'react'
import { Switch, Route, Redirect, withRouter, History } from 'react-router-dom'
import { Container } from 'reactstrap'
import { connect } from 'react-redux'

import Header from '../../components/Header/'
import Sidebar from '../../components/Sidebar/'
import Breadcrumb from '../../components/Breadcrumb/'
import Aside from '../../components/Aside/'
import Footer from '../../components/Footer/'

import Dashboard from '../../views/Dashboard/'
import Discovery from '../../views/Discovery'
import VRM from '../../views/VRM'
import Manual from '../../views/Manual'
import Trouble from '../../views/Trouble'
import Security from '../../views/Security'
import InfluxDB from '../../views/InfluxDB'

import {
  fetchLoginStatus,
  openServerEventsConnection
} from '../../actions'

class Full extends Component {
  componentDidMount () {
    const { dispatch } = this.props
    openServerEventsConnection(dispatch)
  }

  render () {
    return (
      <div className='app'>
        <Header />
        <div className='app-body'>
          <Sidebar {...this.props} />
          <main className='main'>
            <Breadcrumb />
            <Container fluid>
              <Switch>
                <Route
                  path='/dashboard'
                  name='Dashboard'
                  component={loginOrOriginal(Dashboard, true)}
                  />
                <Route
                  path='/settings/discovery'
                  name='Discovery'
                  component={loginOrOriginal(Discovery, true)}
                />
                <Route
                  path='/settings/vrm'
                  name='VRM'
                  component={loginOrOriginal(VRM, true)}
                />
                <Route
                  path='/settings/manual'
                  name='Manual'
                  component={loginOrOriginal(Manual, true)}
                />
                <Route
                  path='/settings/influxdb'
                  name='InfluxDB'
                  component={loginOrOriginal(InfluxDB, true)}
                />
                <Route
                  path='/trouble'
                  name='Troubleshooting'
                  component={loginOrOriginal(Trouble, true)}
                />
                <Route
                  path='/settings/security'
                  name='Security'
                  component={loginOrOriginal(Security, true)}
                />
                <Redirect from='/' to='/dashboard' />
              </Switch>
            </Container>
          </main>
          <Aside />
        </div>
        <Footer />
      </div>
    )
  }
}

export default connect()(Full)

const loginOrOriginal = (BaseComponent, componentSupportsReadOnly) => {
  class Restricted extends Component {
    render () {
      if (loginRequired(this.props.loginStatus, componentSupportsReadOnly)) {
        return <Login />
      } else {
        return <BaseComponent {...this.props} />
      }
    }
  }
  return connect(({ loginStatus }) => ({ loginStatus }))(withRouter(Restricted))
}

function loginRequired (loginStatus, componentSupportsReadOnly) {
  // component works with read only access and
  // server loginStatus allows read only access
  if (componentSupportsReadOnly && loginStatus.readOnlyAccess) {
    return false
  }

  // require login when server requires authentication AND
  // user is not logged
  return (
    loginStatus.authenticationRequired && loginStatus.status === 'notLoggedIn'
  )
}
