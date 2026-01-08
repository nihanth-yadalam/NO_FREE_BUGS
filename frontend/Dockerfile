FROM node:20-alpine

WORKDIR /app

# Install deps first (cached layer)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 3000

# Vite dev server
CMD ["npm", "run", "dev"]
