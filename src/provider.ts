type Provider = "openai" | "gemini" | "groq";

type HelloOutput = {
  ok: true;
  provider: Provider;
  model: string;
  message: string;
};

type GeminiGenerateContent = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const helloGeminiFnc = async (): Promise<HelloOutput> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not set");
  }
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: "Say hello to Gemini!",
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to call Gemini API: ${res.status} ${res.statusText}${errorBody ? ` - ${errorBody}` : ""}`,
    );
  }
  const data = (await res.json()) as GeminiGenerateContent;
  const message =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No message returned";
  return {
    ok: true,
    provider: "gemini",
    model,
    message: String(message).trim(),
  };
};

type GroqAiChatCompletion = {
  choices?: Array<{ message?: { content?: string } }>;
};

const helloGroqFnc = async (): Promise<HelloOutput> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }
  const model = "llama-3.1-8b-instant";
  const url = `https://api.groq.com/openai/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: "Say hello to Groq!",
        },
      ],
      temperature: 0,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to call Groq API: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as GroqAiChatCompletion;
  const message = data?.choices?.[0]?.message?.content ?? "No message returned";
  return {
    ok: true,
    provider: "groq",
    model,
    message: String(message).trim(),
  };
};

const helloOpenAiFnc = async (): Promise<HelloOutput> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const model = "gpt-4o-mini";
  const url = `https://api.openai.com/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "user",
          content: "Say hello to OpenAI!",
        },
      ],
      //   need to add temp
      temperature: 0,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to call OpenAI API: ${res.status} ${res.statusText}`,
    );
  }
  const data = (await res.json()) as GroqAiChatCompletion;
  const message = data?.choices?.[0]?.message?.content ?? "No message returned";
  return {
    ok: true,
    provider: "openai",
    model,
    message: String(message).trim(),
  };
};

export async function selectProvider(): Promise<HelloOutput> {
  const provider = (process.env.PROVIDER || "").toLocaleLowerCase();
  if (provider === "gemini") {
    return await helloGeminiFnc();
  }
  if (provider === "groq") {
    return await helloGroqFnc();
  }
  if (provider === "openai") {
    return await helloOpenAiFnc();
  }
  //   throw new Error(
  //     `Unsupported provider: ${provider}. Supported providers are: openai, gemini, groq`,
  //   );
  if (process.env.GOOGLE_API_KEY) {
    try {
      return await helloGeminiFnc();
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  }
  if (process.env.GROQ_API_KEY) {
    try {
      return await helloGroqFnc();
    } catch (error) {
      console.error("Error calling Groq API:", error);
      throw error;
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      return await helloOpenAiFnc();
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw error;
    }
  }
  if (provider) {
    throw new Error(
      `Unsupported provider: ${provider}. Supported providers are: openai, gemini, groq`,
    );
  }
  throw new Error(`No Provider Configured`);
}
