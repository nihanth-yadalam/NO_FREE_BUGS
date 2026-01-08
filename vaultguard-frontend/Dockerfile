FROM node:22-alpine

# Install bun
RUN apk add --no-cache curl bash && \
    curl -fsSL https://bun.sh/install | bash && \
    ln -s /root/.bun/bin/bun /usr/local/bin/bun

WORKDIR /app

# Install dependencies
COPY package*.json bun.lockb ./
RUN bun install

# Copy source
COPY . .

# Vite default port
EXPOSE 5173

# Essential: --host allows the container to expose the port to your laptop
CMD ["bun", "run", "dev", "--", "--host"]
