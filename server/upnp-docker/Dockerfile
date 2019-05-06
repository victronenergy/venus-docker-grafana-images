FROM node:8

RUN npm install -g --unsafe-perm venus-docker-grafana-server

WORKDIR "/usr/local/lib/node_modules/venus-docker-grafana-server"

CMD [ "node", "lib/upnp.js" ]
