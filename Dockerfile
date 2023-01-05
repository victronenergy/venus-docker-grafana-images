FROM node:18

# node-gyp needs python2; calls python3 as python
RUN ln -s /usr/bin/python3 /usr/bin/python && \
 apt update && apt -y install python2

RUN mkdir /config && mkdir /build
COPY ./server/ /build/
# node-gyp workaround: without c++14, compilation fails
RUN cd build && CXXFLAGS="--std=c++14" npm install && npm run build

EXPOSE 8088/TCP
CMD cd build/bin && ./venus-server --external-upnp
