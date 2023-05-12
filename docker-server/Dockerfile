# Stage 1: build from source
FROM node:18-alpine as build

WORKDIR /venus-grafana-server

COPY . .
RUN npm install
RUN npm run build

# Stage 2: minimize
FROM node:18-alpine

RUN apk --no-cache add curl

WORKDIR /venus-grafana-server

COPY --from=build /venus-grafana-server/bin ./bin
COPY --from=build /venus-grafana-server/dist ./dist
COPY --from=build /venus-grafana-server/src/server ./src/server
COPY --from=build /venus-grafana-server/package*.json ./

RUN npm install --omit=dev

USER node
EXPOSE 8088

HEALTHCHECK --interval=10s --timeout=10s --start-period=5s CMD curl -f http://localhost:8088
CMD [ "./bin/venus-grafana-server.js", "--enable-discovery-api" ]
