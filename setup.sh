#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Digital Invitation Builder - Setup ===${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node -v)${NC}"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and running.${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL found${NC}"
fi

echo ""
echo -e "${BLUE}Step 1: Setting up Backend${NC}"
cd backend
echo "Installing backend dependencies..."
npm install

echo ""
echo "Creating .env file from example..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Backend .env created${NC}"
else
    echo -e "${YELLOW}ℹ️  .env already exists${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Setting up Database${NC}"
echo "Running Prisma migrations..."
npx prisma migrate dev --name init

cd ..

echo ""
echo -e "${BLUE}Step 3: Setting up Frontend${NC}"
cd frontend
echo "Installing frontend dependencies..."
npm install

echo ""
echo "Creating .env.local file from example..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✅ Frontend .env.local created${NC}"
else
    echo -e "${YELLOW}ℹ️  .env.local already exists${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo ""
echo -e "${BLUE}To start the application:${NC}"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo -e "${BLUE}URLs:${NC}"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5000"
echo "  Database: postgresql://localhost:5432"
echo ""
