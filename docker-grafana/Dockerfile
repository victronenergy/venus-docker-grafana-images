FROM grafana/grafana:9.5.2

COPY provisioning /provisioning
COPY entrypoint.sh /

USER grafana
EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
