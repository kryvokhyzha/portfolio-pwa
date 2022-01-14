#!/bin/bash

echo Starting deploy to DockerHub...
docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"
docker build -f Dockerfile -t "$DOCKER_USER"/"$DOCKER_APP_NAME":"latest" .
docker push "$DOCKER_USER"/"$DOCKER_APP_NAME":"latest"