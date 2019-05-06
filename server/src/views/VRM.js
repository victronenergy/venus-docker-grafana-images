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

class VRM extends Component {
  constructor (props) {
    super(props)
    this.state = {
      hasData: false,
      type: 'vrm',
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
          <VRMDetails
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

class PasswordInput extends Component {
  render () {
    return (
      <FormGroup row>
        <Col md='2'>
          <Label htmlFor={this.props.name}>{this.props.title}</Label>
        </Col>
        <Col xs='12' md='3'>
          <Input
            type='password'
            name={this.props.name}
            value={this.props.value}
            onChange={event => this.props.onChange(event)}
          />
          {this.props.helpText && (
            <FormText color='muted'>{this.props.helpText}</FormText>
          )}
        </Col>
      </FormGroup>
    )
  }
}

class VRMList extends Component {
  handleRefresh() {
    fetch(`/refreshVRM`, {
      method: 'PUT',
      credentials: 'include'
    })
  }
  render() {
    return (
        <div>
         <Table hover responsive bordered striped size="sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Portal ID</th>
                <th>Enabled</th>
              </tr>
            </thead>
            <tbody>

            {this.props.discovered && this.props.discovered.map((device, index) => {
            return (
                <tr key={device.portalId}>
                <td>{device.name}</td>
                <td>{device.portalId}</td>
                <td>
                <Label className='switch switch-text switch-primary'>
                              <Input
                                type='checkbox'
                                id={device.portalId}
                                name='portalDisabled'
                                className='switch-input'
                                onChange={this.props.onChange}
              checked={!this.props.value.disabled || this.props.value.disabled.indexOf(device.portalId) == -1}
                              />
                              <span
                                className='switch-label'
                                data-on='On'
                                data-off='Off'
                              />
                              <span className='switch-handle' />
                            </Label>
                </td>
                </tr>
            )
            })
            }
            </tbody>
        </Table>
        <Button
      size='sm'
      color='primary'
      onClick={() => { this.handleRefresh() }}
        >
        <i className='fa fa-sync' /> Refresh
      </Button>
        </div>
    )
  }
}

class VRMDetails extends Component {
  constructor (props) {
    super(props)
    this.state = {
      hasToken: props.value.hasToken,
      username: '',
      password: '',
      tokenName: ''
    }
  }

  handleLogin(event) {
    this.setState({ loggingIn: true})
    fetch('/requestToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: this.state.username,
        password: this.state.password,
        tokenName: this.state.tokenName
      })
    })
      .then(response => {
        if ( response.status == 200 ) {
          return response
        } else {
          this.setState({ loggingIn: false })
          throw Error('bad response')
        }
      })
      .then(response => response.text())
      .then(response => {
        this.setState({ loggingIn: false, hasToken:true })
      })
      .catch(err => {
      })
    //this.setState({hasToken: true})
  }

  onChange(event) {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value
    this.setState({ [event.target.name]: value })
  }
  
  render() {
   return (
       <div>

     {!this.state.hasToken && (
       <div>
       <FormGroup row>
        <Col md='2'>
          <Label htmlFor='username'>VRM Username</Label>
        </Col>
        <Col xs='12' md='3'>
          <Input
            type='text'
            name='username'
            value={this.state.username}
            onChange={event => this.onChange(event)}
          />
        </Col>
        <Col xs='6' md='3'>
         <Button
              onClick={envent => this.handleLogin(event)}
              color='primary'
               className='px-4'
                    >
                            <i
                              className={
                                this.state.loggingIn
                                  ? 'fa fa-spinner fa-spin'
                                  : 'fa fa-lock'
                              }
                            />{' '}
                            Login
                          </Button>

        </Col>
       </FormGroup>
       
      <PasswordInput
        title='VRM Password '
        name='password'
        value={this.state.password}
        onChange={event => this.onChange(event)}
         />
         <FormGroup row>
        <Col md='2'>
         <Label htmlFor='tokenName'>Token Name</Label>
        </Col>
        <Col xs='12' md='3'>
          <Input
            type='text'
            name='tokenName'
            value={this.state.tokenName}
            onChange={event => this.onChange(event)}
          />
          <FormText color='muted'>Choose a token name that you have not used before</FormText>
        </Col>
      </FormGroup>
       </div>
       )}
      <FormGroup row>
        <Col md='2'>
          <Label>Status</Label>
        </Col>
       <Col xs='12' md='3'>
       <p className={this.props.vrmStatus && this.props.vrmStatus.status === 'success' ? "text-success" : "text-danger"}>
       {this.props.vrmStatus && this.props.vrmStatus.message}
       </p>
      </Col>
      </FormGroup>
      <VRMList
        value={this.props.value}
        discovered={this.props.vrmDiscovered}
        onChange={this.props.onChange}
      />
    </div>
   )
  }
}

export default connect(({vrmDiscovered, vrmStatus}) => ({vrmDiscovered, vrmStatus}))(VRM)
