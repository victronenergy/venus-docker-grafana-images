# Stage 1: build from source
FROM node:18-alpine as build

WORKDIR /venus-grafana-server

COPY . .
RUN npm install
RUN npm run build

# Stage 2: minimize
FROM node:18-alpine

WORKDIR /venus-grafana-server

COPY --from=build /venus-grafana-server/bin ./bin
COPY --from=build /venus-grafana-server/dist ./dist
COPY --from=build /venus-grafana-server/src/server ./src/server
COPY --from=build /venus-grafana-server/package*.json ./

RUN npm install --omit=dev

USER node

CMD [ "./bin/venus-upnp-browser.js" ]
