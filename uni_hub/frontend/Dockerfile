FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all files (most will be overridden by volume mounts in dev mode)
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1

# Development mode by default (can be overridden at runtime)
ENV NODE_ENV development

# Expose port
EXPOSE 3000

# Default command for development
CMD ["npm", "run", "dev", "--", "-p", "3000"]