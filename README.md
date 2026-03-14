# Perspective Studio

Perspective Studio is a Next.js app that analyzes transcripts using three perspectives:

- Optimist
- Pessimist
- Moderator

Users can:
- paste their own transcript
- ask a question
- get structured debate-style answers
- view result tabs
- access saved history

## Tech Stack
- Next.js
- React
- TypeScript
- Tailwind CSS
- Ollama

## Run Locally

1. Start Ollama:
   ollama serve

2. Go to the project folder:
   cd transcript-debate-app

3. Start the app:
   npm run dev

4. Open:
   http://localhost:3000

## Notes
- The project uses a local Ollama model for transcript analysis.
- History is stored in browser localStorage.