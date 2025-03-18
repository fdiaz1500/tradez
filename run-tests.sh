#!/bin/bash

# Set default command
command=${1:-"all"}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    backend)
      command="backend"
      shift
      ;;
    frontend)
      command="frontend"
      shift
      ;;
    e2e)
      command="e2e"
      shift
      ;;
    all)
      command="all"
      shift
      ;;
    -h|--help)
      echo "Usage: ./run-tests.sh [backend|frontend|e2e|all]"
      echo "  backend  - Run backend unit and integration tests"
      echo "  frontend - Run frontend unit tests"
      echo "  e2e      - Run end-to-end tests"
      echo "  all      - Run all tests"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

# Function to run docker-compose command
run_docker_compose() {
  # DEBUG
  # docker-compose -f docker-compose.yml -f docker-compose.test.yml $@
  docker-compose -f docker-compose.test.yml $@
}

# Function to wait for a service to be ready
wait_for_service() {
  service_name=$1
  echo "Waiting for $service_name to be ready..."
  # DEBUG
  # while ! docker-compose -f docker-compose.yml -f docker-compose.test.yml ps | grep $service_name | grep "Up" > /dev/null; do
  while ! docker-compose -f docker-compose.test.yml ps | grep $service_name | grep "Up" > /dev/null; do
    sleep 1
  done
  echo "$service_name is ready!"
}

# Run tests based on command
case $command in
  backend)
    echo "Running backend tests..."
    run_docker_compose up --build -d db-test redis-test
    wait_for_service db-test
    run_docker_compose up --build backend-test
    ;;
  frontend)
    echo "Running frontend tests..."
    run_docker_compose up --build frontend-test
    ;;
  e2e)
    echo "Running end-to-end tests..."
    run_docker_compose up --build -d db redis frontend backend
    wait_for_service frontend
    wait_for_service backend
    run_docker_compose up --build e2e-test
    ;;
  all)
    echo "Running all tests..."
    # Run backend and frontend tests first
    run_docker_compose up --build -d db-test redis-test
    wait_for_service db-test
    run_docker_compose up --build backend-test
    run_docker_compose up --build frontend-test
    
    # Then run E2E tests
    run_docker_compose up --build -d db redis frontend backend
    wait_for_service frontend
    wait_for_service backend
    run_docker_compose up --build e2e-test
    ;;
esac

# Print test results location
echo ""
echo "Test results:"
echo "  Backend: backend/coverage/lcov-report/index.html"
echo "  Frontend: frontend/coverage/lcov-report/index.html"
echo "  E2E screenshots: frontend/cypress/screenshots/"
echo "  E2E videos: frontend/cypress/videos/"
echo ""

# Exit with success
exit 0


