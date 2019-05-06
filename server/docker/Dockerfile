FROM node:8

EXPOSE 8088/TCP

RUN npm install -g --unsafe-perm venus-docker-grafana-server

RUN mkdir /config

CMD [ "venus-server", "--external-upnp" ]
