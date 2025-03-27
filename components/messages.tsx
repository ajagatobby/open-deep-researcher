import React, { useEffect } from "react";
import { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./message";
import { motion } from "framer-motion";
import ActivityBar from "./activity-bar";
import { useChatStore } from "@/hooks/store/use-chat";
interface ChatMessagesTypes {
  messages: UIMessage[];
  isDeepSearch?: boolean;
}

export default function ChatMessages({
  messages,
  isDeepSearch = false,
}: ChatMessagesTypes) {
  const store = useChatStore();

  const hasActivityData =
    store.searchKeywords.length > 0 ||
    store.sources.length > 0 ||
    store.learnings.length > 0;

  const formattedSources = store.sources.map((source) => ({
    url: source.url,
    title: source.domain || getDomainFromUrl(source.url),
  }));

  // Debug output for activity bar data
  useEffect(() => {
    if (isDeepSearch && hasActivityData) {
      console.log("ActivityBar Data:", {
        searchKeywords: store.searchKeywords,
        sources: formattedSources,
        learnings: store.learnings,
        progress: {
          currentDepth: store.currentDepth,
          totalDepth: store.totalDepth,
          currentBreadth: store.currentBreadth,
          totalBreadth: store.totalBreadth,
          completedQueries: store.completedQueries,
          totalQueries: store.totalQueries,
          currentQuery: store.currentQuery,
        },
      });
    }
  }, [
    isDeepSearch,
    hasActivityData,
    store.searchKeywords,
    formattedSources,
    store.learnings,
    store.currentDepth,
    store.totalDepth,
    store.currentBreadth,
    store.totalBreadth,
    store.completedQueries,
    store.totalQueries,
    store.currentQuery,
  ]);

  const deepResearchQueryIndex = messages.findIndex((m) => m.role === "user");

  const messageElements = [];

  // Process each message
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const isLast = i === messages.length - 1;
    const isAssistantMessage = message.role === "assistant";

    const shouldInjectReport =
      isAssistantMessage &&
      isLast &&
      isDeepSearch &&
      store.finalReport &&
      store.researchComplete;

    const messageContent = shouldInjectReport
      ? store.finalReport
      : message.reasoning || (message.content as string);

    messageElements.push(
      <div
        key={`msg-${i}`}
        className={cn(
          "flex items-start",
          message.role === "user" ? "justify-end" : "justify-start",
          "w-full"
        )}
      >
        <div
          className={cn(
            message.role === "assistant"
              ? "w-full"
              : "w-auto bg-[#e8e8e880] p-3 rounded-3xl sm:max-w-[70%] max-w-[90%] px-5 py-2.5",
            shouldInjectReport && "research-report"
          )}
        >
          <ChatMessage message={messageContent} />

          {isAssistantMessage &&
            isLast &&
            isDeepSearch &&
            hasActivityData &&
            !store.researchComplete && (
              <div className="typing-indicator mt-2">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
        </div>
      </div>
    );

    if (i === deepResearchQueryIndex && isDeepSearch && hasActivityData) {
      messageElements.push(
        <div key="activity-bar" className="py-4 my-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ActivityBar
              readingSources={formattedSources}
              searchingKeywords={store.searchKeywords}
              learnings={store.learnings}
              completedQueries={store.completedQueries || 0}
              currentDepth={store.currentDepth || 0}
              currentBreadth={store.currentBreadth || 0}
              totalQueries={store.totalQueries || 0}
              currentQuery={store.currentQuery || ""}
              totalBreadth={store.totalBreadth || 0}
              totalDepth={store.totalDepth || 0}
            />
          </motion.div>
        </div>
      );
    }
  }

  return (
    <div
      className="w-full !flex-grow  px-4 sm:px-6 rounded-lg my-4 sm:space-y-10 space-y-6"
      style={{ marginTop: "calc(5rem)" }}
    >
      {messageElements}
    </div>
  );
}

function getDomainFromUrl(url: any) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch (e) {
    return url;
  }
}
