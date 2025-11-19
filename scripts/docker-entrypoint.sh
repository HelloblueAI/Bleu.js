#!/bin/bash
set -e

# Initialize environment variables
source /opt/venv/bin/activate

# Wait for dependencies (if needed)
if [ -n "$WAIT_FOR_IT" ]; then
    echo "Waiting for dependencies..."
    IFS=',' read -ra DEPS <<< "$WAIT_FOR_IT"
    for dep in "${DEPS[@]}"; do
        host=$(echo $dep | cut -d: -f1)
        port=$(echo $dep | cut -d: -f2)
        /app/wait-for-it.sh "$host:$port" -t 60
    done
fi

# Run database migrations
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    alembic upgrade head
fi

# Initialize quantum environment
echo "Initializing quantum environment..."
python -m src.quantum_py.quantum.init

# Start the application
case "$1" in
    "api")
        echo "Starting API server..."
        uvicorn src.backend.api.main:app --host 0.0.0.0 --port 8000 --workers 4
        ;;
    "worker")
        echo "Starting background worker..."
        celery -A src.backend.worker worker --loglevel=info
        ;;
    "scheduler")
        echo "Starting scheduler..."
        celery -A src.backend.worker beat --loglevel=info
        ;;
    *)
        echo "Starting development server..."
        uvicorn src.backend.api.main:app --host 0.0.0.0 --port 8000 --reload
        ;;
esac
