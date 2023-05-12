VER=develop

REPO=victronenergy
TARGET=venus-docker-grafana
BUILD_OPTS="--no-cache --pull --progress=plain"

TAG="$REPO/$TARGET:${VER}"

docker build ${BUILD_OPTS} -t ${TAG} .
