#!/bin/bash

# Build the project
echo "Building project..."
pnpm build

# Deploy to Netlify
echo "Deploying to Netlify..."
pnpm netlify deploy --prod

echo "Deployment complete! Your site will be available at:"
echo "- Main site: https://bleujs.org"
echo "- Signup page: https://bleujs.org/signup"
echo "- Signin page: https://bleujs.org/signin" 