# RebelHacks-21
A small full-stack demo project (Next.js client + Express server).

## Prerequisites

- Node.js (v18 or newer recommended)
- npm (comes with Node.js)

## Install dependencies

Open two terminals and run the following commands to install dependencies for each part of the repo.

Client (Next.js):

```bash
cd client
npm install
```

Server (Express):

```bash
cd server
npm install
```

## Environment variables

The client uses Supabase. Create a `.env.local` file inside the `client` folder with the following keys (replace the values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The server does not require any special environment variables by default. It listens on `PORT` (defaults to `3001`).

## Run locally (development)

Start the server first, then the client (use separate terminals):

Server:

```bash
cd server
npm run dev
```

Client:

```bash
cd client
npm run dev
```

The Next.js client typically runs at http://localhost:3000 and the Express server at http://localhost:3001.

To verify the server is running, open:

```
http://localhost:3001/health
```

## Build and start (production-like)

Build the client and run both services:


Client build & start:

```bash
cd client
npm run build
npm run start
```

Server start:

```bash
cd server
npm start
```

