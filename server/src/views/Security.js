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

class Security extends Component {
  constructor (props) {
    super(props)
    this.state = {
      saving: false,
      username: '',
      password: '',
      hasData: true
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleSaveConfig = this.handleSaveConfig.bind(this)
  }

  componentDidMount () {
  }

  handleChange (event) {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value
    this.setState({ [event.target.name]: value })
  }

  handleSaveConfig () {
    this.setState({saving: true})
    fetch(`/security`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username: this.state.username,
                            password: this.state.password}),
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
            <Label htmlFor='select'>Username</Label>
          </Col>
          <Col xs='6' md='3'>
            <Input
              type='text'
              name='username'
              value={this.state.username}
              onChange={event => this.handleChange(event)}
            />
          </Col>
          </FormGroup>
          <FormGroup row>
          <Col xs='3' md='2'>
            <Label htmlFor='select'>Password</Label>
          </Col>
          <Col xs='6' md='3'>
            <Input
              type='password'
              name='password'
              value={this.state.password}
              onChange={event => this.handleChange(event)}
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

export default Security
