# Client Dashboard Frontend

A modern Next.js 14 frontend application for managing clients, users, and Amazon SP-API/Ads configurations.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS** for styling
- **React Query (TanStack Query)** for data fetching
- **Axios** for API calls
- **React Hook Form** for form management
- **Zod** for validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Features

- ✅ User authentication (Login/Signup)
- ✅ JWT token management with automatic refresh
- ✅ Dashboard with analytics overview
- ✅ Client management (List, Create, View, Edit)
- ✅ User management
- ✅ Ads configuration management
- ✅ Marketplace configuration management
- ✅ Global search
- ✅ Responsive design
- ✅ Modern UI with TailwindCSS

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── login/        # Login page
│   │   └── signup/       # Signup page
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   └── layout/      # Layout components
│   ├── contexts/        # React contexts (Auth)
│   ├── services/        # API service functions
│   ├── lib/            # Utilities
│   └── types/          # TypeScript types
├── package.json
└── tsconfig.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:4000/api)

## Authentication

The app uses JWT tokens stored in localStorage:
- `accessToken` - Short-lived access token
- `refreshToken` - Long-lived refresh token

Tokens are automatically refreshed when the access token expires.

## API Integration

All API calls are handled through the service layer in `src/services/api.ts`. The axios instance in `src/lib/api.ts` includes:
- Automatic token injection
- Token refresh on 401 errors
- Error handling




