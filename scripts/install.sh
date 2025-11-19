#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Welcome to Bleu.js Installation${NC}\n"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Create project directory
echo -e "${BLUE}📁 Creating project directory...${NC}"
mkdir -p bleujs-project
cd bleujs-project

# Initialize project
echo -e "${BLUE}📦 Initializing project...${NC}"
pnpm init

# Install Bleu.js and dependencies
echo -e "${BLUE}📥 Installing Bleu.js and dependencies...${NC}"
pnpm add bleujs @bleujs/core @bleujs/ai @bleujs/eggs-generator

# Create basic project structure
echo -e "${BLUE}🏗️  Creating project structure...${NC}"
mkdir -p src/{models,services,controllers,routes,utils}
mkdir -p tests
mkdir -p config

# Create example files
echo -e "${BLUE}📝 Creating example files...${NC}"

# Create main application file
cat > src/index.js << 'EOL'
import { Bleu } from 'bleujs';
import express from 'express';

const app = express();
const bleu = new Bleu();

app.use(express.json());

// Example route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
EOL

# Create example model
cat > src/models/example.model.js << 'EOL'
import { Schema } from 'mongoose';

const ExampleSchema = new Schema({
  name: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

export default ExampleSchema;
EOL

# Create package.json scripts
echo -e "${BLUE}⚙️  Updating package.json...${NC}"
cat > package.json << 'EOL'
{
  "name": "bleujs-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "vitest",
    "build": "tsc",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "bleujs": "latest",
    "@bleujs/core": "latest",
    "@bleujs/ai": "latest",
    "@bleujs/eggs-generator": "latest",
    "express": "^4.21.2",
    "mongoose": "^8.2.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.9",
    "typescript": "^5.3.3",
    "vitest": "^1.2.2",
    "eslint": "^8.56.0",
    "prettier": "^3.2.5"
  }
}
EOL

# Create README
cat > README.md << 'EOL'
# Bleu.js Project

This is a starter project using Bleu.js, an AI-powered framework for building intelligent applications.

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Run tests:
   ```bash
   pnpm test
   ```

## Features

- AI-powered decision making
- Deep learning capabilities
- Egg generation system
- Express.js integration
- MongoDB support
- TypeScript support

## Documentation

Visit [Bleu.js Documentation](https://bleujs.dev) for more information.
EOL

# Install dependencies
echo -e "${BLUE}📥 Installing project dependencies...${NC}"
pnpm install

echo -e "\n${GREEN}✨ Installation complete!${NC}"
echo -e "\nNext steps:"
echo -e "1. cd bleujs-project"
echo -e "2. pnpm dev"
echo -e "3. Visit http://localhost:3000/health"
echo -e "\n${BLUE}Happy coding! 🚀${NC}"
