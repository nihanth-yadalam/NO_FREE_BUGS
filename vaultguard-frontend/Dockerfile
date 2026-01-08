# Use Node for building and serving in dev mode
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Vite dev port
EXPOSE 5173

# Run vite with host flag to allow Docker mapping
CMD ["npm", "run", "dev"]
