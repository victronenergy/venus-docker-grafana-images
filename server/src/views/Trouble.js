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

function fetchLog () {
  fetch(`/admin-api/log`, {
    credentials: 'include'
  })
    .then(response => response.json())
    .then(data => {
      this.setState({ ...this.state, entries: data , hasData: true })
    })
}

class Trouble extends Component {
  constructor (props) {
    super(props)
    this.state = {
      hasData: true
    }

    this.fetchLog = fetchLog.bind(this)
    this.handleDebug = this.handleDebug.bind(this)
  }

  componentDidMount () {
    //this.fetchLog()
  }

  handleDebug (event) {
    fetch(`/admin-api/debug`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value: event.target.checked }),
      credentials: 'include'
    })
      .then(response => response.text())
      .then(response => {
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
            <Label htmlFor='select'>Debug</Label>
          </Col>
          <Col xs='6' md='3'>
          <Label className='switch switch-text switch-primary'>
                              <Input
                                type='checkbox'
                                id="Enabled"
                                name='debug'
                                className='switch-input'
                                onChange={this.handleDebug}
                                checked={this.props.debug}
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

          <LogList value={this.props.log} />
              </Form>
            </CardBody>
            <CardFooter>
            </CardFooter>
          </Card>
        </div>
      )
    )
  }
}

class LogList extends Component {
  render() {
    return (
      <Table hover responsive bordered striped size="sm">
            <thead>
                <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Label</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>

      {this.props.value.entries && this.props.value.entries.map((log, index) => {
        let levelClass
        if ( log.level === 'error' ) {
          levelClass = 'text-danger'
        } else if ( log.level === 'info' ) {
          levelClass = 'text-info'
        } else if ( log.level === 'warn' ) {
          levelClass = 'text-warning'
        } else {
          levelClass = 'text-success'
        }

            return (
                <tr key={index}>
                <td>{log.timestamp}</td>
                <td>
                <p className={levelClass}>{log.level}</p>
                </td>
                <td>{log.label}</td>
                <td>{log.message}</td>
                </tr>
            )
            })
            }
      
            </tbody>
          </Table>
    )
  }
}

export default connect(({log, debug}) => ({log, debug}))(Trouble)
