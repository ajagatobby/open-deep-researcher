import { db, SyncedChat } from "@/dexie";
import { tryCatch } from "@/lib/try-catch";
import { logger } from "@/lib/utils";
import { SourceInfo } from "@/types";
import { UIMessage } from "ai";
import { create } from "zustand";

export interface useChatState {
  chats: SyncedChat[];
  id: string;
  query: string;
  chatTitle: string;
  messages: UIMessage[];
  feedbackMessages: UIMessage[];
  sources: SourceInfo[];
  searchKeywords: string[];
  learnings: string[];
  currentDepth: number;
  totalDepth: number;
  currentBreadth: number;
  totalBreadth: number;
  currentQuery: string;
  totalQueries: number;
  completedQueries: number;
  researchComplete: boolean;
  reportChunks: Record<number, string>;
  finalReport: string;

  // Setters
  setChats: (chats: SyncedChat[]) => void;
  setChatTitle: (title: string) => void;
  getChatMessages: (chatId: string) => void;
  setQuery: (query: string) => void;
  setMessage: (message: UIMessage) => void;
  setMessages: (messages: UIMessage[]) => void;
  setFeedbackMessages: (feedbackMessages: UIMessage[]) => void;
  setSearchKeywords: (searchKeywords: string[]) => void;
  setSources: (sources: SourceInfo[]) => void;
  setLearnings: (learnings: string[]) => void;
  addLearning: (learning: string) => void;
  setCurrentDepth: (depth: number) => void;
  setTotalDepth: (depth: number) => void;
  setCurrentBreadth: (breadth: number) => void;
  setTotalBreadth: (breadth: number) => void;
  setCurrentQuery: (query: string) => void;
  setTotalQueries: (total: number) => void;
  setCompletedQueries: (completed: number) => void;
  setResearchComplete: (complete: boolean) => void;
  addReportChunk: (chunk: string, index: number) => void;
  clearMessages: () => void;
  addMessage: (message: UIMessage, chatId: string) => void;
  updateMessage: (message: Partial<UIMessage>) => void;
  deleteMessage: (messageId: string) => void;
  clearChat: (chatId: string) => void;
  getUserChats: (userId: string) => void;
  createNewChat: ({
    chatId,
    clerkUserId,
    title,
  }: {
    chatId: string;
    clerkUserId: string;
    title: string;
  }) => void;
}

const useChatStore = create<useChatState>()((set) => ({
  id: "",
  chatTitle: "",
  query: "",
  messages: [],
  chats: [],
  feedbackMessages: [],
  sources: [],
  searchKeywords: [],
  learnings: [],
  currentDepth: 0,
  totalDepth: 0,
  currentBreadth: 0,
  totalBreadth: 0,
  currentQuery: "",
  totalQueries: 0,
  completedQueries: 0,
  researchComplete: false,
  reportChunks: {},
  finalReport: "",

  setQuery: (query: string) => set({ query }),
  setChatTitle: (chatTitle: string) => set({ chatTitle }),

  createNewChat: async ({
    chatId,
    clerkUserId,
    title,
  }: {
    chatId: string;
    clerkUserId: string;
    title: string;
  }) => {
    await tryCatch(db.addChat({ chatId, clerkUserId, title }));
  },

  async getUserChats(userId) {
    logger("info", userId);
    const chats = await db.getChatsByUserId();

    set(() => ({
      chats: [...chats],
    }));
  },

  async getChatMessages(chatId: string) {
    const syncedMessages = await db.getChatMessages(chatId);

    const uiMessages = syncedMessages.map((message) =>
      db.messageToUIMessage(message)
    );

    set(() => ({
      messages: uiMessages,
    }));
  },

  setChats: (chats: SyncedChat[]) =>
    set(() => ({
      chats: [...chats],
    })),

  setSources: (sources: SourceInfo[]) =>
    set((state) => {
      const existingUrls = new Set(state.sources.map((s) => s.url));
      const newSources = sources.filter(
        (source) => !existingUrls.has(source.url)
      );

      return {
        sources: [...state.sources, ...newSources],
      };
    }),

  setSearchKeywords: (keywords: string[]) =>
    set((state) => {
      // Only update if we have new keywords
      if (keywords.length === 0) return state;

      const uniqueKeywords = [
        ...new Set([...state.searchKeywords, ...keywords]),
      ];
      return { searchKeywords: uniqueKeywords };
    }),

  setLearnings: (learnings: string[]) =>
    set((state) => {
      const uniqueLearnings = [...new Set([...state.learnings, ...learnings])];
      return { learnings: uniqueLearnings };
    }),

  addLearning: (learning: string) =>
    set((state) => {
      // Prevent duplicates
      if (state.learnings.includes(learning)) return state;
      return { learnings: [...state.learnings, learning] };
    }),

  setMessage: (message: UIMessage) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setFeedbackMessages: (feedbackMessages: UIMessage[]) =>
    set({ feedbackMessages }),

  setMessages: (messages: UIMessage[]) => set({ messages }),

  setCurrentDepth: (currentDepth: number) => set({ currentDepth }),
  setTotalDepth: (totalDepth: number) => set({ totalDepth }),
  setCurrentBreadth: (currentBreadth: number) => set({ currentBreadth }),
  setTotalBreadth: (totalBreadth: number) => set({ totalBreadth }),
  setCurrentQuery: (currentQuery: string) => set({ currentQuery }),
  setTotalQueries: (totalQueries: number) => set({ totalQueries }),
  setCompletedQueries: (completedQueries: number) => set({ completedQueries }),
  setResearchComplete: (researchComplete: boolean) => set({ researchComplete }),

  addReportChunk: (chunk: string, index: number) =>
    set((state) => {
      const newReportChunks = { ...state.reportChunks };
      newReportChunks[index] = chunk;

      const indices = Object.keys(newReportChunks)
        .map(Number)
        .sort((a, b) => a - b);
      const finalReport = indices.map((i) => newReportChunks[i]).join("");

      return {
        reportChunks: newReportChunks,
        finalReport,
      };
    }),

  clearMessages: () => set({ messages: [] }),
  addMessage: (message: UIMessage, chatId: string) => {
    logger("info", JSON.stringify(message));
    db.addMessage({ chatId, message: { ...message } });
    return set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateMessage: (updatedMessage: Partial<UIMessage>) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === updatedMessage.id
          ? { ...message, ...updatedMessage }
          : message
      ),
    })),

  deleteMessage: (messageId: string) =>
    set((state) => ({
      messages: state.messages.filter((message) => message.id !== messageId),
    })),

  clearChat: (chatId: string) =>
    set((state) => ({
      messages: state.id === chatId ? [] : state.messages,
    })),
}));

export { useChatStore };
