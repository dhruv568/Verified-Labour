# Verified Labour — Production VPS Deployment Guide

This guide provides end-to-end instructions for deploying **Verified Labour** onto your Ubuntu/Debian Linux VPS with **OpenLiteSpeed (OLS)** and **PM2**.

---

## ⚠️ Critical Rule: Multi-App VPS Safety & Port Isolation

Your VPS currently runs another critical live application:
- **EduConnects**: Located at `/usr/local/lsws/Example/html/educonnects` running on **Port 3000**.

> [!CAUTION]
> **NEVER touch, modify, stop, or overwrite the EduConnects directory or Port 3000.**
> - **Verified Labour** directory: `/var/www/verifiedlabour`
> - **Verified Labour** internal Node.js port: **Port 3001**
> - All PM2 commands, reverse proxies, and scripts must strictly isolate Verified Labour to Port 3001.

| Application | Server Directory | Internal Port | Process Manager Name | Web Server / Proxy |
| :--- | :--- | :--- | :--- | :--- |
| **EduConnects** | `/usr/local/lsws/Example/html/educonnects` | **3000** | `educonnects` | OpenLiteSpeed Port 3000 context |
| **Verified Labour** | `/var/www/verifiedlabour` | **3001** | `verified-labour` | OpenLiteSpeed Port 3001 proxy |

---

## 1. Prerequisites on VPS

Ensure the following are installed and running on the VPS:
- **Node.js**: v18.x or v20.x LTS (`node -v`)
- **npm**: v9.x or v10.x (`npm -v`)
- **PM2**: Global process manager (`pm2 -v` — install via `npm install -g pm2` if missing)
- **Git**: (`git --version`)
- **OpenLiteSpeed**: Running web server

---

## 2. Step-by-Step Initial Deployment

### Step 2.1 — Create Application Directory
Run as root or sudo user on the VPS:
```bash
sudo mkdir -p /var/www/verifiedlabour
sudo chown -R $USER:$USER /var/www/verifiedlabour
cd /var/www/verifiedlabour
```

### Step 2.2 — Clone the Repository
```bash
git clone https://github.com/dhruv568/Verified-Labour.git .
```

### Step 2.3 — Configure Environment Variables
Copy the template and edit your production secrets:
```bash
cp .env.example .env
nano .env
```
Ensure the following variables are set:
```env
PORT=3001
NEXT_PUBLIC_APP_URL="https://verifiedlabour.com"

# Database Configuration (PostgreSQL recommended for production)
DATABASE_URL="postgresql://postgres:<your_password>@localhost:5432/verifiedlabour?schema=public"
# Or SQLite if starting with embedded database:
# DATABASE_URL="file:./prod.db"

# Security (Generate using: openssl rand -base64 48)
JWT_SECRET="<generate_secure_random_string_min_32_characters>"

# Payment & Verification Gateways
CASHFREE_ENVIRONMENT="production"
CASHFREE_CLIENT_ID="<your_live_cashfree_client_id>"
CASHFREE_CLIENT_SECRET="<your_live_cashfree_client_secret>"

RAZORPAY_KEY_ID="<your_live_razorpay_key_id>"
RAZORPAY_KEY_SECRET="<your_live_razorpay_key_secret>"
RAZORPAY_WEBHOOK_SECRET="<your_live_razorpay_webhook_secret>"
```

### Step 2.4 — Install Dependencies
```bash
npm ci --omit=dev
# Or if package-lock is updating:
npm install --production=false
```

### Step 2.5 — Prisma Client & Database Migration
Generate Prisma client and push/migrate your schema:
```bash
npx prisma generate
npx prisma db push

# (Optional) Seed initial blueprint categories & default admin:
node scripts/seed.js
```

### Step 2.6 — Build Next.js Production Bundle
```bash
npm run build
```

### Step 2.7 — Start Application with PM2
Launch the app using the included `ecosystem.config.js` which is hardcoded to port 3001:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Verify that the process is running on port 3001:
```bash
pm2 status
curl -I http://127.0.0.1:3001
```

---

## 3. OpenLiteSpeed (OLS) Web Server Configuration

To route incoming traffic for your domain (e.g. `verifiedlabour.com`) to `http://127.0.0.1:3001` without affecting EduConnects:

### Step 3.1 — Access OpenLiteSpeed WebAdmin Console
Open `https://<YOUR_VPS_IP>:7080` in your browser.

### Step 3.2 — Create an External Application (Proxy)
1. Go to **Server Configuration** ➔ **External App**.
2. Click **+ Add**.
3. Select Type: **Web Server**.
4. Set:
   - **Name**: `verifiedlabour_node`
   - **Address**: `127.0.0.1:3001`
   - **Max Connections**: `100`
   - **Initial Request Timeout (secs)**: `60`
   - **Retry Timeout (secs)**: `0`
   - **Response Buffering**: `No`
5. Click **Save**.

### Step 3.3 — Create a Dedicated Virtual Host
1. Go to **Virtual Hosts** ➔ click **+ Add**.
2. Set:
   - **Virtual Host Name**: `VerifiedLabour`
   - **Virtual Host Root**: `/var/www/verifiedlabour`
   - **Config File**: `$SERVER_ROOT/conf/vhosts/VerifiedLabour/vhconf.conf`
   - **Restrained**: `Yes`
3. Click **Save** and click **Create** if prompted for the missing config file.

### Step 3.4 — Configure Context (Reverse Proxy) in Virtual Host
1. Open the newly created **VerifiedLabour** Virtual Host.
2. Go to the **Context** tab.
3. Click **+ Add**.
4. Select Type: **Proxy**.
5. Set:
   - **URI**: `/`
   - **Web Server**: `[Server Level]: verifiedlabour_node`
   - **Header Operations**:
     ```
     Upgrade $http_upgrade
     Connection $connection_upgrade
     Host $host
     X-Real-IP $remote_addr
     X-Forwarded-For $proxy_add_x_forwarded_for
     X-Forwarded-Proto $scheme
     ```
6. Click **Save**.

### Step 3.5 — Map Domain in Listeners
1. Go to **Listeners** ➔ open the **HTTPS (Port 443)** listener (and **HTTP 80** listener).
2. Under **Virtual Host Mappings**, click **+ Add**.
3. Set:
   - **Virtual Host**: `VerifiedLabour`
   - **Domains**: `verifiedlabour.com, www.verifiedlabour.com`
4. Click **Save**.

### Step 3.6 — Graceful Restart of OpenLiteSpeed
Click the green **Graceful Restart** button in the top right of the OLS WebAdmin console.
> Graceful restart does NOT drop existing connections or interrupt EduConnects.

---

## 4. Post-Deployment Verification Checklist

Run these checks on the VPS to ensure complete safety and isolation:

- [ ] **Check Verified Labour**:
  ```bash
  curl -I http://127.0.0.1:3001
  # Expected: HTTP/1.1 200 OK (or 307/308 redirect)
  ```
- [ ] **Check EduConnects (Untouched Verification)**:
  ```bash
  curl -I http://127.0.0.1:3000
  # Expected: HTTP/1.1 200 OK
  ```
- [ ] **PM2 List Check**:
  ```bash
  pm2 list
  # You should see both 'educonnects' and 'verified-labour' online side by side.
  ```
- [ ] **Domain Check**:
  Visit `https://verifiedlabour.com` in your browser. Verify the homepage loads with all categories, images, and features.

---

## 5. Ongoing Updates & Redeployment

Whenever you push new changes to GitHub, update the VPS using these simple commands:

```bash
cd /var/www/verifiedlabour
git pull origin main
npm ci --omit=dev
npx prisma generate
npx prisma db push
npm run build
pm2 reload verified-labour
```
*Zero downtime: `pm2 reload` seamlessly reloads cluster instances one by one.*
