# My Next Ride Ontario

A modern lead generation application for vehicle financing in Ontario. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Public Landing Page**: Dark blue hero with animated loading screen, how-it-works section, credit profiles, and Google Maps service area
- **Application Form**: 4-step form with dropdowns for all selections, validation, and driver's license upload
- **Admin Dashboard**: Professional dashboard with 5 status types, notes, and prominent license viewing
- **AWS S3 Integration**: Secure storage for lead data and driver's license images
- **Email Notifications**: Automated email alerts via Mailgun

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3
- **Animation**: Framer Motion
- **Form Handling**: React Hook Form + Zod
- **Storage**: AWS S3 (SDK v3)
- **Email**: Mailgun
- **Auth**: JWT with jose

## Environment Variables

Configure these in your Vercel dashboard under Settings → Environment Variables:

### Required (Server-side)

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
LEADS_BUCKET_NAME=martin-leads
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your-domain.mailgun.org
```

### Required (Client-side)

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
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

## Map Service Area

The map uses Google Places API to precisely locate and highlight cities:
- **Green circles**: Included cities (Oshawa, Toronto, Markham, Vaughan, etc.)
- **Red circle**: Excluded city (Brampton)
- Click any marker to see if the city is served

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
│   ├── GoogleMap.tsx            # Service area map
│   └── ShowcaseSection.tsx      # Vehicle carousel
└── lib/
    ├── auth.ts                  # JWT authentication
    ├── email.ts                 # Mailgun integration
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
