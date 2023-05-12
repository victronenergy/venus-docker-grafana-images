PLATFORMS="linux/armhf,linux/arm64,linux/amd64"

VER=$1

if [ "$VER" == "" ]; then
  echo "specify version (for example: develop, latest, main, 2.5)"
  exit 1
fi

REPO=victronenergy
TARGET=venus-docker-upnp
DOCKERFILE="docker-upnp/Dockerfile"
BUILD_OPTS="--no-cache --pull"

TAG="$REPO/$TARGET:${VER}"

# Note that we are invoking `docker build` from our parent directory
# with -f pointing towards our custom Dockerfile
# and trailing . to specify directory to use as a build context
# while omitting files speficied in .dockerignore from the build context
(cd .. && docker buildx build ${BUILD_OPTS} -f ${DOCKERFILE} --platform $PLATFORMS -t ${TAG} --push .)
