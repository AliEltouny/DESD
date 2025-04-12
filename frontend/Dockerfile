FROM node:18-alpine

WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json* ./
RUN npm install  # safer for dev

# Copy all other frontend files
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_API_URL=http://localhost:8000/api
ENV NODE_ENV production

# Build the frontend
RUN npm run build

# Expose frontend port
EXPOSE 3000

# Start Next.js app
CMD ["npm", "start"]
