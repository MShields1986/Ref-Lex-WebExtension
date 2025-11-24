# Development Dockerfile for Ref-Lex Extension
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port for any dev servers (if needed later)
EXPOSE 3000

# Default command (can be overridden)
CMD ["npm", "run", "dev"]
