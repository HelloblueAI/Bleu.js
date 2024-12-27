# Base image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy all backend files
COPY backend .

# Expose the application port
EXPOSE 3000

# Set the entry point for the application
CMD ["node", "index.js"]
