FROM grafana/grafana

COPY initial /initial
COPY entrypoint.sh /

RUN ["grafana-cli",  "plugins", "install", "simpod-json-datasource" ]

ENTRYPOINT ["/entrypoint.sh"]
