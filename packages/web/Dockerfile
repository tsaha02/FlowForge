# Use Node.js 18-alpine for building the frontend
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy the web package files
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY public ./public
COPY stores ./stores
COPY types ./types
COPY next.config.ts ./
COPY postcss.config.mjs ./

# Install dependencies and build Next.js
RUN npm install
RUN npm run build

# Use a lean production image
FROM node:18-alpine
WORKDIR /app

# Copy over the built files and production dependencies
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Install only production dependencies
RUN npm install --omit=dev

# Expose the frontend port
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
