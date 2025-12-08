# =============================================================================
# ReadNext Next.js Frontend - Development Dockerfile
# =============================================================================
# Using full node image (not Alpine) for Next.js SWC compatibility
# =============================================================================

FROM node:20-slim

WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json* ./

# Force reinstall to get correct platform binaries
RUN npm ci --force

# Copy application code
COPY . .

# Expose Next.js dev server port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"

# Start development server with hot reloading
CMD ["npm", "run", "dev"]
