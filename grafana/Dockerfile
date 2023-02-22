FROM grafana/grafana:9.3.6

COPY provisioning /provisioning
COPY entrypoint.sh /

USER grafana

ENTRYPOINT ["/entrypoint.sh"]
