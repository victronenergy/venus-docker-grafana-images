PLATFORMS="linux/armhf,linux/arm64,linux/amd64"

VER=$1

if [ "$VER" == "" ]; then
  echo "specify version"
  exit 1
fi

REPO=victronenergy
TARGET=venus-docker-grafana
BUILD_OPTS=--no-cache
TAG_LATEST=0

TAG="$REPO/$TARGET:${VER}"

docker buildx build ${BUILD_OPTS} --platform $PLATFORMS -t ${TAG} --push .
