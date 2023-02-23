# venus-docker-grafana-images
See https://github.com/victronenergy/venus-docker-grafana for usage and a lot of other information.

This repository contains source code for the following:

## venus-docker-grafana-server NPM module

The https://www.npmjs.com/package/venus-docker-grafana-server npm module provides the following functionality:

### venus-upnp-browser

`venus-upnp-browser` scans the local network with UPNP and discovers running Venus OS devices.

It will inform the `venus-grafana-server` about discovered instances and its progress via HTTP POST to `/log` and `/upnpDiscovered` endpoints.

### venus-grafana-server

`venus-grafana-server` currently covers the following functionality:

#### Essential (sources in `server/lib`)

- It reads `/config/config.json` file to configure itself and to determine how to connect to InfluxDB, and what Venus OS, and VRM devices to poll.
- It talks to Venus OS devices on the local network via MQTT, or to VRM portal over the internet, and periodically stores the measured values to InfluxDB.

TODO: this code also exposes all HTTP API routes required by UI and Grafana below, cleanup needed.

#### UI (sources in `server/src`, `server/public_src`, `server/sccs`)

- It provides a simple web UI based on Node Express framework running on port 8088.
- It provides internal API for web UI to save and read `/config/config.json` file. It does this via API endpoints GET and POST to `/admin-api/config`.
- It provides internal API endpoints POST `/log` and POST `/upnpDiscovered` for `venus-upnp-browser` to talk to.
- It provides internal API endpoints GET `/admin-api/log` and POST `/admin-api/security` for web UI to fetch logs and configure admin password.

TODO: UI is only required for easy setup + potential troubleshooting. Make optional?

#### Grafana API

- It provides an API endpoint served at `/grafana-api`, `/grafana-api/search`, `/grafana-api/query` that can be used together with https://github.com/simPod/GrafanaJsonDatasource for Grafana to determine what Venus OS devices, and VRM portals, are currently being monitored by the `venus-grafana-server`. Since Grafana also uses InfluxDB datasource to fetch real data, perhaps simpler way to determine what systems are live would be by obtaining the unique portal IDs directly from InfluxDB.


## venus-docker-server Docker Image

Docker image wrapping the `venus-grafana-server`.
Exposing TCP port `8088`.
Requires read/write access to `/config/config.json`.

To build the image locally use the following command:

```
$ (cd server/docker-server && docker build --pull -t venus-docker-server:develop .)
```

To build the official release image supporting all required architectures use the following command:
Replace `VERSION` with the official version number such as `2.5`, or image tag like `latest`.

```
$ (cd server/docker-server && ./build-images.sh VERSION)
```

## venus-docker-upnp Docker Image

Docker image wrapping the `venus-upnp-browser`.
Hardcoded to use `http://server:8088` for outgoing communication. TODO: Make configurable?

To build the image locally use the following command:

```
$ (cd server/docker-upnp && docker build --pull -t venus-docker-upnp:develop .)
```

To build the official release image supporting all required architectures use the following command:
Replace `VERSION` with the official version number such as `2.5`, or image tag like `latest`.

```
$ (cd server/docker-upnp && ./build-images.sh VERSION)
```

## venus-docker-grafana Docker Image

Docker image containing Grafana + preconfigured data sources and sample dashboards.
Data sources + sample dashboards are read only. Modifications need to be done via duplicate + save.
Requires read/write access to `/var/lib/grafana`, where all Grafana settings (username + password + dashboards) are stored.

To build the image locally use the following command:

```
$ (cd grafana && docker build --pull -t venus-docker-grafana:develop .)
```

To build the official release image supporting all required architectures use the following command:
Replace `VERSION` with the official version number such as `2.5`, or image tag like `latest`.

```
$ (cd grafana && ./build-images.sh VERSION)
```

## Troubleshooting

The log of [venus-server](https://github.com/victronenergy/venus-docker-grafana-images/blob/master/server/bin/venus-server)
looks like this when its running ok:
```
[info] [influxdb] Attempting connection to v-7c242b35567af6a044fcaae432a98bb7f25cdf68-influxdb:8086/venus
[info] [vrm] Getting installations
[info] [venus-server] running at 0.0.0.0:8088
[info] [influxdb] Connected
[info] [vrm] Installations Retrieved
[info] [influxdb] Set retention policy to 30d
[info] [loader] connecting to mqtt95.victronenergy.com:8883
[info] [vrm] Connected
[info] [loader] connected to mqtt95.victronenergy.com
[info] [loader] Subscribing to portalId c0847dc9a3a4
```
