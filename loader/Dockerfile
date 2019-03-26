FROM python:3

COPY main.py /
COPY influxdb_provider.py /
COPY upnp.py /

ADD https://raw.githubusercontent.com/victronenergy/dbus-mqtt/master/venus-ca.crt /

RUN pip install paho-mqtt
RUN pip install influxdb
RUN pip install untangle

CMD [ "python", "./main.py" ]

