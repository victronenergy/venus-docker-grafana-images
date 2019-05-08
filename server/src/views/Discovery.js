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

class Discovery extends Component {
  constructor (props) {
    super(props)
    this.state = {
      hasData: false,
      type: 'upnp',
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
      let list = this.state.settings[this.state.type].enabledPortalIds
      if ( !value ) {
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

          <DiscoveredList
            value={this.state.settings[this.state.type]}
            discovered={this.props.upnpDiscovered}
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

class DiscoveredList extends Component {
  handleEnableAll(event) {
    if ( event.target.checked ) {
      this.props.value.enabledPortalIds = this.props.discovered
    } else {
      this.props.value.enabledPortalIds = []
    }
    this.setState({...this.state})
  }
  
  render() {
    return (
      <Table hover responsive bordered striped size="sm">
            <thead>
                <tr>
                <th>Portal ID</th>
                <th>
                  <Label className='switch switch-text switch-primary'>
                   <Input type='checkbox'
                          id='enableAll'
                          name='enabledAll'
                          className='switch-input'
                          checked={this.props.value.enabledPortalIds.length > 0}

                          onChange={(event) => { this.handleEnableAll(event)}}
                   />
                   <span className='switch-label'
                         data-on='On'
                         data-off='Off'
                   />
                   <span className='switch-handle' />
                 </Label>
                </th>
              </tr>
            </thead>
            <tbody>

            {this.props.discovered && this.props.discovered.map((id, index) => {
            return (
                <tr key={id}>
                <td>{id}</td>
                <td>
                <Label className='switch switch-text switch-primary'>
                              <Input
                                type='checkbox'
                                id={id}
                                name='portalDisabled'
                                className='switch-input'
                                onChange={this.props.onChange}
              checked={this.props.value.enabledPortalIds.indexOf(id) !== -1}
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
    )
  }
}

export default connect(({upnpDiscovered}) => ({upnpDiscovered}))(Discovery)
