import os
import subprocess

print("🚑 Applying Render Docker Fix...")

# 1. DEFINE THE CORRECT DOCKERFILE
# This specifically fixes the order: Copy Schema -> THEN Install -> THEN Copy Code
dockerfile_content = """FROM node:18-alpine

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
CMD ["sh", "-c", "npx prisma db push && node src/index.js"]"""

# 2. WRITE THE FILE
with open("Dockerfile", "w") as f:
    f.write(dockerfile_content)

print("✅ Dockerfile rewritten with correct build order.")

# 3. PUSH TO GITHUB
print("🚀 Pushing to GitHub to trigger Render...")
try:
    subprocess.run(["git", "add", "Dockerfile"], check=True)
    subprocess.run(["git", "commit", "-m", "Fix: Update Dockerfile to copy Prisma schema before install"], check=True)
    subprocess.run(["git", "push"], check=True)
    print("✅ DONE. Go to your Render Dashboard!")
except Exception as e:
    print(f"⚠️ Git error (you might need to push manually): {e}")