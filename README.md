# My Next Ride Ontario

A modern lead generation and CRM pipeline application for vehicle financing in Ontario. Built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Quick Deploy to Vercel

### Step 1: Push to GitHub
```bash
# Navigate to project folder
cd mynextrideontario

# Add all changes
git add .

# Commit with a message
git commit -m "Your commit message here"

# Push to GitHub (triggers Vercel deployment)
git push origin main
```

### Step 2: Vercel Auto-Deploys
Once you push to `main`, Vercel automatically:
1. Detects the new commit
2. Builds the Next.js app
3. Deploys to production

**Live Site**: Your changes will appear at your Vercel domain (e.g., `winwinmarketingtesting2.com`) in ~2-3 minutes.

### Step 3: Check Deployment Status
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Find your project
- Check the "Deployments" tab for build status

---

## 📋 Full Deployment Checklist

### First-Time Setup

1. **Connect GitHub to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo: `WinWinMarketing/mynextrideontario`
   - Vercel auto-detects Next.js settings

2. **Set Environment Variables** (in Vercel Dashboard → Settings → Environment Variables):

   ```
   # AWS (Required)
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   LEADS_BUCKET_NAME=martin-leads
   
   # Email (Required)
   MAILGUN_API_KEY=your_mailgun_api_key
   MAILGUN_DOMAIN=your-domain.mailgun.org
   
   # Google Maps (Required for map features)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

3. **Connect Custom Domain** (optional):
   - Go to Project Settings → Domains
   - Add your domain (e.g., `winwinmarketingtesting2.com`)
   - Update DNS records as instructed

### Everyday Deployment

```bash
# Make your changes, then:
git add .
git commit -m "feat: description of changes"
git push origin main

# Done! Vercel deploys automatically.
```

---

## ✨ Features

### Public Site
- **Landing Page**: Dark blue hero with animated loading, how-it-works section, credit profiles
- **Application Form**: 4-step form with validation, driver's license upload
- **Service Area Map**: Google Maps showing covered cities

### Admin Dashboard (`/admin`)
- **Visual Pipeline Builder**: Drag-and-drop workflow designer
- **Lead Management**: Kanban-style lead tracking with 5 statuses
- **Multi-Channel Communication**: SMS reminders, email templates
- **Schema-First Architecture**: Robust workflow presets with tutorials
- **Cloud Sync**: Profiles save to AWS S3

### Pipeline Features (New!)
- **Sleek Edge Styling**: Muted, minimal arrow colors that clearly show flow paths
- **Auto-Layout**: Dead leads on left, success flow to right
- **Tutorial Popups**: Step-by-step guides next to preset buttons
- **Profile Persistence**: Saves to both localStorage and S3

---

## 🔐 Admin Access

- **URL**: `/admin`
- **Password**: `WINWIN04`
- **Email Recipient**: `winwinmarketingcanada@gmail.com`

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Create .env.local with environment variables
# (copy from Vercel dashboard)

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── apply/page.tsx              # Application form
│   ├── admin/
│   │   ├── page.tsx                # Admin login
│   │   ├── AdminDashboard.tsx      # Main dashboard
│   │   └── pipeline/               # Visual pipeline builder
│   │       ├── index.tsx           # Pipeline canvas
│   │       ├── types.ts            # TypeScript types
│   │       ├── schemaPresets.ts    # Workflow presets
│   │       └── schemaRuntime.ts    # Layout engine
│   └── api/
│       ├── submit-lead/            # Form submission
│       └── admin/
│           ├── leads/              # Lead CRUD
│           └── workflows/          # Pipeline save/load
├── components/
│   ├── ui/                         # Reusable UI components
│   ├── LoadingScreen.tsx           # Animated intro
│   └── GoogleMap.tsx               # Service area map
└── lib/
    ├── auth.ts                     # JWT authentication
    ├── email.ts                    # Mailgun integration
    ├── s3.ts                       # AWS S3 operations
    └── validation.ts               # Zod schemas
```

---

## 🗄️ Data Storage

All data stored in AWS S3:
- **Leads**: `leads/YYYY/MM/timestamp-id.json`
- **Driver's Licenses**: `drivers-licenses/id.ext`
- **Workflows**: `settings/workflows/profile-id.json`
- **Settings**: `settings/email-settings.json`

---

## 🔒 Security

- Server-side secrets only (no client exposure)
- S3 bucket has Block Public Access enabled
- Images use 5-minute signed URLs
- HTTP-only secure cookies for sessions
- JWT authentication

---

## 📞 Support

For issues or questions, check:
1. Vercel deployment logs
2. Browser console for client errors
3. Network tab for API errors

---

## 🎯 Quick Reference: Git Commands

```bash
# Check what files changed
git status

# See the diff
git diff

# Stage all changes
git add .

# Commit
git commit -m "Your message"

# Push (deploys to Vercel)
git push origin main

# Pull latest from remote
git pull origin main

# If you need to force push (careful!)
git push origin main --force
```

---

Made with ❤️ by WinWin Marketing
