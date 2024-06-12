FROM node:20

WORKDIR /usr/src/app

# Copy only package.json and package-lock.json initially
COPY package*.json ./

# Perform the pnpm install in a separate step to cache dependencies layer
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of the application code, excluding node_modules
COPY . .

# If there is a build step, add it here
# RUN pnpm run build

CMD ["node", "index.js"]

EXPOSE 3000
