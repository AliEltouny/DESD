##n0ur was here
# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all source files
COPY . .

# Set production environment for optimal build
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Stage 2: Final runtime image
FROM node:18-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Copy only production dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start", "--", "-p", "3000"]
