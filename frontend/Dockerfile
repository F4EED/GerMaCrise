FROM node:18-alpine

WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (excluding files in .dockerignore)
COPY src ./src
COPY public ./public
COPY tsconfig.json ./

# Expose port
EXPOSE 3000

# Create .env file at build time (will be overridden by volume mount, so recreate at runtime)
# Start application with script that generates .env file BEFORE npm start compiles
# Désactiver le WebSocket HMR pour éviter les erreurs de connexion
CMD sh -c 'echo "REACT_APP_API_URL=${REACT_APP_API_URL:-http://germacrise-backend:8000}" > .env && echo "REACT_APP_API_URL_EXTERNAL=${REACT_APP_API_URL_EXTERNAL:-http://localhost:8001}" >> .env && echo "FAST_REFRESH=false" >> .env && echo "=== .env file created ===" && cat .env && echo "=== Starting React ===" && npm start'

