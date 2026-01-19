FROM node:18-alpine

# 1. Install OpenSSL (Required for Prisma on Alpine Linux)
RUN apk add --no-cache openssl

WORKDIR /app

# 2. Copy package.json first
COPY server/package.json ./

# 3. CRITICAL FIX: Copy Prisma schema BEFORE npm install
# This allows the postinstall script to find the schema and generate the client
COPY server/prisma ./prisma

# 4. Install dependencies (Triggers 'npx prisma generate')
RUN npm install

# 5. Copy the rest of the backend code
COPY server/ ./

# 6. Safety check: Generate client again to be sure
RUN npx prisma generate

# 7. Environment setup
ENV PORT=3001
EXPOSE 3001

# 8. Start command
# Initialize DB structure on startup, then launch server
CMD ["sh", "-c", "npx prisma db push && node src/index.js"]