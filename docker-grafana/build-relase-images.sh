PLATFORMS="linux/armhf,linux/arm64,linux/amd64"

VER=$1

if [ "$VER" == "" ]; then
  echo "specify version (for example: develop, latest, main, 2.5)"
  exit 1
fi

REPO=victronenergy
TARGET=venus-docker-grafana
BUILD_OPTS="--no-cache --pull"

TAG="$REPO/$TARGET:${VER}"

docker buildx build ${BUILD_OPTS} --platform $PLATFORMS -t ${TAG} --push .
