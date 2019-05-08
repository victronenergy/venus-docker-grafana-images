import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  InputGroup,
  InputGroupAddon,
  Input,
  Form,
  Col,
  Label,
  FormGroup,
  FormText,
  Table
} from 'reactstrap'

function fetchSettings () {
  fetch(`/admin-api/config`, {
    credentials: 'include'
  })
    .then(response => response.json())
    .then(data => {
      this.setState({ ...this.state, settings: data, hasData: true })
    })
}

class InfluxDB extends Component {
  constructor (props) {
    super(props)
    this.state = {
      hasData: false,
      type: 'influxdb',
      saving: false
    }

    this.fetchSettings = fetchSettings.bind(this)
    this.handleOptionChange = this.handleOptionChange.bind(this)
    this.handleSaveConfig = this.handleSaveConfig.bind(this)
  }

  componentDidMount () {
    this.fetchSettings()
  }

  handleOptionChange (event) {
    let value =
      event.target.type === 'checkbox'
        ? event.target.checked
          : event.target.value

    if ( event.target.name === 'port' ) {
      value = Number(value)
    }
    
    this.state.settings[this.state.type][event.target.name] = value
    this.setState({ settings: this.state.settings })
  }

  handleSaveConfig () {
    this.setState({saving: true})
    fetch(`/admin-api/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.settings),
      credentials: 'include'
    })
      .then(response => response.text())
      .then(response => {
        this.setState({saving: false})
        //alert(response)
      })
  }
  
  render () {
    const fieldColWidthMd = '3'

    return (
      this.state.hasData && (
        <div className='animated fadeIn'>
          <Card>
            <CardBody>
              <Form
                action=''
                method='post'
                encType='multipart/form-data'
                className='form-horizontal'
              >

              <FormGroup row>
                <Col md='2'>
                  <Label htmlFor='host'>Host</Label>
                </Col>
                <Col xs='12' md={fieldColWidthMd}>
                  <Input
                    size='20'
                    style={{ width: 'auto' }}
                    type='text'
                    name='host'
                    onChange={this.handleOptionChange}
                    value={this.state.settings.influxdb.host}
                  />
                </Col>
              </FormGroup>

              <FormGroup row>
                <Col md='2'>
                  <Label htmlFor='port'>Port</Label>
                </Col>
                <Col xs='12' md={fieldColWidthMd}>
                  <Input
                    size='20'
                    style={{ width: 'auto' }}
                    type='text'
                    name='port'
                    onChange={this.handleOptionChange}
                    value={this.state.settings.influxdb.port}
                  />
                </Col>
              </FormGroup>

              <FormGroup row>
                <Col md='2'>
                  <Label htmlFor='port'>Database Name</Label>
                </Col>
                <Col xs='12' md={fieldColWidthMd}>
                  <Input
                    size='20'
                    style={{ width: 'auto' }}
                    type='text'
                    name='database'
                    onChange={this.handleOptionChange}
                    value={this.state.settings.influxdb.database}
                  />
                </Col>
              </FormGroup>

              <FormGroup row>
                <Col md='2'>
                  <Label htmlFor='port'>Retention Period</Label>
                </Col>
                <Col xs='12' md={fieldColWidthMd}>
                  <Input
                    size='20'
                    style={{ width: 'auto' }}
                    type='text'
                    name='retention'
                    onChange={this.handleOptionChange}
                    value={this.state.settings.influxdb.retention}
                  />
                </Col>
              </FormGroup>
          
        </Form>
            </CardBody>
            <CardFooter>
              <Button
                size='sm'
                color='primary'
                onClick={this.handleSaveConfig}
              >
          <i className={this.state.saving
                        ? 'fa fa-spinner fa-spin'
                        : 'fa fa-dot-circle-o'}/> Save
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    )
  }
}

export default InfluxDB
