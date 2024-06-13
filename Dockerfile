FROM node:20

WORKDIR /usr/src/app

# Copy only package.json and pnpm-lock.yaml initially
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm globally and install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of the application code, excluding node_modules
COPY . .

# If there is a build step, add it here
# RUN pnpm run build

EXPOSE 3000

CMD ["node", "index.js"]
