# Use Node.js 18-alpine as the base image for a small footprint
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy the server package files
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY src ./src

# Install dependencies and build the server
RUN npm install
RUN npm run build

# Use a lean production image
FROM node:18-alpine
WORKDIR /app

# Copy over the built files and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Copy Prisma schema for production migrations
COPY src/prisma ./src/prisma

# Install only production dependencies
RUN npm install --omit=dev

# Generate Prisma client for the production environment
RUN npx prisma generate --schema=./src/prisma/schema.prisma

# Expose the API port
EXPOSE 4000

# Start the server
CMD ["npm", "start"]
