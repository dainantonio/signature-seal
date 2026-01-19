import os
import json
import subprocess

print("🧹 Starting Surgical Cleanup...")

# 1. DEFINE THE CORRECT CONTENT
server_pkg = {
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
    "@prisma/client": "^5.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}

root_pkg = {
  "name": "signature-seal-fullstack",
  "version": "1.0.0",
  "scripts": {
    "start": "echo 'Use npm run server or npm run client'",
    "server": "cd server && npm install && npm start",
    "client": "cd client && npm install && npm run dev",
    "install-all": "npm install && cd server && npm install && cd ../client && npm install"
  },
  "dependencies": {
    "concurrently": "^8.2.0"
  }
}

railway_config = {
  "build": {
    "rootDirectory": "server"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}

# 2. WRITE THE FILES (Force Overwrite)
with open("server/package.json", "w") as f:
    json.dump(server_pkg, f, indent=2)
    print("✅ server/package.json cleaned.")

with open("package.json", "w") as f:
    json.dump(root_pkg, f, indent=2)
    print("✅ Root package.json cleaned.")

with open("railway.json", "w") as f:
    json.dump(railway_config, f, indent=2)
    print("✅ railway.json cleaned.")

# 3. GIT COMMANDS
print("🚀 Pushing to GitHub...")
try:
    subprocess.run(["git", "add", "."], check=True)
    subprocess.run(["git", "commit", "-m", "Fix: Python generated clean JSON files"], check=True)
    subprocess.run(["git", "push"], check=True)
    print("✅ DONE. Code pushed to GitHub.")
except Exception as e:
    print(f"⚠️ Git error (you might need to push manually): {e}")

print("---------------------------------------")
print("Check Railway now. It should see valid JSON.")
print("---------------------------------------")