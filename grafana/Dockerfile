FROM grafana/grafana

COPY initial /initial
COPY entrypoint.sh /

#RUN ["grafana-cli",  "plugins", "install", "simpod-json-datasource" ]

ARG GF_INSTALL_PLUGINS="simpod-json-datasource"

RUN if [ ! -z "${GF_INSTALL_PLUGINS}" ]; then \
    OLDIFS=$IFS; \
        IFS=','; \
    for plugin in ${GF_INSTALL_PLUGINS}; do \
        IFS=$OLDIFS; \
        grafana-cli --pluginsDir "$GF_PATHS_PLUGINS" plugins install ${plugin}; \
    done; \
fi

ENTRYPOINT ["/entrypoint.sh"]
