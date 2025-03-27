"use server";
import { SearchResponse } from "@mendable/firecrawl-js";
import { generateObject, generateText } from "ai";
import { compact } from "lodash-es";
import { z } from "zod";
import { getModel, trimPrompt } from "../ai/provider";
import { deepResearchSystemPrompt } from "../prompt";

function log(...args: any[]) {
  console.log(...args);
}

export async function generateSerpQueries({
  query,
  numQueries = 3,
  learnings,
}: {
  query: string;
  numQueries?: number;
  learnings?: string[];
}) {
  const res = await generateObject({
    model: getModel("DEEP_RESEARCH"),
    system: deepResearchSystemPrompt(),
    prompt: `Given the following prompt from the user, generate a list of SERP queries to research the topic. Return a maximum of ${numQueries} queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other: <prompt>${query}</prompt>\n\n${
      learnings
        ? `Here are some learnings from previous research, use them to generate more specific queries: ${learnings.join(
            "\n"
          )}`
        : ""
    }`,
    schema: z.object({
      queries: z
        .array(
          z.object({
            query: z.string().describe("The SERP query"),
            researchGoal: z
              .string()
              .describe(
                "First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions."
              ),
          })
        )
        .describe(`List of SERP queries, max of ${numQueries}`),
    }),
  });
  log(`Created ${res.object.queries.length} queries`, res.object.queries);

  return res.object.queries.slice(0, numQueries);
}

export async function processSerpResult({
  query,
  result,
  numLearnings = 3,
  numFollowUpQuestions = 3,
}: {
  query: string;
  result: SearchResponse;
  numLearnings?: number;
  numFollowUpQuestions?: number;
}) {
  const contents = compact(result.data.map((item) => item.markdown)).map(
    (content) => trimPrompt(content, 25_000)
  );
  log(`Ran ${query}, found ${contents.length} contents`);

  if (contents.length === 0) {
    log(`No contents found for query: ${query}`);
    return {
      learnings: [],
      followUpQuestions: [],
    };
  }

  try {
    const res = await generateObject({
      model: getModel("DEEP_RESEARCH"),
      system: deepResearchSystemPrompt(),
      prompt: trimPrompt(
        `Given the following contents from a SERP search for the query <query>${query}</query>, generate a list of learnings from the contents. Return a maximum of ${numLearnings} learnings, but feel free to return less if the contents are clear. Make sure each learning is unique and not similar to each other. The learnings should be concise and to the point, as detailed and information dense as possible. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any exact metrics, numbers, or dates. The learnings will be used to research the topic further.\n\n<contents>${contents
          .map((content) => `<content>\n${content}\n</content>`)
          .join("\n")}</contents>`
      ),
      maxRetries: 5,
      schema: z.object({
        learnings: z
          .array(z.string())
          .describe(`List of learnings, max of ${numLearnings}`),
        followUpQuestions: z
          .array(z.string())
          .describe(
            `List of follow-up questions to research the topic further, max of ${numFollowUpQuestions}`
          ),
      }),
    });

    log(
      `Created ${res.object.learnings.length} learnings`,
      res.object.learnings
    );
    return res.object;
  } catch (error) {
    log(`Error processing SERP result for query: ${query}`, error);
    return {
      learnings: [`${query}`],
      followUpQuestions: [`${query}?`],
    };
  }
}

export async function writeFinalReport({
  prompt,
  learnings,
  visitedUrls,
}: {
  prompt: string;
  learnings: string[];
  visitedUrls: string[];
}) {
  const learningsString = learnings
    .map((learning) => `<learning>\n${learning}\n</learning>`)
    .join("\n");

  const res = await generateObject({
    model: getModel("DEEP_RESEARCH"),
    system: deepResearchSystemPrompt(),
    prompt: trimPrompt(
      `Given the following prompt from the user, write a final report on the topic using the learnings from research. Make it as as detailed as possible, aim for 3 or more pages, include ALL the learnings from research:\n\n<prompt>${prompt}</prompt>\n\nHere are all the learnings from previous research:\n\n<learnings>\n${learningsString}\n</learnings>`
    ),
    schema: z.object({
      reportMarkdown: z
        .string()
        .describe("Final report on the topic in Markdown"),
    }),
  });

  const urlsSection = `\n\n## Sources\n\n${visitedUrls
    .map((url) => `- ${url}`)
    .join("\n")}`;
  return res.object.reportMarkdown;
}

export async function writeFinalAnswer({
  prompt,
  learnings,
}: {
  prompt: string;
  learnings: string[];
}) {
  const learningsString = learnings
    .map((learning) => `<learning>\n${learning}\n</learning>`)
    .join("\n");

  const res = await generateObject({
    model: getModel("DEEP_RESEARCH"),
    system: deepResearchSystemPrompt(),
    prompt: trimPrompt(
      `Given the following prompt from the user, write a final answer on the topic using the learnings from research. Follow the format specified in the prompt. Do not yap or babble or include any other text than the answer besides the format specified in the prompt. Keep the answer as concise as possible - usually it should be just a few words or maximum a sentence. Try to follow the format specified in the prompt (for example, if the prompt is using Latex, the answer should be in Latex. If the prompt gives multiple answer choices, the answer should be one of the choices).\n\n<prompt>${prompt}</prompt>\n\nHere are all the learnings from research on the topic that you can use to help answer the prompt:\n\n<learnings>\n${learningsString}\n</learnings>`
    ),
    schema: z.object({
      exactAnswer: z
        .string()
        .describe(
          "The final answer, make it very detailed and extensive. Use markdown"
        ),
    }),
  });

  return res.object.exactAnswer;
}

export async function generateChatTitle({ prompt }: { prompt: string }) {
  const res = await generateText({
    model: getModel("REGULAR"),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(prompt),
  });

  return res.text;
}
