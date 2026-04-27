{
  "name": "codecollab-ai",
  "private": true,
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev:web": "npm run dev -w apps/web",
    "dev:api": "npm run dev -w apps/api",
    "dev": "concurrently \"npm run dev:web\" \"npm run dev:api\"",
    "build:api": "npm run build -w apps/api",
    "start:api": "npm run start -w apps/api"
  },
  "devDependencies": {
    "concurrently": "^9.1.2"
  }
}
