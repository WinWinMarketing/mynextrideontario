# My Next Ride Ontario

A modern lead generation application for vehicle financing in Ontario. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- **Public Landing Page**: Modern, animated landing page with value proposition, how-it-works section, credit profiles info, and Google Maps service area
- **Application Form**: Multi-step form with validation for vehicle preferences, personal info, trade-in details, and driver's license upload
- **Admin Dashboard**: Secure dashboard for managing leads with status tracking, notes, and driver's license viewing
- **AWS S3 Integration**: Secure storage for lead data and driver's license images
- **Email Notifications**: Automated email alerts for new applications via Resend

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion
- **Form Handling**: React Hook Form + Zod
- **Storage**: AWS S3 (SDK v3)
- **Email**: Resend
- **Auth**: JWT with jose

## Environment Variables

Configure these in your Vercel dashboard:

### Backend Only (Server-side)

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 |
| `AWS_REGION` | AWS region (default: us-east-1) |
| `LEADS_BUCKET_NAME` | S3 bucket name for leads |
| `EMAIL_PROVIDER_API_KEY` | Resend API key |
| `EMAIL_FROM_NAME` | Sender name for emails |
| `EMAIL_FROM_ADDRESS` | Sender email address |
| `EMAIL_TO_ADDRESS` | Where lead notifications are sent |
| `ADMIN_PASSWORD` | Password for admin login |
| `SESSION_SECRET` | Secret for signing session tokens (32+ chars) |

### Public (Client-side)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── apply/
│   │   └── page.tsx            # Application form
│   ├── admin/
│   │   ├── page.tsx            # Admin login/dashboard
│   │   └── AdminDashboard.tsx  # Dashboard component
│   └── api/
│       ├── submit-lead/        # Lead submission endpoint
│       └── admin/
│           ├── login/          # Admin authentication
│           ├── logout/         # Admin logout
│           └── leads/          # Lead CRUD operations
├── components/
│   ├── ui/                     # Reusable UI components
│   ├── LoadingScreen.tsx       # Initial loading animation
│   └── GoogleMap.tsx           # Service area map
└── lib/
    ├── auth.ts                 # Authentication utilities
    ├── email.ts                # Email sending
    ├── s3.ts                   # AWS S3 operations
    ├── utils.ts                # Helper functions
    └── validation.ts           # Zod schemas & types
```

## Lead Storage Model

Leads are stored in S3 as JSON files:
- Path: `leads/YYYY/MM/timestamp-id.json`
- Driver's licenses: `drivers-licenses/id.ext`

## Admin Authentication

- Single password-based authentication
- JWT session stored in HTTP-only cookie
- 24-hour session expiration
- All admin routes protected server-side

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

## Deployment

The app auto-deploys to Vercel on push to `main`. Ensure all environment variables are configured in your Vercel project settings.

## Security Notes

- All secrets are server-side only (except Google Maps API key)
- S3 bucket should have Block Public Access enabled
- Driver's license images are accessed via short-lived signed URLs
- Admin sessions use secure, HTTP-only cookies
