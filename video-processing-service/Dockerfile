# Stage 1: Build
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build the app
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && apt-get clean

# Set working directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy built app and necessary folders
COPY --from=builder /app/dist ./dist

# Optional: create directories if needed (if your code doesn't already do this)
RUN mkdir -p ./raw-videos ./processed-videos

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "serve"]
