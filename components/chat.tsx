"use client";
import React, { useEffect, useRef, useState } from "react";
import ChatInput from "./chat-input";
import ChatMessages from "./messages";
import { useChat } from "@ai-sdk/react";
import { DeepSearchTypes, options } from "@/types";
import { generateId, UIMessage } from "ai";
import { useChatStore } from "@/hooks/store/use-chat";
import { useLocalStorage } from "@/hooks";

export default function Chat({
  id,
  clerkUserId,
}: {
  id: string;
  clerkUserId: string;
}) {
  const store = useChatStore((state) => state);
  const [selectedOption, setSelectedOption] = useLocalStorage<{
    value: string;
  }>("model-type", {
    value: "REGULAR",
  });
  const [isMobile, setIsMobile] = useState(false);
  const {
    append,
    handleSubmit,
    input,
    handleInputChange,
    messages,
    setMessages,
    isLoading,
    setInput,
    stop,
  } = useChat({
    api: "/api/chat",
    id,
    body: {
      id,
      searchType: selectedOption.value,
    } as DeepSearchTypes,
    experimental_throttle: 100,
    onFinish: async (response) => {
      store.addMessage(
        {
          content: response.content,
          id: response.id,
          parts: [],
          role: "assistant",
        },
        id
      );

      if (selectedOption.value === "DEEP_RESEARCH") {
        setMessages([]);
        setSelectedOption({ value: "REGULAR" });
      }
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    },
  });

  const isDeepSearch =
    store.searchKeywords.length > 0 || store.sources.length > 0;

  const hasInitialized = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();

    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, store.messages]);

  useEffect(() => {
    if (
      hasInitialized.current ||
      !store.query ||
      store.query.trim().length === 0
    ) {
      return;
    }

    hasInitialized.current = true;

    // Define the function
    const initializeChat = async () => {
      try {
        const userQuery = store.query;

        store.createNewChat({
          chatId: id,
          clerkUserId,
          title: store.chatTitle,
        });
        store.setQuery("");
        store.setChatTitle("");
        append({ content: userQuery, role: "user" });
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    initializeChat();
  }, []);

  useEffect(() => {
    async function loadChatMessages() {
      store.getChatMessages(id);
    }

    loadChatMessages();
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div
      ref={chatContainerRef}
      className="flex flex-col w-full bg-white !pb-40 stretch max-w-3xl mx-auto "
    >
      <ChatMessages
        messages={
          messages.length > 0 ? (messages as UIMessage[]) : store.messages
        }
        isDeepSearch={selectedOption.value === "DEEP_RESEARCH" ? true : false}
      />

      <div ref={messagesEndRef}>
        <ChatInput
          value={input}
          submit={() => {
            if (selectedOption.value === "DEEP_RESEARCH") {
              setSelectedOption({ value: "DEEP_RESEARCH" });
              setMessages([]);
            }
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
            store.addMessage(
              {
                content: input,
                role: "user",
                id: `msg-L${generateId()}`,
                parts: [],
              },
              id
            );
            handleSubmit();
            setInput("");
          }}
          loading={isLoading}
          onChange={handleInputChange}
          selectOptions={selectedOption.value}
          setSelectedOptions={setSelectedOption}
          handleStop={stop}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
