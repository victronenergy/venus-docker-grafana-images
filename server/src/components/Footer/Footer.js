import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

class Footer extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  render() {
    return (
      <footer className='app-footer'>
      </footer>
    )
  }
}

export default connect(({ loginStatus, serverSpecification, appStore }) => ({ loginStatus, serverSpecification, appStore }))(Footer)
