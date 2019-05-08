ARCHS="armhf amd64"

ARCH=$1
if [ "$ARCH" == "" ]; then
  echo "specify arch: $ARCHS"
  exit 1
fi

VER=$2

if [ "$VER" == "" ]; then
  echo "specify version"
  exit 1
fi

REPO=sbender9
TARGET=victron-server
BUILD_OPTS=--no-cache
TAG_LATEST=0

ARCH_TAGS=""
for arch in $ARCHS
do
    ARCH_TAGS="$ARCH_TAGS $REPO/$TARGET:${arch}-${VER}"
done

cd docker
docker build ${BUILD_OPTS} $PLATFORM -t $REPO/$TARGET:${ARCH}-${VER} .
docker push $REPO/$TARGET:${ARCH}-${VER}

docker manifest create $REPO/$TARGET:$VER $ARCH_TAGS
docker manifest push $REPO/$TARGET:$VER
rm -rf ~/.docker/manifests/docker.io_${REPO}_${TARGET}-${VER}
