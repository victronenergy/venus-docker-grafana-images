
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

import socket
import requests
import untangle
import logging

msg = \
    'M-SEARCH * HTTP/1.1\r\n' \
    'HOST:239.255.255.250:1900\r\n' \
    'ST:upnp:rootdevice\r\n' \
    'MX:2\r\n' \
    'MAN:"ssdp:discover"\r\n' \
    '\r\n'

def find():
    # Set up UDP socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    s.settimeout(5)
    s.sendto(bytes(msg, 'utf-8'), ('239.255.255.250', 1900) )

    found = []
    try:
        while True:
            #data, addr = s.recvfrom(65507)
            data, addr = s.recvfrom(65507*2)
            #print(addr, data)
            items = str(data).split('\\n')
            for a in items:
                parts = a.split(':', 1)
                if len(parts) > 1 and parts[0].lower() == 'location':
                    found.append((addr, parts[1][:-2].strip()))
    except socket.timeout:
        pass

    #print(found)

    portalIds = []

    for (addr, url) in found:
        try:
            resp = requests.get(url)
        except:
            pass
        if resp.status_code == 200:
            doc = untangle.parse(resp.text)
            try:
                model = doc.root.device.modelName.cdata
                if model == 'CCGX':
                    name = doc.root.device.friendlyName.cdata
                    try:
                        #FIXME: make sure we don't add duplicates
                        id = doc.root.device.ve_X_VrmPortalId.cdata
                        logging.info('Found %s' % name)
                        portalIds.append((id, addr[0]))
                    except AttributeError:
                        logging.error('Device %s needs updated, no portal id' % name)
            except:
                pass
            
    return portalIds

if __name__=='__main__':
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s %(levelname)s %(message)s')
    find()    
