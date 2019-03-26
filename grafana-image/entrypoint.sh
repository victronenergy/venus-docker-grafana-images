#!/bin/bash

G_DIR=/var/lib/grafana

if [ ! -f $G_DIR/grafana.db ]; then
  echo "Copying inital settings"
  cp -r /initial/* $G_DIR
fi

/run.sh

