#!/bin/bash

echo "🧠 Performing Root Canal on Project Configuration..."

# 1. REWRITE ROOT PACKAGE.JSON
# We are removing any mention of the 'client'. 
# If Railway runs this file, it will now simply redirect to the server.
echo '{
  "name": "signature-seal-root",
  "version": "1.0.0",
  "scripts": {
    "start": "cd server && npm install && npx prisma db push && node src/index.js",
    "build": "cd server && npm install && npx prisma generate"
  },
  "dependencies": {
    "concurrently": "^8.2.0"
  }
}' > package.json

# 2. ENSURE SERVER PACKAGE.JSON IS CLEAN
echo '{
  "name": "server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "db:push": "npx prisma db push",
    "postinstall": "npx prisma generate"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "prisma": "^5.1.1",
    "@prisma/client": "^5.1.1",
    "resend": "^3.2.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}' > server/package.json

# 3. UPDATE RAILWAY CONFIG
# We tell Railway to just use the Root directory, because we just fixed the Root to be safe.
echo '{
  "build": {
    "rootDirectory": "/"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}' > railway.json

# 4. PUSH TO GITHUB
git add .
git commit -m "Fix: Make Root package.json act as Backend Proxy"
git push

echo "✅ DONE. Check Railway."