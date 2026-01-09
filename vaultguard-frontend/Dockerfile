FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Create non-root user (Alpine uses adduser)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Change ownership of node_modules so appuser can write to .vite-temp
RUN chown -R appuser:appgroup /app/node_modules

COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]