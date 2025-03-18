#!/usr/bin/env bash

# Stop all containers
docker stop `docker ps -qa`
wait

# Remove all containers
docker rm `docker ps -qa`
wait

# Remove all images
docker rmi -f `docker images -qa `
wait

# Remove all volumes
docker volume rm $(docker volume ls -q)
wait

# Remove all networks
# docker network rm `docker network ls -q`

# Your installation should now be all fresh and clean.

# The following commands should not output any items:
# docker ps -a
# docker images -a 
# docker volume ls

# The following command show only show the default networks:
# docker network ls

