
from influxdb import InfluxDBClient
from influxdb.exceptions import InfluxDBClientError
import json
import sys
import logging

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
    if 'retention' in config:
        retention = config['retention']
    else:
        retention = '30d'
        
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
