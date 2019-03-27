
# The MIT License

# Copyright (c) 2019 Victron Energy BV

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

from influxdb import InfluxDBClient
from influxdb.exceptions import InfluxDBClientError
import json
import sys
import logging
import os

def init(config):
    logging.info('Connecting to influxdb...')
    
    if 'host' in config:
        host = config['host']
    else:
        host = 'influxdb'
    if 'port' in config:
        port = config['port']
    else:
        port = 8086
    if 'INFLUXDB_RETENTION' in os.environ:
        retention = os.environ['INFLUXDB_RETENTION']
    elif 'retention' in config:
        retention = config['retention']
    else:
        retention = '30d'

    logging.info('loaded influxdb config host: %s port:%d retention %s' % (host, port, retention))
        
    global client
    client = InfluxDBClient(host=host, port=port, retries=0)
    client.create_database('venus')
    client.switch_database('venus')
    try:
        client.create_retention_policy("venus_default", retention, '1', 'venus', True)
    except InfluxDBClientError:
        client.alter_retention_policy("venus_default", 'venus', retention, '1', True)

def store(portalId, instance_num, name, value):
    if value is None :
        return
    valueKey = 'value'
    if type(value) is str:
        if len(value) is 0: #influxdb won't allow empty strings
            return
        valueKey = 'stringValue'
    elif type(value) is int:
        value = float(value)
    elif type(value) is float:
        pass
    else: # unsupported type
        return
    
    body = [
        {
            'measurement': name,
            'tags': {
                'portalId': portalId,
                "instanceNumber": instance_num
                
            },
            'fields': {
                valueKey: value
            }
        }
    ]
    try:
        client.write_points(body)
    except (KeyboardInterrupt, SystemExit):
        raise
    except:
        logging.error("Unexpected error:", sys.exc_info())
        logging.error(json.dumps(body))

        
        #print (type(client))
    #print ("res: " + str(res))
