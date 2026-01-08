# Use a lightweight Node.js environment
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy your actual code (server.js)
COPY server.js .

# The bank runs on 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
