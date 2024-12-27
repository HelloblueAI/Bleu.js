FROM node:20

WORKDIR /usr/src/app

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package.json and pnpm-lock.yaml
COPY backend/package*.json backend/pnpm-lock.yaml* ./

# Install dependencies without freezing the lockfile
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the app
COPY backend .

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
