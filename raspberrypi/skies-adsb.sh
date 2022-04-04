#!/usr/bin/env bash

dump1090-mutability --net --quiet &

sleep 5

websockify 0.0.0.0:30006 0.0.0.0:30003
