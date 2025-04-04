#!/bin/bash

# Build the project
echo "Building project..."
pnpm build

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod --site bleujs.org

echo "Deployment complete!" 