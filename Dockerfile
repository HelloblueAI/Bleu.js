# Use an official Node.js runtime as a parent image
FROM node:16

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code, including the ESLint configuration
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["node", "core-engine/index.js"]
