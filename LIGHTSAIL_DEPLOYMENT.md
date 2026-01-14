# AWS Lightsail Deployment Guide

Deploy My Next Ride Ontario on AWS Lightsail with Node.js.

## Prerequisites

- AWS Account with Lightsail access
- Domain: mynextrideontario.ca (GoDaddy)
- S3 bucket already configured (martin-leads)
- AWS SES verified for email sending

## Step 1: Create Lightsail Instance

1. Go to [AWS Lightsail Console](https://lightsail.aws.amazon.com)
2. Click **Create instance**
3. Select:
   - Region: `us-east-1` (or closest to your users)
   - Platform: **Linux/Unix**
   - Blueprint: **Node.js** (Latest LTS)
   - Instance plan: **$5/month** (1GB RAM) minimum, **$10/month** (2GB RAM) recommended
4. Name it: `mynextrideontario`
5. Click **Create instance**

## Step 2: Connect to Instance

```bash
# Download SSH key from Lightsail console
# Then connect:
ssh -i ~/path/to/LightsailKey.pem bitnami@YOUR_INSTANCE_IP
```

## Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

## Step 4: Clone and Setup Project

```bash
# Navigate to home directory
cd ~

# Clone the repository
git clone https://github.com/WinWinMarketing/mynextrideontario.git
cd mynextrideontario

# Install dependencies
npm install
```

## Step 5: Create Environment File

```bash
# Create .env.local file
nano .env.local
```

Paste these contents (replace with your actual values):

```
# AWS CREDENTIALS
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1

# S3 BUCKET
LEADS_BUCKET_NAME=martin-leads
AWS_S3_BUCKET=martin-leads

# EMAIL / AWS SES
SES_FROM_EMAIL=info@mynextrideontario.ca
SES_TO_EMAIL=winwinmarketingcanada@gmail.com

# ADMIN AUTH (CHANGE THESE!)
ADMIN_PASSWORD=YourSecurePassword123!
SESSION_SECRET=generate-a-random-32-character-string-here

# SITE CONFIG
NEXT_PUBLIC_SITE_URL=https://mynextrideontario.ca
NEXT_PUBLIC_BASE_URL=https://mynextrideontario.ca
NODE_ENV=production
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

## Step 6: Build the Application

```bash
# Build for production
npm run build
```

## Step 7: Start with PM2

```bash
# Start the application
pm2 start npm --name "mynextrideontario" -- start

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

## Step 8: Setup Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/mynextrideontario
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name mynextrideontario.ca www.mynextrideontario.ca;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/mynextrideontario /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 9: Setup SSL (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d mynextrideontario.ca -d www.mynextrideontario.ca

# Follow the prompts, enter your email, agree to terms
```

Certbot will auto-renew certificates.

## Step 10: Configure Domain DNS (GoDaddy)

In GoDaddy DNS Management, update records:

| Type | Name | Value |
|------|------|-------|
| A | @ | YOUR_LIGHTSAIL_STATIC_IP |
| A | www | YOUR_LIGHTSAIL_STATIC_IP |

**Important**: Create a Static IP in Lightsail and attach it to your instance first!

1. In Lightsail: Networking → Create static IP
2. Attach to your instance
3. Use this IP in DNS records

## Step 11: Open Firewall Ports

In Lightsail Console → Instance → Networking:

Add these rules:
- HTTP (80)
- HTTPS (443)

## Updating the Site

When you need to deploy updates:

```bash
cd ~/mynextrideontario
git pull origin main
npm install
npm run build
pm2 restart mynextrideontario
```

## Useful Commands

```bash
# Check app status
pm2 status

# View logs
pm2 logs mynextrideontario

# Restart app
pm2 restart mynextrideontario

# Check Nginx status
sudo systemctl status nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### App not starting
```bash
pm2 logs mynextrideontario --lines 50
```

### Port 3000 already in use
```bash
pm2 kill
pm2 start npm --name "mynextrideontario" -- start
```

### SSL certificate issues
```bash
sudo certbot renew --dry-run
```

### Check if app is running
```bash
curl http://localhost:3000
```

## Estimated Costs

- Lightsail Instance ($5-10/month)
- Static IP (Free when attached)
- S3 Storage (~$0.50/month for your usage)
- SES Emails (~$0.10 per 1000 emails)

**Total: ~$6-11/month**

