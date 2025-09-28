# TRAILER FIE Frontend

A Next.js 14+ frontend application for browsing movie trailers and discussing them with other users.

## Features

- **Modern UI**: Built with Next.js 14+ App Router, TypeScript, Tailwind CSS, and shadcn/ui
- **Authentication**: Firebase Auth with Google sign-in
- **Movie Data**: Integration with TMDB API (proxied through server routes)
- **Interactive Components**: Carousels, modals, responsive design
- **Real-time Data**: SWR for caching and revalidation

## Tech Stack

- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Framer Motion for animations
- SWR for data fetching
- Firebase Auth
- Embla Carousel

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Configure environment variables in `.env.local`:
- Firebase configuration
- TMDB API key (server-side only)
- Backend API URL

4. Run the development server:
```bash
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_FIREBASE_*`: Firebase client configuration
- `TMDB_API_KEY`: TMDB API key (server-side only)
- `BACKEND_API_BASE_URL`: Django backend URL

## Project Structure

- `/app`: Next.js App Router pages and API routes
- `/components`: Reusable React components
- `/lib`: Utility functions and API clients
- `/public`: Static assets

## API Routes

All TMDB API calls are proxied through Next.js API routes to keep the API key secure:

- `/api/tmdb/trending/*`: Trending movies and TV shows
- `/api/tmdb/movie/*`: Movie details, credits, videos, recommendations
- `/api/tmdb/tv/*`: TV show details and related data
- `/api/tmdb/person/*`: People and celebrity information
- `/api/tmdb/search/*`: Multi-search functionality

## Features

### Home Page
- Hero section with background video/image
- Trending movies (Today/This Week tabs)
- Latest trailers with multiple categories
- What's Popular section
- Free to Watch content
- Newsletter subscription

### Movie/TV Detail Pages
- Full backdrop with movie information
- Poster, title, genres, runtime, user score
- Action buttons (List, Favorite, Watchlist, Play Trailer)
- Cast carousel
- Facts sidebar
- Recommendations

### People Page
- Popular people grid
- Search functionality
- Person detail cards

### Events Page
- List of movie events from Django backend
- Event cards with date, time, location

## Building for Production

```bash
npm run build
npm start
```