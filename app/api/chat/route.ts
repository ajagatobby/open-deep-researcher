import { z } from "zod";
import * as fs from "fs/promises";

import {
  convertToCoreMessages,
  createDataStreamResponse,
  streamText,
} from "ai";
import pLimit from "p-limit";
import { getModel } from "@/lib/ai/provider";
import { deepResearchSystemPrompt, regularPrompt } from "@/lib/prompt";
import FirecrawlApp from "@mendable/firecrawl-js";
import {
  AllowedTools,
  DeepSearchTypes,
  errorMessageTypes,
  ResearchProgress,
  Stypes,
} from "@/types";
import { compact } from "lodash-es";

import { tryCatch } from "@/lib/try-catch";
import { logger, sleep } from "@/lib/utils";
import {
  generateSerpQueries,
  processSerpResult,
  writeFinalAnswer,
  writeFinalReport,
} from "@/lib/agents/tools";
import { rateLimiter } from "@/lib/rate-limit";
import { auth } from "@clerk/nextjs/server";

const firecrawlTools: AllowedTools[] = ["search", "extract", "scrape"];

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});

export const maxDuration = 300;

export async function POST(request: Request) {
  const { messages, id, searchType }: DeepSearchTypes = await request.json();

  const { userId } = await auth();

  logger("info", searchType);

  if (!messages) {
    return Response.json(
      {
        error: "NO_QUERY_FOUND" as errorMessageTypes,
        data: null,
      },
      { status: 409 }
    );
  }

  const { data } = await tryCatch(rateLimiter.limit(userId as string));

  console.log(userId, JSON.stringify(data?.success));

  if (!data?.success) {
    return new Response(`Too many requests`, { status: 429 });
  }

  const coreMessages = convertToCoreMessages(messages);

  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeData({
        type: "user-message-id",
        content: id,
      });
      const result = streamText({
        model: getModel(searchType),
        system:
          searchType === "DEEP_RESEARCH"
            ? deepResearchSystemPrompt()
            : regularPrompt,
        messages: coreMessages,
        experimental_activeTools:
          searchType === "DEEP_RESEARCH" ? ["deepResearch"] : [],
        maxSteps: searchType === "DEEP_RESEARCH" ? 10 : 1,
        tools: {
          search: {
            description:
              "Search for web pages. Normally you should call the extract tool after this one to get a spceific data point if search doesn't the exact data you need.",
            parameters: z.object({
              query: z
                .string()
                .describe("Search query to find relevant web pages"),
              maxResults: z
                .number()
                .optional()
                .describe("Maximum number of results to return (default 10)"),
            }),

            execute: async ({ query, maxResults = 5 }) => {
              logger("info", "Search tool called");
              let { data: searchResult, error } = await app.search(query);

              logger("info", JSON.stringify(searchResult));
              // await sleep(5000);

              if (!searchResult) {
                logger("error", error);
                return {
                  type: "SEARCH_QUERY_FAILED" as errorMessageTypes,
                  error,
                  success: false,
                };
              }

              const resultsWithFavicons = searchResult.map((result: any) => {
                const url = new URL(result.url);
                const favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
                return {
                  ...result,
                  favicon,
                };
              });

              searchResult = resultsWithFavicons;
              logger(
                "success",
                `SEARCHED_DATA: ${JSON.stringify(searchResult)}`
              );
              return {
                data: searchResult,
                success: true,
              };
            },
          },
          extract: {
            description:
              "Extract structured data from web pages. Use this to get whatever data you need from a URL. Any time someone needs to gather data from something, use this tool.",
            parameters: z.object({
              urls: z
                .array(z.string())
                .describe("Array of URLs to extract data from"),
              prompt: z
                .string()
                .describe("Description of what data to extract"),
            }),

            execute: async ({ urls, prompt }) => {
              logger("info", "Extraction tool called");
              const { data: scrapeResult, error } = await tryCatch(
                app.extract(urls, { prompt })
              );

              if (!scrapeResult) {
                logger("error", error);
                return {
                  type: "SCRAPE_RESULT_FAILED" as errorMessageTypes,
                  error,
                  success: false,
                };
              }

              logger(
                "success",
                `EXTRACTED_DATA: ${JSON.stringify(scrapeResult)}`
              );

              return {
                data: scrapeResult,
                success: true,
              };
            },
          },
          scrape: {
            description:
              "Scrape web pages. Use this to get from a page when you have the url.",
            parameters: z.object({
              url: z.string().describe("URL to scrape"),
            }),
            execute: async ({ url }: { url: string }) => {
              logger("info", "SCRAPPING_TOOL");
              const { data: scrapeResult, error } = await tryCatch(
                app.scrapeUrl(url)
              );

              if (!scrapeResult) {
                return {
                  error,
                  success: false,
                };
              }

              logger("success", "SCRAPPED_TOOL SUCCESS");
              return {
                data:
                  scrapeResult ??
                  "Could get the page content, try using search or extract",
                success: true,
              };
            },
          },
          deepResearch: {
            description:
              "Perform deep research on a topic using an AI agent that coordinates search, extract, and analysis tools with reasoning steps.",
            parameters: z.object({
              topic: z.string().describe("The topic or question to research"),
            }),

            execute: async ({ topic }: { topic: string }) => {
              logger("info", "DEEP_RESEARCH_IS_TRIGGERED");
              const maxDepth = 15;
              const concurrencyLimit = 2;
              const totalBreadth = 7;
              const numQueries = 5;
              const visitedUrls = new Set();

              // Send initial progress update to client
              dataStream.writeData({
                type: "research-progress",
                content: {
                  status: "started",
                  totalDepth: maxDepth,
                  totalBreadth,
                  topic,
                  currentDepth: 0,
                  currentBreadth: 0,
                  completedQueries: 0,
                  totalQueries: 0,
                  learnings: [],
                },
              });

              // Track overall research progress
              const researchProgress = {
                completedQueries: 0,
                currentBreadth: 0,
                currentDepth: 0,
                totalBreadth,
                totalQueries: 0,
                currentQuery: "",
                totalDepth: maxDepth,
                learnings: [],
              };

              // Improved progress reporting function
              const updateResearchProgress = (
                update: Partial<ResearchProgress>
              ) => {
                // Create a new merged object to ensure we have all fields
                const newProgress = {
                  ...researchProgress,
                  ...update,
                };

                // Update our local copy of research progress
                Object.assign(researchProgress, update);

                dataStream.writeData({
                  type: "research-progress",
                  content: {
                    ...newProgress,
                    status: "in-progress",
                  },
                });

                logger(
                  "info",
                  `Research progress: Depth ${newProgress.currentDepth}/${newProgress.totalDepth}, Breadth ${newProgress.currentBreadth}/${newProgress.totalBreadth}, Queries ${newProgress.completedQueries}/${newProgress.totalQueries}`
                );
              };

              // Main research function
              async function performResearch(params: {
                query: string;
                depth: number;
                breadth: number;
              }) {
                const { query, depth, breadth } = params;

                if (depth <= 0 || breadth <= 0) {
                  return {
                    data: {
                      learnings: researchProgress.learnings,
                      message: "Research depth limit reached",
                    },
                    success: true,
                  };
                }

                try {
                  // Generate search queries based on the topic and existing learnings
                  const queries = await generateSerpQueries({
                    query,
                    learnings: researchProgress.learnings,
                    numQueries,
                  });

                  if (!queries || queries.length === 0) {
                    return {
                      data: {
                        learnings: researchProgress.learnings,
                        message: "Could not generate search queries",
                      },
                      success: false,
                    };
                  }

                  // Update progress with total queries and current depth
                  updateResearchProgress({
                    totalQueries:
                      researchProgress.totalQueries + queries.length,
                    currentQuery: queries[0].query,
                    currentDepth: maxDepth - depth,
                  });

                  // Send keywords as formatted array
                  dataStream.writeData({
                    type: "search-keyword" as Stypes,
                    content: queries.map((query) => query.query),
                  });

                  // Process queries with concurrency limit
                  const limit = pLimit(concurrencyLimit);

                  const searchResults = await Promise.all(
                    queries.map((serpQuery, index) =>
                      limit(async () => {
                        // Add some delay between requests
                        if (index > 0) await sleep(5000);

                        // Update current query being processed
                        updateResearchProgress({
                          currentQuery: serpQuery.query,
                        });

                        // Perform search
                        const { data: searchResult, error } = await tryCatch(
                          app.search(serpQuery.query, {
                            timeout: 10000,
                            limit: 2,
                            scrapeOptions: { formats: ["markdown"] },
                          })
                        );

                        if (!searchResult?.data || error) {
                          logger(
                            "error",
                            `Search failed for query: ${serpQuery.query} : ${error} : ${searchResult}`
                          );

                          // Even on error, increment completed queries
                          updateResearchProgress({
                            completedQueries:
                              researchProgress.completedQueries + 1,
                          });

                          return null;
                        }

                        // Collect new URLs from this search
                        const newUrls = compact(
                          searchResult.data.map((item) => item.url)
                        );

                        // Send sources as a plain array
                        dataStream.writeData({
                          type: "source-logger",
                          content: newUrls,
                        });

                        // Add each URL individually to the visited set
                        newUrls.forEach((url) => visitedUrls.add(url));

                        // Process search results to extract learnings
                        const processedResults = await processSerpResult({
                          query: serpQuery.query,
                          result: searchResult,
                          numFollowUpQuestions: Math.ceil(breadth / 2),
                        });

                        // Handle new learnings
                        const newLearnings = processedResults.learnings || [];
                        if (newLearnings.length > 0) {
                          // Send each learning individually with source
                          for (const learning of newLearnings) {
                            dataStream.writeData({
                              type: "research-learning" as Stypes,
                              content: {
                                learning,
                                source: searchResult.data[0]?.url,
                                timestamp: new Date().toISOString(),
                              } as {},
                            });

                            await sleep(20);
                          }
                        }

                        // Update progress with completed query and new learnings
                        updateResearchProgress({
                          completedQueries:
                            researchProgress.completedQueries + 1,
                          learnings: [
                            ...researchProgress.learnings,
                            ...newLearnings,
                          ],
                        });

                        return {
                          urls: newUrls,
                          learnings: newLearnings,
                          followUpQuestions:
                            processedResults.followUpQuestions || [],
                          searchQuery: serpQuery,
                        } as {
                          urls: string[];
                          learnings: string[];
                          followUpQuestions: string[];
                          searchQuery: typeof serpQuery;
                        };
                      })
                    )
                  );

                  // Filter out null results and merge learnings
                  const validResults = searchResults.filter(
                    (result) => result !== null
                  );

                  if (validResults.length === 0) {
                    return {
                      data: {
                        learnings: researchProgress.learnings,
                        message: "No valid search results found",
                      },
                      success: true,
                    };
                  }

                  // Determine if we should continue researching deeper
                  if (depth > 1 && breadth > 1) {
                    const newDepth = depth - 1;
                    const newBreadth = Math.ceil(breadth / 2);

                    // Select a follow-up question for the next level of research
                    const allFollowUpQuestions = validResults
                      .flatMap((result) => result.followUpQuestions || [])
                      .filter(Boolean);

                    if (allFollowUpQuestions.length > 0) {
                      // Select the most promising follow-up question
                      const nextQuery = allFollowUpQuestions[0];

                      logger(
                        "info",
                        `Researching deeper, depth: ${newDepth}, breadth: ${newBreadth}, query: ${nextQuery}`
                      );

                      // Update progress for the new research level
                      updateResearchProgress({
                        currentDepth: maxDepth - newDepth,
                        currentBreadth: newBreadth,
                      });

                      // Recursively research the follow-up question
                      return performResearch({
                        query: nextQuery,
                        depth: newDepth,
                        breadth: newBreadth,
                      });
                    }
                  }

                  return {
                    data: {
                      learnings: researchProgress.learnings,
                      visitedUrls: Array.from(visitedUrls),
                      message: "Research completed successfully",
                    },
                    success: true,
                  };
                } catch (error) {
                  logger("error", `Research error: ${error}`);
                  return {
                    data: {
                      learnings: researchProgress.learnings,
                      message: `Research error: ${error}`,
                    },
                    success: false,
                    error,
                  };
                }
              }

              // Start the research process
              const result = await performResearch({
                query: topic,
                depth: maxDepth,
                breadth: totalBreadth,
              });

              // Synthesize final result
              const finalLearnings = result.data.learnings || [];

              // Get the final report and answer
              const finalReport = await writeFinalReport({
                prompt: topic,
                learnings: finalLearnings,
                visitedUrls: (Array.from(visitedUrls) as string[]) ?? [],
              });

              const finalAnswer = await writeFinalAnswer({
                prompt: topic,
                learnings: finalLearnings,
              });

              const combinedReport = finalAnswer + "\n\n" + finalReport;

              // Stream the report in chunks
              const chunkSize = 1000;
              for (let i = 0; i < combinedReport.length; i += chunkSize) {
                const chunk = combinedReport.slice(i, i + chunkSize);
                dataStream.writeData({
                  type: "research-report-chunk",
                  content: {
                    chunk,
                    index: Math.floor(i / chunkSize),
                    total: Math.ceil(combinedReport.length / chunkSize),
                    isLast: i + chunkSize >= combinedReport.length,
                  },
                });

                await sleep(50);
              }

              // Signal research completion
              dataStream.writeData({
                type: "research-complete",
                content: {
                  learningsCount: finalLearnings.length,
                  queriesCompleted: researchProgress.completedQueries,
                  totalQueries: researchProgress.totalQueries,
                },
              });

              // Write the report to a file
              await fs.writeFile("report.md", combinedReport, "utf-8");

              return {
                success: result.success,
                data: {
                  learnings: finalLearnings,
                  analysis: finalLearnings.join("\n\n"),
                  completedQueries: researchProgress.completedQueries,
                  totalQueries: researchProgress.totalQueries,
                  visitedUrls: Array.from(visitedUrls),
                  report: [finalReport, finalLearnings, visitedUrls],
                },
              };
            },
          },
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: "stream-text",
        },
        onFinish: (e) => {
          logger("success", JSON.stringify(e.text));
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}
