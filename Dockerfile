# 1. Use a lightweight Node.js image
FROM node:18-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy ONLY the server package configuration first (better caching)
COPY server/package.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the server code
COPY server/ ./

# 6. Generate the Prisma Client
RUN npx prisma generate

# 7. Expose the port
ENV PORT=3001
EXPOSE 3001

# 8. Start the app (Initialize DB -> Start Server)
CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
