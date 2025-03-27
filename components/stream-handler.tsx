"use client";
import { StreamType, Stypes } from "@/types";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { getDomainFromUrl } from "@/lib/utils";
import { useChatStore } from "@/hooks/store/use-chat";

export const StreamHandler = ({ id }: { id: string }) => {
  const { data: dataStream } = useChat({
    api: "/api/chat",
    id,
  });
  const lastProcessedindex = useRef(-1);
  const store = useChatStore();

  useEffect(() => {
    if (!dataStream?.length) return;
    const newStreams = dataStream.slice(lastProcessedindex.current + 1);
    lastProcessedindex.current = dataStream.length - 1;
    console.log("New stream data:", newStreams);

    (newStreams as StreamType[]).forEach((stream: StreamType) => {
      if (stream.type === "user-message-id") {
        return;
      }

      switch (stream.type) {
        case "source-logger":
          console.log("Source URLs:", stream.content);
          if (Array.isArray(stream.content)) {
            // Process URLs to get domain names
            const sources = stream.content.map((url: string) => ({
              url,
              domain: getDomainFromUrl(url),
            }));
            store.setSources(sources);
          }
          break;

        case "search-keyword":
          console.log("Search keywords:", stream.content);
          if (Array.isArray(stream.content)) {
            store.setSearchKeywords(stream.content as string[]);
          }
          break;

        case "research-progress":
          console.log("Research progress:", stream.content);
          if (typeof stream.content === "object" && stream.content !== null) {
            const progress = stream.content as any;

            // Create a batch update to improve performance
            const updates: Partial<{
              currentDepth: number;
              totalDepth: number;
              currentBreadth: number;
              totalBreadth: number;
              completedQueries: number;
              totalQueries: number;
              currentQuery: string;
            }> = {};

            if (progress.currentDepth !== undefined)
              updates.currentDepth = progress.currentDepth;
            if (progress.totalDepth !== undefined)
              updates.totalDepth = progress.totalDepth;
            if (progress.currentBreadth !== undefined)
              updates.currentBreadth = progress.currentBreadth;
            if (progress.totalBreadth !== undefined)
              updates.totalBreadth = progress.totalBreadth;
            if (progress.completedQueries !== undefined)
              updates.completedQueries = progress.completedQueries;
            if (progress.totalQueries !== undefined)
              updates.totalQueries = progress.totalQueries;
            if (progress.currentQuery !== undefined)
              updates.currentQuery = progress.currentQuery;

            // Apply all updates at once
            if (updates.currentDepth !== undefined)
              store.setCurrentDepth(updates.currentDepth);
            if (updates.totalDepth !== undefined)
              store.setTotalDepth(updates.totalDepth);
            if (updates.currentBreadth !== undefined)
              store.setCurrentBreadth(updates.currentBreadth);
            if (updates.totalBreadth !== undefined)
              store.setTotalBreadth(updates.totalBreadth);
            if (updates.completedQueries !== undefined)
              store.setCompletedQueries(updates.completedQueries);
            if (updates.totalQueries !== undefined)
              store.setTotalQueries(updates.totalQueries);
            if (updates.currentQuery !== undefined)
              store.setCurrentQuery(updates.currentQuery);

            // Handle learnings separately
            if (
              progress.learnings &&
              Array.isArray(progress.learnings) &&
              progress.learnings.length > 0
            ) {
              store.setLearnings(progress.learnings);
            }
          }
          break;

        case "research-learning":
          console.log("New learning received:", stream.content);
          if (
            typeof stream.content === "object" &&
            stream.content !== null &&
            "learning" in stream.content &&
            typeof stream.content.learning === "string"
          ) {
            const learning = stream.content.learning;
            console.log("Adding learning to store:", learning);
            store.addLearning(learning);
          }
          break;

        case "research-report-chunk":
          console.log("Research report chunk:", stream.content);
          if (
            typeof stream.content === "object" &&
            stream.content !== null &&
            "chunk" in stream.content &&
            "index" in stream.content
          ) {
            store.addReportChunk(
              stream.content.chunk as string,
              stream.content.index as number
            );
          }
          break;

        case "research-complete":
          console.log("Research complete:", stream.content);
          store.setResearchComplete(true);
          break;

        default:
          console.log("Unknown stream type:", stream.type, stream.content);
      }
    });
  }, [dataStream, store]);

  return null;
};
