# Venus Grafana Server

Venus Grafana Server is a small application that allows reatime monitoring, and historical data analysis of Venus devices. It obtains realtime measurements from Venus devices via MQTT, stores them for later analysis into InfluxDB, and allows visualization via Grafana.

It supports connection to the Venus devices:

  - Running on the same network and discovered via UPNP.
  - Configured manually by setting their IP address.
  - Configured via VRM login credentials.

Venus Grafana Server can run nearby a Venus device, and does not require internet access.

It is therefore ideal to be installed on a Yacht, Motorhome, or sites without permanent internet access.

TODO: Venus Grafana Server comes with many preconfigured dashboards for various different types of installations, such as ESS, Yacht, and Motorhome.

## Quick Start

To start experimenting, please install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and use `docker compose` to bring up a quick testing environment:

```
$ docker compose -f docker-compose-playground.yaml up
```

It will spin up a custom instance of InfluxDB, Grafana, and Venus Grafana Server Admin User Interface.

1. Navigate to http://localhost:8088 to access Venus Grafana Server Admin UI, use `admin`, `admin` to sign in, and configure what Venus devices to watch.
2. Navigate to http://localhost:3000 to access Grafana, use `admin`, `admin` to sign in, and look around default Grafana dashboards.

Note that playground environment will store all configuration and data inside docker containers created by `docker compose` and you will loose the data and all modifications if you later remove or recreate the containers.

Please see below how to specify where to store the data and configuration.

## Configuration

### Venus Grafana Server Configuration

  - TODO: Describe where the `config.json` and `secrets.json` is stored and how to change that via `docker-compose.yaml`, and command line arguments.

### InfluxDB Data Storage

  - TODO: Descibe where InfluxDB stores data, and how it can be configured via `docker-compose.yaml`.

### Grafana Configuration and Dashboards

  - TODO: Descibe where Grafana stores custom dashboards, admin username and password, and how we provision Grafana with preconfigured data sources and preconfigured dashboards. How to best create your own setup with custom dashboards that can be stored in git easily.

## Source Code Details

The repository is spit into the following components:

## Server

The directory `src/server` contains node.js based server watching Venus devices using MQTT and storing real time measurements into InfluxDB. It vends two binaries: `bin/venus-grafana-server`, and `bin/venus-upnp-browser`.

### Venus Grafana Server

Venus Grafana Server allows MQTT connection to the Venus devices running on the same network and discovered via UPNP, configured manually using their IP address, or by accessing them via VRM.

Configuration details and necessary usernames and passwords are stored in `config.json`, and `secrets.json` that are looked up under `--config-path` (`/config` by default). Config Path needs to be writable. TODO: should not be needed to config path to be writable in production deployments.

Configuration files can either be created manually, or by starting the Venus Grafana Server, and accessing the Admin UI by browsing to `http://localhost:8088`. The default usernname and password is `admin`, `admin`.

```
$ npx venus-grafana-server --help
Usage: venus-grafana-server [options]

Monitor Venus devices and capture & store realtime data to serve Grafana

Options:
  -c, --config-path <path>  path to store config.json and secrets.json (default: "/config")
  --disable-admin-api       disable Admin Web User Interface and /admin-api/ endpoint
  --disable-grafana-api     disable Grafana JSON datasource /grafana-api/ endpoint
  --enable-discovery-api    enable venus-upnp-browser /discovery-api/ endpoint
  -p, --port <port>         http port used by Admin Web User Interface and Grafana JSON datasource (default: 8088)
  -h, --help                display help for command
```

For production use, once the system is configured `--disable-admin-api` can be used to run the `venus-grafana-server` headless.

### Venus UPNP Browser

Venus Grafana Server contains built in mechanism to discover Venus devices running on the same network via UPNP, that is enabled by default.

In cases where `venus-grafana-server` may not have access to local network UPNP, such as when it runs in isolated docker network, or in docker bridge mode, `venus-upnp-browser` can be used to discover Venus devices over UPNP.

The reason behind spliting these two functionalities among two binaries is:

  - Docker container running in host networking mode can not expose ports under Docker Desktop for Mac and Windows (https://github.com/docker/for-mac/issues/6185). So `venus-grafana-server` running in `host` networking mode can access UPNP, but will not get access to port `8088` to enable Admin UI.
  - Docker container running in bridge networking mode does not support UPNP. So `venus-grafana-server` running in `bridge` networking mode will properly map port 8088 for Admin UI, but will not have access to UPNP.
  - Docker container running in isolated networking mode can expose port `8088`, but does not have access to UPNP.  

To workaround the limitations, `venus-upnp-browser` actually runs in docker host mode network - having access to both local area UPNP, as well as `venus-grafana-server` admin port exposed via docker, `venus-upnp-browser` communicates discovered Venus devices and diagnostic information to `venus-grafana-server` via `--discovery-api`.

Note: `host` and `bridge` network mode work properly only on Linux. UPNP does not work in Docker Desktop for Mac at all.

```
$ npx venus-upnp-browser --help
Usage: venus-upnp-browser [options]

Discover Venus devices running on local network using UPNP

Options:
  -d, --discovery-api <url>  discovery api endpoint (default: "http://localhost:8088/discovery-api/")
  -h, --help                 display help for command
```

### Venus Grafana Server Admin UI

The directory `src/client` contains react.js based web admin interface to manage configuration of `src/server`. Client Admin UI app uses `webpack` to compile the browser JavaScript, HTML, and CSS code.

## Development

### 1. Prepare development instance of InfluxDB and Grafana

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and use `docker compose` to bring up a quick dev environment:

```
$ docker compose -f docker-compose-dev.yaml up
```

This will spin up a local testing InfluxDB instance, as well as local Grafana instance with preconfigured data sources and dashboards.

### 2. Start venus-grafana-server, and client in hot reloading mode

```
$ npm install
$ npm run dev
```

This command will use [`concurrently`](https://www.npmjs.com/package/concurrently) command to start hot reloading development instances of both the `src/server`, and `src/client`, so whenever you change source code in `src/` everything should get restarted/reloaded automatically. 

Alternatively you can spin up only hot reloading server, or only hot reloading client via:

```
$ npm run watch-grafana-server
```

and 

```
$ npm run watch-client
```

## Internal API Documentation

Source code is organized according to best practices recommended by  https://github.com/crsandeep/simple-react-full-stack.

The directory `src/client` contains a [React.js](https://reactjs.org) based web app using [React Redux](https://react-redux.js.org) to manage app state and [React Router](https://reactrouter.com/) to handle client side routing. User interface is developed using [Core UI React Components](https://coreui.io/react/) and follows the structure of [Core UI Admin Template](https://coreui.io/product/free-react-admin-template/).

The directory `/src/server` is a [Node.js](https://nodejs.org/en/) app that is configured via `/config/config.json` and `/config/secrets.json` to determine what Venus OS devices to watch and how, and where to store data.

`/src/server` exposes the following internal API routes.

1. `/admin` protected by admin username and password stored ic `/config/secrets.json`.

This route serves compiled and packed `src/client` `html`, `js`, and `css` web app files from `src/client/dist`.

1. `/admin-api` protected by admin username and password stored in `/config/secrets.json`.

 - `/admin-api/config` for `src/client` to `GET/PUT` `/config/config.json`.
 - `/admin-api/security` for `scr/client` to `POST` new admin username and password and save to `/config/secrets.json`.
 - `/admin-api/log` for `src/client` to `GET` recent server log entries.
 - `/admin-api/debug` to `src/client` to `PUT` server in `debug` or `info` log mode.

TODO: cleanup (move away from `vrm.js` ??)

 - `/admin-api/vrmLogin` `POST` to login into VRM.
 - `/admin-api/vrmLogout` `POST` to logout from VRM.
 - `/admin-api/vrmRefresh` `PUT` to refresh list of portals available via VRM.
 

2. `/grafana-api` that is unprotected and used by [Grafana JSON Datasource](https://grafana.com/grafana/plugins/simpod-json-datasource/) to query Venus OS devices being watched.
 - `/grafana-api/` `GET`
 - `/grafana-api/search` `POST`
 - `/grafana-api/query ` `POST`

3. Interface for `venus-upnp-browser`. Unprotected.

TODO: protect with admin username and password so that nobody can flood the log and discovery endpoint?

 - `/discovery-api/log` to `POST`a new server log entry.
 - `/discovery-api/upnpDiscovered` to `POST` info about Venus OS device newly discovered via externally running `venus-upnp-browser`.

