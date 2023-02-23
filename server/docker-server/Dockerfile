FROM node:16

EXPOSE 8088/TCP

RUN npm install -g --unsafe-perm venus-docker-grafana-server

RUN mkdir /config
RUN chown -R node:node /config

USER node

CMD [ "venus-server", "--external-upnp" ]

HEALTHCHECK --interval=10s --timeout=10s --start-period=5s CMD curl -f http://localhost:8088
