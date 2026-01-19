import os
import json
import subprocess

print("🚑 Applying Database Wake-Up Fix...")

# 1. FIX THE START COMMAND IN SERVER/PACKAGE.JSON
# The crucial change is adding "npx prisma db push &&" before "node src/index.js"
server_pkg = {
  "name": "server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "npx prisma db push && node src/index.js", 
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

# 2. ENSURE RAILWAY CONFIG POINTS TO SERVER
railway_config = {
  "build": {
    "rootDirectory": "server"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}

# 3. OVERWRITE THE FILES
with open("server/package.json", "w") as f:
    json.dump(server_pkg, f, indent=2)
    print("✅ server/package.json updated: Added DB initialization.")

with open("railway.json", "w") as f:
    json.dump(railway_config, f, indent=2)
    print("✅ railway.json verified.")

# 4. PUSH TO GITHUB
print("🚀 Pushing fix to GitHub...")
try:
    subprocess.run(["git", "add", "."], check=True)
    subprocess.run(["git", "commit", "-m", "Fix: Add DB push to start command to prevent crash"], check=True)
    subprocess.run(["git", "push"], check=True)
    print("✅ DONE. Railway will redeploy automatically.")
    print("👀 Watch the Railway logs: It should now say 'Running prisma db push...'")
except Exception as e:
    print(f"⚠️ Git error (you might need to push manually): {e}")