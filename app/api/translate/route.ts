import { NextResponse } from "next/server";

const MODEL =
  process.env.OPENROUTER_MODEL ??
  process.env.OPENAI_MODEL ??
  "openrouter/auto";

function normalizeOpenRouterUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/chat/completions")) {
    return trimmed;
  }

  if (trimmed.endsWith("/responses")) {
    return `${trimmed.slice(0, -"/responses".length)}/chat/completions`;
  }

  return `${trimmed}/chat/completions`;
}

function resolveOpenRouterUrl() {
  const explicitUrl = process.env.OPENROUTER_API_URL?.trim() ?? process.env.OPENAI_API_URL?.trim();
  if (explicitUrl) {
    return normalizeOpenRouterUrl(explicitUrl);
  }

  const baseUrl =
    process.env.OPENROUTER_BASE_URL?.trim() ??
    process.env.OPENAI_BASE_URL?.trim();
  if (baseUrl) {
    return normalizeOpenRouterUrl(baseUrl);
  }

  return "https://openrouter.ai/api/v1/chat/completions";
}

const OPENROUTER_API_URL = resolveOpenRouterUrl();
const API_KEY = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
const HTTP_REFERER =
  process.env.OPENROUTER_HTTP_REFERER?.trim() ??
  process.env.OPENROUTER_SITE_URL?.trim() ??
  "";
const APP_TITLE =
  process.env.OPENROUTER_TITLE?.trim() ??
  process.env.OPENROUTER_APP_TITLE?.trim() ??
  "English_Learning";

const WORD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "slug",
    "title",
    "phonetics",
    "partOfSpeech",
    "chineseMeaning",
    "englishDefinition",
    "summary",
    "usageLabels",
    "collocations",
    "examples",
  ],
  properties: {
    slug: { type: "string" },
    title: { type: "string" },
    phonetics: {
      type: "object",
      additionalProperties: false,
      required: ["uk", "us"],
      properties: {
        uk: { type: "string" },
        us: { type: "string" },
      },
    },
    partOfSpeech: { type: "string" },
    chineseMeaning: { type: "string" },
    englishDefinition: { type: "string" },
    summary: { type: "string" },
    usageLabels: {
      type: "array",
      items: { type: "string", enum: ["spoken", "neutral", "formal", "academic"] },
      minItems: 1,
      maxItems: 4,
    },
    collocations: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 6,
    },
    examples: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "sentence"],
        properties: {
          label: { type: "string", enum: ["spoken", "neutral", "formal", "academic"] },
          sentence: { type: "string" },
        },
      },
      minItems: 2,
      maxItems: 3,
    },
    similarWords: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["slug", "word", "note"],
        properties: {
          slug: { type: "string" },
          word: { type: "string" },
          note: { type: "string" },
        },
      },
      minItems: 0,
      maxItems: 3,
    },
    memoryAids: {
      type: "object",
      additionalProperties: false,
      properties: {
        etymology: { type: "string" },
        roots: { type: "string" },
        mnemonic: { type: "string" },
      },
    },
    searchAliases: {
      type: "array",
      items: { type: "string" },
      minItems: 0,
      maxItems: 8,
    },
  },
} as const;

const SYSTEM_PROMPT = [
  "You are a precise English-to-Chinese vocabulary tutor for a study website.",
  "Return only JSON that matches the schema exactly.",
  "Use natural Chinese and natural study-friendly English.",
  "Choose the most useful common meaning for the query if the word is polysemous.",
  "Keep the English definition concise.",
  "Make the summary one sentence that explains when to use the word.",
  "Provide common, natural collocations that a learner could actually reuse.",
  "Examples should sound real and not copy the collocations verbatim.",
  "Similar words should focus on common confusions and the key distinction in Chinese.",
  "Memory aids should be short, practical, and easy to remember.",
  "The slug must be lowercase kebab-case.",
].join(" ");

function buildUserPrompt(query: string) {
  return [
    `Generate a structured vocabulary card for: ${query}.`,
    "Return only valid JSON that matches the schema.",
    "Only return one JSON object.",
    "Do not include markdown fences, code blocks, or any explanatory text.",
    "All strings must use standard double quotes.",
    "Never return empty strings ('') for required content fields.",
    "Chinese meaning must be a real Chinese explanation.",
    "English definition must be a real English definition.",
    "Summary must be a single sentence that explains when to use the word.",
    "Collocations must contain at least 2 useful items.",
    "Examples must contain at least 2 natural sentences with non-empty sentence text.",
    "similarWords, memoryAids, and searchAliases are optional, but if included they should contain useful non-empty values.",
    "If you are uncertain, make a reasonable best-effort choice instead of leaving core fields blank.",
  ].join(" ");
}

function buildRepairPrompt(query: string, previousJson: unknown, issues: string[]) {
  return [
    `The previous JSON for: ${query} had incomplete or empty fields.`,
    `Problems: ${issues.join("; ")}`,
    "Fix the JSON and return a complete replacement object.",
    "Return only one valid JSON object.",
    "Do not include markdown fences, code blocks, or explanation text.",
    "All strings must use standard double quotes.",
    "Make sure chineseMeaning, englishDefinition, summary, collocations, and examples are fully populated.",
    "At least 2 collocations and at least 2 non-empty example sentences are required.",
    "similarWords, memoryAids, and searchAliases may be empty or omitted if you are unsure.",
    `Previous JSON: ${JSON.stringify(previousJson)}`,
  ].join(" ");
}

function buildMalformedJsonRepairPrompt(query: string, malformed: string) {
  return [
    `Fix the malformed JSON-like vocabulary output for: ${query}.`,
    "Return only one valid JSON object.",
    "Do not include markdown, code fences, comments, or explanation text.",
    "All keys and strings must use standard double quotes.",
    "Add any missing commas, braces, quotes, or array separators.",
    "Normalize the result to these field names: slug, title, phonetics, partOfSpeech, chineseMeaning, englishDefinition, summary, usageLabels, collocations, examples, similarWords, memoryAids, searchAliases.",
    "If the source uses 'word', map it to 'title'.",
    "If the source uses 'definition', map it to 'englishDefinition'.",
    "Examples must be an array of objects with label and sentence.",
    "similarWords may be an empty array if the source data is weak.",
    "memoryAids may be an empty object or partial object if the source data is weak.",
    `Malformed source: ${malformed}`,
  ].join(" ");
}

type VocabularyCard = {
  slug?: string;
  title?: string;
  word?: string;
  phonetics?: { uk?: string; us?: string } | null;
  partOfSpeech?: string;
  chineseMeaning?: string;
  englishDefinition?: string;
  definition?: string;
  summary?: string;
  usageLabels?: Array<"spoken" | "neutral" | "formal" | "academic">;
  collocations?: string[];
  examples?: Array<{ label?: "spoken" | "neutral" | "formal" | "academic"; sentence?: string; translation?: string } | string>;
  similarWords?: Array<{ slug?: string; word?: string; note?: string; difference?: string } | string>;
  memoryAids?: { etymology?: string; roots?: string; mnemonic?: string; notes?: string[] | string } | string[] | string;
  searchAliases?: string[];
};

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLabel(value: unknown): "spoken" | "neutral" | "formal" | "academic" {
  return value === "spoken" || value === "formal" || value === "academic" ? value : "neutral";
}

function sanitizeCard(card: VocabularyCard, query: string): VocabularyCard {
  const collocations = Array.isArray(card.collocations)
    ? card.collocations.map(trimString).filter(Boolean)
    : [];

  const examples = Array.isArray(card.examples)
    ? card.examples
        .map((item) =>
          typeof item === "string"
            ? {
                label: "neutral" as const,
                sentence: trimString(item),
              }
            : {
                label: normalizeLabel(item?.label),
                sentence: trimString(item?.sentence),
              },
        )
        .filter((item) => item.sentence.length > 0)
    : [];

  const similarWords = Array.isArray(card.similarWords)
    ? card.similarWords
        .map((item) =>
          typeof item === "string"
            ? {
                slug: slugify(item),
                word: trimString(item),
                note: "",
              }
            : {
                slug: trimString(item?.slug) || slugify(trimString(item?.word)),
                word: trimString(item?.word),
                note: trimString(item?.note) || trimString(item?.difference),
              },
        )
        .filter((item) => item.slug.length > 0 && item.word.length > 0 && item.note.length > 0)
    : [];

  const searchAliases = Array.isArray(card.searchAliases)
    ? card.searchAliases.map(trimString).filter(Boolean)
    : [];

  const memoryAids =
    typeof card.memoryAids === "string"
      ? {
          etymology: "",
          roots: "",
          mnemonic: trimString(card.memoryAids),
        }
      : Array.isArray(card.memoryAids)
        ? {
            etymology: "",
            roots: "",
            mnemonic: card.memoryAids.map(trimString).filter(Boolean).join(" "),
          }
        : card.memoryAids
          ? {
              etymology: trimString(card.memoryAids.etymology),
              roots: trimString(card.memoryAids.roots),
              mnemonic:
                trimString(card.memoryAids.mnemonic) ||
                (Array.isArray(card.memoryAids.notes)
                  ? card.memoryAids.notes.map(trimString).filter(Boolean).join(" ")
                  : trimString(card.memoryAids.notes)),
            }
          : undefined;

  return {
    slug: trimString(card.slug) || slugify(trimString(card.title) || trimString(card.word) || query),
    title: trimString(card.title) || trimString(card.word) || query,
    phonetics: {
      uk: trimString(card.phonetics?.uk),
      us: trimString(card.phonetics?.us),
    },
    partOfSpeech: trimString(card.partOfSpeech) || "n.",
    chineseMeaning: trimString(card.chineseMeaning),
    englishDefinition: trimString(card.englishDefinition) || trimString(card.definition),
    summary: trimString(card.summary),
    usageLabels:
      Array.isArray(card.usageLabels) && card.usageLabels.length > 0
        ? card.usageLabels.map((item) => normalizeLabel(item))
        : ["neutral"],
    collocations,
    examples,
    similarWords,
    memoryAids,
    searchAliases,
  };
}

function findCardIssues(card: VocabularyCard) {
  const issues: string[] = [];

  if (!nonEmptyString(card.chineseMeaning)) issues.push("chineseMeaning is empty");
  if (!nonEmptyString(card.englishDefinition)) issues.push("englishDefinition is empty");
  if (!nonEmptyString(card.summary)) issues.push("summary is empty");
  if (!Array.isArray(card.collocations) || card.collocations.length < 2) issues.push("collocations has too few items");
  if (!Array.isArray(card.examples) || card.examples.length < 2) issues.push("examples has too few items");
  if (
    Array.isArray(card.examples) &&
    card.examples.some((item) => (typeof item === "string" ? !nonEmptyString(item) : !nonEmptyString(item?.sentence)))
  ) {
    issues.push("examples contains empty sentences");
  }

  return issues;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractMessageText(payload: {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}) {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (item.type === "text" ? item.text ?? "" : ""))
      .join("")
      .trim() || null;
  }

  return null;
}

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function decodeJsStringEscape(char: string) {
  switch (char) {
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "\t";
    case "b":
      return "\b";
    case "f":
      return "\f";
    case "v":
      return "\v";
    case "\\":
      return "\\";
    case "'":
      return "'";
    case "\"":
      return "\"";
    case "0":
      return "\0";
    default:
      return char;
  }
}

function decodeQuotedChunk(chunk: string) {
  let output = "";
  let escaped = false;

  for (const char of chunk) {
    if (escaped) {
      output += decodeJsStringEscape(char);
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    output += char;
  }

  if (escaped) {
    output += "\\";
  }

  return output;
}

function decodeConcatenatedJsonString(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("'") || !trimmed.includes("' +")) {
    return trimmed;
  }

  const matches = [...trimmed.matchAll(/'((?:\\.|[^'\\])*)'/g)];
  if (matches.length < 2) {
    return trimmed;
  }

  const decoded = matches.map((match) => decodeQuotedChunk(match[1])).join("").trim();
  return decoded || trimmed;
}

function decodeEscapedObjectText(text: string) {
  if (!text.includes("\\\"") && !text.includes("\\n")) {
    return text;
  }

  return decodeQuotedChunk(text).trim();
}

function extractJsonCandidate(text: string) {
  const stripped = decodeEscapedObjectText(decodeConcatenatedJsonString(stripCodeFences(text)));
  const start = stripped.indexOf("{");
  if (start < 0) {
    return stripped;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < stripped.length; index += 1) {
    const char = stripped[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return stripped.slice(start, index + 1).trim();
      }
    }
  }

  return stripped.slice(start).trim();
}

class ModelParseError extends Error {
  rawContent: string;
  candidate: string;
  model: string;
  status: number;

  constructor(message: string, options: { rawContent: string; candidate: string; model: string; status: number }) {
    super(message);
    this.name = "ModelParseError";
    this.rawContent = options.rawContent;
    this.candidate = options.candidate;
    this.model = options.model;
    this.status = options.status;
  }
}

function parseStructuredJson(text: string, context: { model: string; status: number }) {
  const candidate = extractJsonCandidate(text);
  console.info("OpenRouter JSON candidate", {
    model: context.model,
    status: context.status,
    candidate,
  });

  try {
    return JSON.parse(candidate) as unknown;
  } catch (error) {
    console.error("OpenRouter JSON parse failed", {
      ...context,
      error: describeRequestError(error),
      rawText: text,
      candidate,
    });
    throw new ModelParseError(
      `Invalid JSON from model response (status=${context.status}, model=${context.model}): ${describeRequestError(error)}`,
      {
        rawContent: text,
        candidate,
        model: context.model,
        status: context.status,
      },
    );
  }
}

function describeRequestError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unknown request error";
  }

  const segments = [error.message];
  const err = error as Error & {
    code?: string;
    cause?: unknown;
  };

  if (err.code) {
    segments.push(`code=${err.code}`);
  }

  if (err.cause && typeof err.cause === "object") {
    const cause = err.cause as { name?: unknown; message?: unknown; code?: unknown };
    const causeParts = [cause.name, cause.code, cause.message]
      .filter((value) => typeof value === "string" && value.length > 0)
      .join(",");

    if (causeParts) {
      segments.push(`cause=${causeParts}`);
    }
  }

  return segments.join(" | ");
}

async function callOpenRouter(query: string, model: string, previousJson?: unknown, issues?: string[]) {
  const userPrompt = previousJson && issues?.length
    ? buildRepairPrompt(query, previousJson, issues)
    : buildUserPrompt(query);
  const prompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;
  console.info("OpenRouter request prompt", { query, model, prompt });

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(HTTP_REFERER ? { "HTTP-Referer": HTTP_REFERER } : {}),
      ...(APP_TITLE ? { "X-Title": APP_TITLE } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT} Do not wrap the JSON in markdown fences, code blocks, or explanation text.`,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "vocabulary_card",
          strict: true,
          schema: WORD_SCHEMA,
        },
      },
      temperature: 0.2,
    }),
  });

  const rawBody = await response.text();
  console.info("OpenRouter raw body", {
    query,
    model,
    status: response.status,
    rawBody,
  });
  let payload: {
    error?: { message?: string };
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  } = {};

  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    payload = {
      error: {
        message: rawBody.trim() || `OpenAI returned a non-JSON response (status ${response.status}).`,
      },
    };
  }

  if (!response.ok) {
    throw new Error(
      `${payload.error?.message ?? "OpenRouter request failed."} (status=${response.status}, model=${model})`,
    );
  }

  const text = extractMessageText(payload);
  if (!text) {
    console.error("OpenRouter returned an empty assistant message", {
      status: response.status,
      model,
      payload,
    });
    throw new Error(`OpenRouter returned no JSON text. (status=${response.status}, model=${model})`);
  }

  const word = parseStructuredJson(text, { model, status: response.status });
  return word;
}

async function repairMalformedJson(query: string, model: string, malformed: string) {
  const userPrompt = buildMalformedJsonRepairPrompt(query, malformed);
  console.info("OpenRouter malformed JSON repair prompt", { query, model, prompt: userPrompt });

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(HTTP_REFERER ? { "HTTP-Referer": HTTP_REFERER } : {}),
      ...(APP_TITLE ? { "X-Title": APP_TITLE } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You repair malformed JSON into one valid JSON object. Return only JSON. No markdown. No explanation.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0,
    }),
  });

  const rawBody = await response.text();
  console.info("OpenRouter malformed JSON repair raw body", {
    query,
    model,
    status: response.status,
    rawBody,
  });

  let payload: {
    error?: { message?: string };
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  } = {};

  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    payload = {
      error: {
        message: rawBody.trim() || `OpenRouter returned a non-JSON repair response (status ${response.status}).`,
      },
    };
  }

  if (!response.ok) {
    throw new Error(`${payload.error?.message ?? "OpenRouter repair request failed."} (status=${response.status}, model=${model})`);
  }

  const text = extractMessageText(payload);
  if (!text) {
    throw new Error(`OpenRouter returned no repair JSON text. (status=${response.status}, model=${model})`);
  }

  return parseStructuredJson(text, { model, status: response.status });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { query?: string } | null;
  const query = payload?.query?.trim() ?? "";

  if (!query) {
    return NextResponse.json(
      { error: "Missing query." },
      { status: 400 },
    );
  }

  if (!API_KEY) {
    return NextResponse.json(
      {
        error: "Missing OPENROUTER_API_KEY. Configure the server environment before searching.",
      },
      { status: 500 },
    );
  }

  try {
    const primaryModel = MODEL;
    const fallbackModel = "openrouter/auto";
    const attemptModels = primaryModel === fallbackModel ? [primaryModel] : [primaryModel, fallbackModel];

    let rawWord: unknown = null;
    let usedModel = primaryModel;
    let parsedIssues: string[] = [];

    for (const model of attemptModels) {
      try {
        try {
          rawWord = sanitizeCard(await callOpenRouter(query, model) as VocabularyCard, query);
        } catch (error) {
          if (error instanceof ModelParseError) {
            rawWord = sanitizeCard(
              await repairMalformedJson(query, model, error.candidate || error.rawContent) as VocabularyCard,
              query,
            );
          } else {
            throw error;
          }
        }
        parsedIssues = findCardIssues(rawWord as VocabularyCard);
        if (parsedIssues.length > 0) {
          console.warn("OpenRouter returned incomplete card", { query, model, parsedIssues, rawWord });
          const repairedWord = sanitizeCard(
            await callOpenRouter(query, model, rawWord, parsedIssues.slice(0, 8)) as VocabularyCard,
            query,
          );
          const repairIssues = findCardIssues(repairedWord as VocabularyCard);
          if (repairIssues.length > 0) {
            console.error("OpenRouter repair still incomplete", {
              query,
              model,
              repairIssues,
              repairedWord,
            });
            throw new Error(`OpenRouter returned incomplete content after retry: ${repairIssues.join("; ")}`);
          }
          rawWord = repairedWord;
        }
        usedModel = model;
        break;
      } catch (error) {
        const message = describeRequestError(error).toLowerCase();
        const isAvailabilityError =
          message.includes("not available in your region") ||
          message.includes("no model") ||
          message.includes("no provider") ||
          message.includes("model is not available") ||
          message.includes("unavailable");

        if (model !== fallbackModel && isAvailabilityError) {
          continue;
        }

        throw error;
      }
    }

    const structuredWord = rawWord as VocabularyCard;

    const word = {
      slug: structuredWord.slug ?? slugify(structuredWord.title ?? query),
      title: structuredWord.title ?? query,
      phonetics: {
        uk: structuredWord.phonetics?.uk ?? "",
        us: structuredWord.phonetics?.us ?? "",
      },
      partOfSpeech: structuredWord.partOfSpeech ?? "n.",
      chineseMeaning: structuredWord.chineseMeaning ?? "",
      englishDefinition: structuredWord.englishDefinition ?? "",
      summary: structuredWord.summary ?? "",
      usageLabels: structuredWord.usageLabels ?? ["neutral"],
      collocations: structuredWord.collocations ?? [],
      examples: structuredWord.examples ?? [],
      similarWords: structuredWord.similarWords ?? [],
      memoryAids: structuredWord.memoryAids ?? {
        etymology: "",
        roots: "",
        mnemonic: "",
      },
      searchAliases: structuredWord.searchAliases ?? [query],
    };

    return NextResponse.json({
      model: usedModel,
      source: "openrouter",
      word,
    });
  } catch (error) {
    const message = describeRequestError(error);
    console.error("OpenRouter request failed", { query, error: message });
    const debug =
      error instanceof ModelParseError
        ? {
            model: error.model,
            status: error.status,
            rawContent: error.rawContent,
            candidate: error.candidate,
          }
        : undefined;
    return NextResponse.json(
      {
        error: message,
        query,
        debug,
      },
      { status: 500 },
    );
  }
}
