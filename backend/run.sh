#!/bin/bash
# Startup script for DetectSteel backend

echo "🚀 Starting DetectSteel Backend..."

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate venv
echo "✅ Activating virtual environment..."
source venv/Scripts/activate

# Install requirements
echo "📥 Installing dependencies..."
pip install -r requirements.txt -q

# Run migrations (if using Alembic)
# echo "🗄️  Running migrations..."
# alembic upgrade head

# Start server
echo "▶️  Starting Uvicorn server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
