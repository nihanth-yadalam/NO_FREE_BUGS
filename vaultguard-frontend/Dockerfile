FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Vite default port
EXPOSE 5173

# Essential: --host allows the container to expose the port to your laptop
CMD ["npm", "run", "dev", "--", "--host"]
