REPO=victronenergy
TARGET=venus-docker-grafana
ARCH=amd64
VER=latest
BUILD_OPTS=--no-cache
TAG_LATEST=0
ARCHS="armhf amd64"

ARCH_TAGS=""
for arch in $ARCHS
do
    ARCH_TAGS="$ARCH_TAGS $REPO/$TARGET:${arch}-${VER}"
done

docker build ${BUILD_OPTS} $PLATFORM -t $REPO/$TARGET:${ARCH}-${VER} .
docker push $REPO/$TARGET:${ARCH}-${VER}

docker manifest create $REPO/$TARGET:$VER $ARCH_TAGS
docker manifest push $REPO/$TARGET:$VER
rm -rf ~/.docker/manifests/docker.io_${REPO}_${TARGET}-${VER}
