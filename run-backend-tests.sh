#!/bin/bash

# Stop and remove any existing containers
docker-compose -f docker-compose.test.yml down

# Build the test containers
docker-compose -f docker-compose.test.yml build

# Run the tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Clean up after tests
docker-compose -f docker-compose.test.yml down

