# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (needed for build)
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Set NODE_ENV to production for the build process
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application (Uncommented for production builds)
RUN npm run build

# Stage 2: Create the final production image
FROM node:18-alpine

WORKDIR /app

# Set NODE_ENV to production for runtime
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy package files and install ONLY production dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose port 3000
EXPOSE 3000

# Command to run the production server
CMD ["npm", "run", "start", "--", "-p", "3000"]