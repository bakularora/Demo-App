# Base image with Node 18 and Debian (compatible with mediasoup)
FROM node:18-bullseye

# Install required system dependencies for mediasoup
RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip \
  make \
  g++ \
  build-essential \
  linux-headers-amd64 \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files for dependency install step
COPY package*.json ./

# Ensure PYTHON points to python3 for mediasoup builds
ENV PYTHON=python3

# Copy all source files
COPY . .

# Install dependencies
RUN npm install

# Build TypeScript code
RUN npm run build

# Expose the port your app uses (adjust if different)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
