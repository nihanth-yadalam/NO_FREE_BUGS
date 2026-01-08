# Use a slim version of Node.js
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (better for Docker caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your application code
COPY . .

# The port should match what's in your server.js and docker-compose
EXPOSE 3100

# Start the application
CMD [ "node", "server.js" ]
