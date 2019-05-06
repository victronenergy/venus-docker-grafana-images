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
  fetch(`/config`, {
    credentials: 'include'
  })
    .then(response => response.json())
    .then(data => {
      this.setState({ ...this.state, settings: data, hasData: true })
    })
}

class Manual extends Component {
  constructor (props) {
    super(props)
    this.state = {
      hasData: false,
      type: 'manual',
      saving: false
    }

    this.fetchSettings = fetchSettings.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleOptionChange = this.handleOptionChange.bind(this)
    this.handleSaveConfig = this.handleSaveConfig.bind(this)
  }

  componentDidMount () {
    this.fetchSettings()
  }

  handleChange (event) {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value
    this.setState({ [event.target.name]: value })
  }

  handleOptionChange (event) {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
          : event.target.value

    if ( event.target.name === 'portalDisabled' ) {
      let list = this.state.settings[this.state.type].disabled
      if ( !list ) {
        list = []
        this.state.settings[this.state.type].disabled = list
      }
      if ( value ) {
        let idx = list.indexOf(event.target.id)
        if ( idx != -1 ) {
          list.splice(idx, 1)
        }
      } else {
        list.push(event.target.id)
      }
    } else {
      this.state.settings[this.state.type][event.target.name] = value
    }
    this.setState({ settings: this.state.settings })
  }

  handleSaveConfig () {
    this.setState({saving: true})
    fetch(`/config`, {
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
          <Col xs='3' md='2'>
            <Label htmlFor='select'>Enabled</Label>
          </Col>
          <Col xs='6' md='3'>
          <Label className='switch switch-text switch-primary'>
                              <Input
                                type='checkbox'
                                id="Enabled"
                                name='enabled'
                                className='switch-input'
                                onChange={this.handleOptionChange}
                                checked={this.state.settings[this.state.type].enabled}
                              />
                              <span
                                className='switch-label'
                                data-on='On'
                                data-off='Off'
                              />
                              <span className='switch-handle' />
                            </Label>
          </Col>
          </FormGroup>
          <ManualDetails
            value={this.state.settings[this.state.type]}
            onChange={this.handleOptionChange}
          />
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

class ManualDetails extends Component {
  constructor (props) {
    super(props)
    this.state = {
      hosts: this.props.value.hosts
    }
  }
  
  enabledClicked (event, host, index) {
    this.props.value.hosts[index].enabled = event.target.checked
    this.setState({hosts: this.props.value.hosts})
  }

  onChange(event, index) {
    this.props.value.hosts[index].hostName = event.target.value
    this.setState({hosts: this.props.value.hosts})
  }

  handleDelete(event, index) {
    this.props.value.hosts.splice(index, 1)
    this.setState({hosts: this.props.value.hosts})
  }

  handleAdd(event) {
    this.props.value.hosts.push({ hostName: '', enabled: true})
    this.setState({hosts: this.props.value.hosts})
  }
  
  render() {
    return (
      <div>
      <Table hover responsive bordered striped size='sm'>
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Enabled</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(this.state.hosts || []).map((host, index) => {
                  return (
                    <tr key={index} >
                      <td>
                      <Input
                    type='text'
                    name="Hello"
                    value={host.hostName}
                    onChange={event => this.onChange(event, index)}
                      />
                      </td>
                      <td>
                      <Label className='switch switch-text switch-primary'>
                              <Input
                                type='checkbox'
                                id="Enabled"
                                name='enabled'
                                className='switch-input'
                    onChange={ event => this.enabledClicked(event, host, index) }
                               checked={host.enabled}
                              />
                              <span
                                className='switch-label'
                                data-on='On'
                                data-off='Off'
                              />
                              <span className='switch-handle' />
                            </Label>
                      </td>
                      <td>
                      <Button
                        size='sm'
                        color='danger'
                        onClick={event => this.handleDelete(event, index)}
                        >
                        <i className='fa fa-ban' /> Delete
                       </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
        <Button size='sm' color='primary' onClick={event => this.handleAdd(event)}>
              <i className='fa fa-plus-circle' /> Add
            </Button>
    </div>
    )
  }
}

export default Manual
