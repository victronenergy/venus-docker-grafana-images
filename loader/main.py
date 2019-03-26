#!/usr/bin/python

import paho.mqtt.client as mqtt
import json
import influxdb_provider
import sys
import threading
import time
import argparse
import logging
import requests
import upnp
import os

api_url = 'https://vrmapi.victronenergy.com'
keep_alive_interval = 62.0

def on_connect(mqttc, obj, flags, rc):
    if rc is 0:
        logging.info('Connected to MQTT at %s' % obj['address'])
        for id in obj['portalIDs']:
            logging.info('Subscribing to portalId %s' % id)
            mqttc.subscribe('N/%s/+/#' % id)
            mqttc.publish('R/%s/system/0/Serial' % id)

        server['timer'] = threading.Timer(keep_alive_interval, keep_alive, [mqttc, obj])
        server['timer'].start()
    else:
        logging.error('Unable to connect %d', rc)

def on_disconnect(client, userdata, rc):
    logging.info('MQTT disconnected from %s: %d' %  (userdata['address'], rc))
    if 'timer' in userdata:
        userdata['timer'].stop()
   
def on_message(mqttc, obj, msg):
    #data = json.dumps(msg.payload)
    decoded = msg.payload.decode('utf-8','ignore')
    data = json.loads(decoded)
    split = msg.topic.split('/')
    id = split[1]
    instance_num = split[3]
    split.pop(3)
    measurement = '/'.join(split[2:])

    #print('id: %s inum: %s measurement: %s value: %s' % (id, instance_num, measurement, data['value']))
    try:
        influxdb_provider.store(id, instance_num, measurement, data['value'])
    except (KeyboardInterrupt, SystemExit):
        raise
    except:
        logging.error('Unexpected error:', sys.exc_info())
        traceback.print_exc()
        
        #print('message: ' + msg.topic + ' ' + str(msg.qos) + ' ' + decoded)


def on_subscribe(mqttc, obj, mid, granted_qos):
    print('Subscribed: ' + str(mid) + ' ' + str(granted_qos))


def on_log(mqttc, obj, level, string):
    logging.debug(string)

def keep_alive(mqttc, server):
    logging.info('Sending keepailve to %s' % server['address'])
    try:
        for id in server['portalIDs']:
            res = mqttc.publish('R/%s/system/0/Serial' % id)
            #print('kp res: ' + str(res))
    except (KeyboardInterrupt, SystemExit):
        raise
    except:
        logging.error('Unexpected error:', sys.exc_info())
    server['timer'] = threading.Timer(keep_alive_interval, keep_alive, [mqttc, server])
    server['timer'].start()

class ApiError(Exception):
    def __init__(self, message):
        self.message = message

def get_vrm_portalIDs(server):
    logging.info('Getting portal IDs from VRM...')
    post = {
        'username': server['username'],
        'password': server['password']
    }

    resp = requests.post(api_url + '/v2/auth/login', json=post)
    if resp.status_code != 200:
        raise ApiError('bad status code %d' % resp.status_code)

    login_json = resp.json()
    token = login_json['token']
    idUser = login_json['idUser']

    resp = requests.get(api_url + '/v2/users/%s/installations' % idUser,
                        headers={'X-Authorization': 'Bearer %s' % token})
    if resp.status_code != 200:
        raise ApiError('bad status code %d' % resp.status_code)

    res = []
    for record in resp.json()['records']:
        res.append(record['identifier'])
    return res
    
def main():
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s %(levelname)s %(message)s')

    parser = argparse.ArgumentParser(description='mqtt-to-db')
    parser.add_argument('--config', action='store', dest='config_file',
                        help='configuration file',required=False,type=argparse.FileType('r'))

    args = parser.parse_args()

    if args.config_file is not None:
        config = json.load(args.config_file)

    else:
        if 'CONFIG_FILE' in os.environ:
            config = json.load(open(os.environ['CONFIG_FILE'], 'r'))
        else:
            config = {}
            
    if 'vrm_login' in config or 'VRM_USER_NAME' in os.environ:
        if 'VRM_USER_NAME' in os.environ:
            vrm_login = {
                "username": os.environ['VRM_USER_NAME'],
                "password": os.environ['VRM_PASSWORD']
            }
        else:
            vrm_login = config['vrm_login']

        if 'portalIDs' not in vrm_login:
            portalIDs = get_vrm_portalIDs(vrm_login)
        else:
            portalIDs = vrm_login['portalIDs']
            
        config['mqtt_servers'] = [{
            'address': 'mqtt.victronenergy.com',
            'port': 8883,
            'username': vrm_login['username'],
            'password': vrm_login['password'],
            'cert': 'venus-ca.crt',
            'portalIDs': portalIDs
        }]
    elif 'mqtt_servers' not in config:
        devices = upnp.find()
        if len(devices) == 0:
            logging.error('No servers found via UPNP')
            sys.exit(1)
        config['mqtt_servers'] = []
        for (id, addr) in devices:
            config['mqtt_servers'].append({
                'address': addr,
                'port': 1883,
                'portalIDs': [ id ]
            })
            
    if not 'mqtt_servers' in config:
        logging.error('No mqtt_servers defined in config file')
        sys.exit(1)

    mqtt_servers = config['mqtt_servers']
        
    if len(mqtt_servers) is 0:
        logging.error('No servers defined in config file')
        sys.exit(1)

    if 'influxdb' in config:
        influxdb_config = config['influxdb']
    else:
        influxdb_config = {}
        
    influxdb_provider.init(influxdb_config)        
        
    for server in mqtt_servers:
        if 'transport' not in server:
            server['transport'] = 'tcp'
        client = mqtt.Client(client_id='mqtt-to-db', userdata=server, transport=server['transport'])
        client.on_message = on_message
        client.on_connect = on_connect
        client.on_disconnect = on_disconnect
        #client.on_subscribe = on_subscribe
        client.on_log = on_log

        if 'username' in server and 'password' in server:
            un = server['username']
            pw = server['password']
            client.username_pw_set(username=un,password=pw)

        if 'cert' in server:
            client.tls_set(server['cert'], tls_version=2)

        address = server['address']
        logging.info('Connecting to MQTT at %s...' % address)
        client.connect_async(address, server['port'], 60)

    client.loop_forever()

if __name__=='__main__':
    main()
