# **Archived: Venus Docker Grafana Images**

You can find the latest version of the source code at https://github.com/victronenergy/venus-influx-loader where it continues to be actively developed and maintained.

This repository is kept for historical reference.

---

# venus-docker-grafana-images
See https://github.com/victronenergy/venus-docker-grafana for usage and a lot of other information.

This repo has two docker images:

- Grafana, the Grafana Dashboard, code in `/Grafana`; very minimal
- Server, the dashboard as well as data-transmitter, both written in nodejs.

## Server

The entry point for docker is in `/server/docker/Dockerfile`, which first installs the
venus-docker-grafana-server, a nodejs package, by downloading it from www.npmjs.com (!).

Thereafter it starts it, by starting [venus-server](https://github.com/victronenergy/venus-docker-grafana-images/blob/master/server/bin/venus-server).

To learn more, read there.

Functions of the Server
  - Dashboard, running at 0.0.0.0:8088
  - API, also used by a JSON panel in Grafana, at 0.0.0.0:8088/grafana-api
  - data-transmitter

## Some info to help trouble shooting

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
