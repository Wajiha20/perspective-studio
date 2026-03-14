# Perspective Studio

Perspective Studio is a transcript reasoning workspace built with **Next.js and Ollama**.  
It analyzes conversations from multiple viewpoints and presents structured insights using three perspectives:

- **Optimist**
- **Pessimist**
- **Moderator**

The goal of the tool is to help users better understand discussions, disagreements, and missing evidence within transcripts.

---

## Features

- Paste any transcript (meeting, interview, customer call, etc.)
- Ask a question about the transcript
- Generate three reasoning perspectives:
  - Optimist interpretation
  - Pessimist interpretation
  - Moderator synthesis
- Switch between answers using horizontal result tabs
- Suggested questions based on transcript context
- Debate history stored locally in the browser

---

## Tech Stack

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Ollama (local LLM inference)**

---

## Running the Project Locally

### 1. Install Ollama

Download Ollama from:

https://ollama.com

---

### 2. Start Ollama

Run:

```bash
ollama serve
```

---

### 3. Pull the required model

```bash
ollama pull llama3.2:3b
```

---

### 4. Navigate to the project folder

```bash
cd transcript-debate-app
```

---

### 5. Install dependencies

```bash
npm install
```

---

### 6. Start the development server

```bash
npm run dev
```

---

### 7. Open the application

```
http://localhost:3000
```

---

## Project Structure

```
app
 ├── api
 │   └── analyze
 │        └── route.ts
 ├── page.tsx
public
package.json
README.md
```

---

## Notes

- The application runs **fully locally** using Ollama for inference.
- The model used for analysis is **llama3.2:3b**.
- Debate history is stored in the browser using **localStorage**.

---

## Future Improvements

- Export debate results (PDF / Markdown)
- Shareable debate links
- Speaker sentiment analysis
- Multi-transcript comparison
