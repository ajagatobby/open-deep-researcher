import { createFireworks } from "@ai-sdk/fireworks";
import { createOpenAI } from "@ai-sdk/openai";
import {
  extractReasoningMiddleware,
  LanguageModelV1,
  wrapLanguageModel,
} from "ai";
import { getEncoding } from "js-tiktoken";
import { RecursiveCharacterTextSplitter } from "./text-splitter";
import { options } from "@/types";

// Providers
const openai = process.env.OPENAI_KEY
  ? createOpenAI({
      apiKey: process.env.OPENAI_KEY,
      baseURL: process.env.OPENAI_ENDPOINT || "https://api.openai.com/v1",
    })
  : undefined;

const fireworks = process.env.FIREWORKS_KEY
  ? createFireworks({
      apiKey: process.env.FIREWORKS_KEY,
    })
  : undefined;

// Models

const o3MiniModel = openai?.("o3-mini", {
  reasoningEffort: "medium",
});

const gpt4oMini = openai?.("gpt-4o-mini");
const gpt4 = openai?.("gpt-4");

const deepSeekR1Model = fireworks
  ? wrapLanguageModel({
      model: fireworks(
        "accounts/fireworks/models/deepseek-r1"
      ) as LanguageModelV1,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    })
  : undefined;

export function getModel(modelOptions: options): LanguageModelV1 {
  let model;
  switch (modelOptions) {
    case "DEEP_RESEARCH":
      model = gpt4oMini ?? deepSeekR1Model;
      break;
    case "REGULAR":
      model = gpt4;
      break;
    case "THINK":
      model = o3MiniModel;
      break;
    default:
      model = gpt4;
      break;
  }

  if (!model) {
    throw new Error("No model found");
  }

  return model as LanguageModelV1;
}

const MinChunkSize = 140;
const encoder = getEncoding("o200k_base");

// trim prompt to maximum context size
export function trimPrompt(
  prompt: string,
  contextSize = Number(process.env.CONTEXT_SIZE) || 128_000
) {
  if (!prompt) {
    return "";
  }

  const length = encoder.encode(prompt).length;
  if (length <= contextSize) {
    return prompt;
  }

  const overflowTokens = length - contextSize;
  const chunkSize = prompt.length - overflowTokens * 3;
  if (chunkSize < MinChunkSize) {
    return prompt.slice(0, MinChunkSize);
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: 0,
  });
  const trimmedPrompt = splitter.splitText(prompt)[0] ?? "";

  if (trimmedPrompt.length === prompt.length) {
    return trimPrompt(prompt.slice(0, chunkSize), contextSize);
  }

  return trimPrompt(trimmedPrompt, contextSize);
}
