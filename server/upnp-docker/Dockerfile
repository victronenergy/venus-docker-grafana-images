FROM node:8

EXPOSE 8088/TCP

COPY venus-server-2.0.0.tgz /

RUN npm install -g --unsafe-perm /venus-server-2.0.0.tgz

WORKDIR "/usr/local/lib/node_modules/venus-server"

CMD [ "node", "lib/upnp.js" ]
