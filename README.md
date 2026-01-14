# My Next Ride Ontario

A modern lead generation application for vehicle financing in Ontario. Built with Next.js 14, TypeScript, and Tailwind CSS.

**Live Site**: https://mynextrideontario.ca

## Features

- **Public Landing Page**: Dark blue hero with animated loading screen, how-it-works section, credit profiles, and simple service area city list
- **Application Form**: 3-step streamlined form with validation and driver's license upload
- **Admin Dashboard**: Professional left-sidebar dashboard with real-time updates, analytics graphs, and lead management
- **Email Templates**: Create, edit, and manage custom email templates with variable substitution
- **AWS S3 Integration**: Secure storage for lead data and driver's license images (5GB capacity for 2+ years)
- **Email System**: 100% manual email control via AWS SES with failure tracking and activity logging

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3
- **Animation**: Framer Motion
- **Form Handling**: React Hook Form + Zod
- **Storage**: AWS S3 (SDK v3)
- **Email**: AWS SES
- **Auth**: JWT with jose

## Environment Variables

Configure these in your Vercel dashboard under Settings → Environment Variables:

### Required (Server-side)

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
LEADS_BUCKET_NAME=martin-leads
SES_FROM_EMAIL=info@mynextrideontario.ca
SES_TO_EMAIL=winwinmarketingcanada@gmail.com
ADMIN_PASSWORD=your_secure_password
SESSION_SECRET=your_random_32_char_secret
NEXT_PUBLIC_SITE_URL=https://mynextrideontario.ca
```

### Optional (Client-side)

```
# Not required - maps have been replaced with simple city list
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Admin Credentials

- **Password**: Set via `ADMIN_PASSWORD` environment variable (default: `WINWIN04` for development only)
- **Email Recipient**: Set via `SES_TO_EMAIL` environment variable

**IMPORTANT**: Change the default password in production by setting the `ADMIN_PASSWORD` environment variable in Vercel.

## Lead Status Options

The admin dashboard uses 5 statuses:

1. **New Lead** - Fresh applications
2. **Working** - Being processed
3. **Circle Back** - Follow up later
4. **Approval** - Approved for financing
5. **Dead Lead** - Closed (with reason dropdown)

Dead lead reasons include: Declined, Negative Equity, No longer interested, Already Purchased, No Vehicle of Interest, Cannot Afford Payment, Too Far to Visit

## Service Area

A clean, simple city list shows our coverage:
- **Green checkmarks**: 16 cities we serve (Toronto, Mississauga, Vaughan, Markham, Richmond Hill, Aurora, Newmarket, Pickering, Ajax, Whitby, Oshawa, Oakville, Burlington, and more)
- **Red X**: Cities we don't currently service (Brampton)

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local with the variables above

# Run development server
npm run dev

# Open http://localhost:3000
```

## Deployment

### 1. GitHub Setup
Push to your GitHub repository:
```bash
git add .
git commit -m "Update for production deployment"
git push origin main
```

### 2. Vercel Setup
1. Go to [Vercel Dashboard](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Settings → Environment Variables
4. Deploy

### 3. Domain Setup (GoDaddy → Vercel)

1. **In Vercel**: Go to Project Settings → Domains → Add `mynextrideontario.ca`
2. **In GoDaddy DNS Settings**, add these records:
   - **A Record**: `@` → `76.76.21.21` (Vercel IP)
   - **CNAME Record**: `www` → `cname.vercel-dns.com`
3. Wait 24-48 hours for DNS propagation

### 4. Email Setup (info@mynextrideontario.ca)

To create info@mynextrideontario.ca with Google Workspace:
1. Go to [Google Workspace](https://workspace.google.com) and sign up
2. Verify domain ownership by adding TXT record in GoDaddy
3. Add MX records in GoDaddy DNS:
   - MX 1: `aspmx.l.google.com`
   - MX 5: `alt1.aspmx.l.google.com`
   - MX 5: `alt2.aspmx.l.google.com`
   - MX 10: `alt3.aspmx.l.google.com`
   - MX 10: `alt4.aspmx.l.google.com`
4. Create user `info@mynextrideontario.ca` in Google Admin Console

### 5. AWS SES Setup for Sending Emails

1. Verify `mynextrideontario.ca` domain in AWS SES
2. Add these DNS records in GoDaddy (provided by SES):
   - DKIM records (3 CNAME records)
   - SPF record (TXT): `v=spf1 include:amazonses.com ~all`
   - DMARC record (TXT): `v=DMARC1; p=quarantine; rua=mailto:info@mynextrideontario.ca`
3. Request production access in SES console
4. Update `SES_FROM_EMAIL` to `info@mynextrideontario.ca`

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── apply/page.tsx           # Application form
│   ├── admin/
│   │   ├── page.tsx             # Admin login
│   │   └── AdminDashboard.tsx   # Dashboard with leads/templates/settings
│   └── api/
│       ├── submit-lead/         # Form submission
│       ├── showcase/            # Public showcase vehicles
│       └── admin/               # Admin endpoints (leads, settings, templates)
├── components/
│   ├── ui/                      # Reusable UI components
│   ├── LoadingScreen.tsx        # Animated intro
│   └── ServiceArea.tsx          # Simple service area city list
└── lib/
    ├── auth.ts                  # JWT authentication
    ├── email.ts                 # AWS SES integration
    ├── s3.ts                    # AWS S3 operations
    ├── config.ts                # Configuration
    ├── utils.ts                 # Helper functions
    └── validation.ts            # Zod schemas
```

## Lead Storage

- **Leads**: `leads/YYYY/MM/timestamp-id.json`
- **Driver's Licenses**: `drivers-licenses/id.ext`
- **Showcase Images**: `showcase-images/id.ext`
- **Settings**: `settings/email-settings.json`
- **Email Templates**: `settings/email-templates.json`

All files use signed URLs for secure access.

## Security

- All secrets are server-side only (never exposed to client)
- S3 bucket has Block Public Access enabled
- Driver's license images use 5-minute signed URLs
- Admin sessions use secure HTTP-only cookies
- Rate limiting on login endpoint (brute force protection)
- No secrets in client bundles

## AWS S3 Bucket Policy (Recommended)

For additional security, apply this bucket policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DenyPublicAccess",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::martin-leads/*",
            "Condition": {
                "Bool": {
                    "aws:SecureTransport": "false"
                }
            }
        }
    ]
}
```

Also ensure:
- Block all public access is ENABLED
- Server-side encryption is ENABLED (AES-256)
- Versioning is ENABLED (for data recovery)
