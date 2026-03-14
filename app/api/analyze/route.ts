import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const MODEL = "llama3.2:3b";

async function callOllama(prompt: string, numPredict = 120) {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        num_predict: numPredict,
        temperature: 0.2,
        top_p: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to call Ollama: ${text}`);
  }

  const data = await response.json();
  return (data.response as string).trim();
}

function compactTranscript(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 2500);
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, question } = await req.json();

    if (!transcript || !question) {
      return NextResponse.json(
        { error: "Transcript and question are required." },
        { status: 400 }
      );
    }

    const shortTranscript = compactTranscript(transcript);

    const optimistPrompt = `
You are the Optimist.

Task:
Answer the user's question using the most favorable interpretation that is still supported by the transcript.

Rules:
- Use only evidence from the transcript.
- Answer the question directly.
- Mention speaker names when relevant.
- Do not say "here are bullet points".
- Do not repeat the question.
- If evidence is missing, clearly say what is missing.
- Keep the answer to 1 short paragraph, about 80-120 words.

Transcript:
${shortTranscript}

Question:
${question}
`;

    const pessimistPrompt = `
You are the Pessimist.

Task:
Answer the user's question using the most skeptical interpretation that is still supported by the transcript.

Rules:
- Use only evidence from the transcript.
- Answer the question directly.
- Mention speaker names when relevant.
- Do not say "here are bullet points".
- Do not repeat the question.
- If evidence is missing, clearly say what is missing.
- Keep the answer to 1 short paragraph, about 80-120 words.

Transcript:
${shortTranscript}

Question:
${question}
`;

    const [optimist, pessimist] = await Promise.all([
      callOllama(optimistPrompt, 120),
      callOllama(pessimistPrompt, 120),
    ]);

    const moderatorPrompt = `
You are the Moderator.

Task:
Compare the Optimist and Pessimist answers and give a balanced conclusion.

Return exactly these 4 sections:

Core disagreement:
<1-2 sentences>

What both sides agree on:
<1-2 sentences>

Missing evidence:
<1-2 sentences>

Best overall takeaway:
<2-3 sentences answering the user's question directly>

Rules:
- Stay grounded in the transcript.
- Use only the information provided below.
- Do not invent facts.
- Be clear and practical.

Question:
${question}

Optimist:
${optimist}

Pessimist:
${pessimist}
`;

    const moderator = await callOllama(moderatorPrompt, 160);

    return NextResponse.json({
      optimist,
      pessimist,
      moderator,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze transcript with Ollama.",
      },
      { status: 500 }
    );
  }
}