FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source code
COPY ./src ./src

# Set environment variables (optional)
ENV NODE_ENV=production

# Start the app
CMD ["npm", "start"]