#!/bin/bash

# Melted Pictures - Setup Script
# This script helps set up the database and install dependencies

set -e

echo ""
echo "═══════════════════════════════════════════"
echo "🎬 Melted Pictures Setup"
echo "═══════════════════════════════════════════"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env with your database credentials before continuing!"
    echo ""
    echo "Required settings:"
    echo "  DB_USER=your_postgres_user"
    echo "  DB_PASSWORD=your_postgres_password"
    echo "  SESSION_SECRET=a-random-secret-string"
    echo "  ADMIN_PASSWORD=your-admin-password"
    echo ""
    read -p "Press Enter after editing .env to continue..."
fi

# Source .env
source .env

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running or not accessible"
    echo "   Start PostgreSQL with: sudo systemctl start postgresql"
    exit 1
fi
echo "✓ PostgreSQL is running"

# Create database if it doesn't exist
echo ""
echo "Setting up database..."
DB_EXISTS=$(psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER} -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME:-melted_pictures}'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo "Creating database '${DB_NAME:-melted_pictures}'..."
    createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER} ${DB_NAME:-melted_pictures}
    echo "✓ Database created"
else
    echo "✓ Database already exists"
fi

# Install dependencies
echo ""
echo "Installing Node.js dependencies..."
npm install
echo "✓ Dependencies installed"

# Initialize database schema
echo ""
echo "Initializing database schema..."
npm run db:init
echo "✓ Database initialized"

echo ""
echo "═══════════════════════════════════════════"
echo "🎬 Setup Complete!"
echo "═══════════════════════════════════════════"
echo ""
echo "Start the server with:"
echo "  npm start"
echo ""
echo "Or for development with auto-reload:"
echo "  npm run dev"
echo ""
echo "Then visit:"
echo "  Site:  http://localhost:${PORT:-3000}"
echo "  Admin: http://localhost:${PORT:-3000}/admin"
echo ""
echo "Default admin login:"
echo "  Email: ${ADMIN_EMAIL:-admin@meltedpictures.com}"
echo "  Password: (set in .env ADMIN_PASSWORD)"
echo ""
echo "⚠️  Remember to change the default password!"
echo ""
