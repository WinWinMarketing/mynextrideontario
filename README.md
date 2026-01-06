# My Next Ride Ontario

A modern lead generation application for vehicle financing in Ontario. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Public Landing Page**: Dark blue hero with animated loading screen, how-it-works section, credit profiles, and simple service area city list
- **Application Form**: 3-step streamlined form with validation and driver's license upload
- **Admin Dashboard**: Professional left-sidebar dashboard with real-time updates (15s polling), analytics graphs, and lead management
- **AWS S3 Integration**: Secure storage for lead data and driver's license images
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
SES_FROM_EMAIL=testing@winwinmarketingtesting2.com
SES_TO_EMAIL=winwinmarketingcanada@gmail.com
NEXT_PUBLIC_SITE_URL=https://winwinmarketingtesting2.com
```

### Optional (Client-side)

```
# Not required - maps have been replaced with simple city list
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Admin Credentials

- **Password**: `WINWIN04` (hardcoded in `src/lib/config.ts`)
- **Email Recipient**: `winwinmarketingcanada@gmail.com` (hardcoded in `src/lib/email.ts`)

## Lead Status Options

The admin dashboard uses 5 statuses (matching your requirements):

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
- Simple grid layout - no complex maps needed

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

The app auto-deploys to Vercel on push to `main`. 

**Important**: Make sure to add all environment variables in Vercel's dashboard before deploying.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── apply/page.tsx           # 4-step application form
│   ├── admin/
│   │   ├── page.tsx             # Admin login
│   │   └── AdminDashboard.tsx   # Dashboard with leads/showcase/settings
│   └── api/
│       ├── submit-lead/         # Form submission
│       ├── showcase/            # Public showcase vehicles
│       └── admin/               # Admin endpoints (leads, settings, showcase)
├── components/
│   ├── ui/                      # Reusable UI components
│   ├── LoadingScreen.tsx        # Animated intro
│   ├── ServiceArea.tsx          # Simple service area city list
│   └── ShowcaseSection.tsx      # Vehicle carousel
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

All files use signed URLs for secure access.

## Security

- All secrets are server-side only
- S3 bucket has Block Public Access enabled
- Driver's license images use 5-minute signed URLs
- Admin sessions use secure HTTP-only cookies
- No secrets in client bundles
