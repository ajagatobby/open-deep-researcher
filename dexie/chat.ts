import { getUser } from "@/lib/actions";
import { tryCatch } from "@/lib/try-catch";
import { generateUUID, logger } from "@/lib/utils";
import { UIMessage } from "ai";
import { Dexie, Table } from "dexie";

type SyncStatus = "synced" | "pending" | "error";

interface SyncMetadata {
  syncStatus: SyncStatus;
  lastSyncAttempt?: Date;
  syncError?: string;
}

type Message = {
  id: string;
  role: string;
  content: string;
  reasoning: string;
  chatId: string;
  createdAt: Date;
};
type Chat = {
  id: string;
  clerkUserId: string;
  isPrivate: boolean;
  createdAt: Date;
  lastUpdated: Date;
  title: string;
};

interface ChatWithRelations extends Chat {
  id: string;
  title: string;
  messages?: MessageWithRelations[];
}

interface MessageWithRelations extends Message {
  chat?: Chat;
}
export interface SyncedChat extends ChatWithRelations, SyncMetadata {}
interface SyncedMessage extends MessageWithRelations, SyncMetadata {}

class ChatDatabase extends Dexie {
  chats!: Table<SyncedChat, string>;
  messages!: Table<SyncedMessage, string>;
  syncQueue!: Table<
    {
      id: string;
      operation: string;
      entity: string;
      data: any;
      timestamp: Date;
    },
    number
  >;
  private subscribers: Map<string, Set<Function>> = new Map();
  private _isOnline: boolean =
    typeof navigator !== "undefined" ? navigator.onLine : true;
  constructor() {
    super("chatDatabase");

    this.version(1).stores({
      chats: "id, clerkUserId, lastUpdated, syncStatus",
      messages: "id, chatId, content, reasoning, createdAt, role, syncStatus",
      syncQueue: "++id, entity, operation, timestamp",
    });
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  setOnline(status: boolean) {
    if (this._isOnline !== status) {
      this._isOnline = status;
      this.notify("connectionChange", { online: status });

      if (status) {
        // sync data
      }
    }
  }

  initConnectionListeners() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.setOnline(true));
      window.addEventListener("offline", () => this.setOnline(false));

      // Set initial state
      this.setOnline(navigator.onLine);
    }
  }

  // observer
  subscribe(event: string, callback: Function) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    // Execute subscription
    this.subscribers.get(event)?.add(callback);

    // Cleanup subscription
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  private notify(event: string, data: any) {
    this.subscribers.get(event)?.forEach(async (callback) => {
      const { error } = await tryCatch(callback(data));
      if (error) {
        logger("error", `Error in ${event} subscriber: ${error}`);
      }
    });
  }

  private async addToSyncQueue(
    entity: string,
    operation: string,
    data: any
  ): Promise<void> {
    try {
      await this.syncQueue.add({
        entity,
        operation,
        data,
        timestamp: new Date(),
        id: generateUUID(),
      });
    } catch (error) {
      console.error("Error adding to sync queue:", error);
    }
  }

  async getChat(id: string): Promise<SyncedChat | undefined> {
    const { error, data } = await tryCatch(this.chats.get(id));
    if (error) {
      logger("info", `Error fetching chat: ${error.message}`);
      this.notify("error", { operation: "getChat", error });
      return undefined;
    }
    return data;
  }

  async getChatsByUserId(): Promise<SyncedChat[] | []> {
    const clerkUserId = await getUser();
    const chats = this.chats
      .where({
        clerkUserId,
      })
      .sortBy("lastUpdated")
      .then((chats) => chats.reverse());

    const { error, data } = await tryCatch(chats);
    if (error) {
      logger("info", `Error fetching chat: ${error.message}`);
      this.notify("error", { operation: "getChatsByUserId", error });
      return [];
    }
    return data;
  }

  async addChat({
    clerkUserId,
    chatId,
    title,
  }: {
    clerkUserId: string;
    chatId: string;
    title: string;
  }): Promise<string | null> {
    const { error, data } = await tryCatch(
      this.chats.add({
        clerkUserId: clerkUserId,
        syncStatus: "synced",
        lastUpdated: new Date(),
        isPrivate: true,
        createdAt: new Date(),
        id: chatId,
        title,
      })
    );

    if (error) {
      logger("error", error.message);
      this.notify("error", { operation: "addChat", error });
    }

    logger("success", "added: new chat");
    return data;
  }

  async getChatMessages(chatId: string): Promise<SyncedMessage[]> {
    const messages = this.messages.where({ chatId }).toArray();

    const { error, data } = await tryCatch(messages);

    if (error) {
      this.notify("error", { operation: "getChatMessages", error });
      return [];
    }

    return data;
  }

  async addMessage({
    chatId,
    message,
  }: {
    chatId: string;
    message: UIMessage;
  }): Promise<string | null> {
    const { error, data } = await tryCatch(
      this.messages.add({
        chatId,
        content: message.content,
        id: message.id,
        createdAt: message.createdAt || new Date(),
        reasoning: message.reasoning || "",
        role: message.role,
        syncStatus: "synced",
      })
    );

    if (error) {
      logger("error", error.message);
      this.notify("error", { operation: "addChat", error });
    }

    logger("success", `added: message to chat with id of: ${chatId}`);

    return data;
  }

  async saveChat(
    chat: ChatWithRelations,
    syncStatus: SyncStatus = "pending"
  ): Promise<string> {
    const syncedChat: SyncedChat = {
      ...chat,
      lastUpdated: new Date(),
      syncStatus,
    };

    const { error, data } = await tryCatch(this.chats.put(syncedChat));

    if (error) {
      console.error("Error saving chat:", error);
      this.notify("error", { operation: "saveChat", error });
      return error.message;
    }

    if (syncStatus === "pending") {
      await this.addToSyncQueue("chat", "save", syncedChat);
    }

    this.notify("chatUpdated", syncedChat);
    return data;
  }

  async deleteChat(chatId: string) {
    const { data: messages, error: messageErrror } = await tryCatch(
      this.messages.where({ chatId }).toArray()
    );

    if (messageErrror) {
      this.notify("error", { operation: "deleteChatMessage", messageErrror });
      return messageErrror.message;
    }

    const transaction = this.transaction(
      "rw",
      [this.chats, this.messages],
      async () => {
        for (const message of messages) {
          await tryCatch(this.messages.where({ id: message.id }).delete());
        }
        await tryCatch(this.chats.delete(chatId));
      }
    );

    const { error, data } = await tryCatch(transaction);

    if (error) {
      this.notify("error", { operation: "deleteChatMessage2", error });
      return error.message;
    }

    await this.addToSyncQueue("chat", "delete", { chatId });

    this.notify("chatDeleted", { chatId });
    return data;
  }

  uiMessageToMessage(
    uiMessage: UIMessage,
    chatId: string
  ): MessageWithRelations {
    return {
      id: uiMessage.id,
      role: uiMessage.role,
      content: uiMessage.content,
      reasoning: uiMessage.reasoning || "",
      createdAt: new Date(uiMessage.createdAt?.toString() || Date.now()),
      chatId: chatId,
    };
  }

  messageToUIMessage(message: MessageWithRelations): UIMessage {
    return {
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      reasoning: message.reasoning || undefined,
      createdAt: message.createdAt,
      parts: [],
    };
  }

  async syncFromServer(serverData: {
    chats: Chat[];
    messages: Message[];
  }): Promise<string | undefined> {
    if (!serverData || !serverData.chats || !serverData.messages) {
      logger(
        "error",
        `Cannot sync from server: Missing data: ${JSON.stringify(serverData)}`
      );

      return "Missing Data";
    }

    const transactions = this.transaction(
      "rw",
      [this.chats, this.messages],
      async () => {
        for (const chat of serverData.chats) {
          if (chat?.id) {
            await this.chats.put({
              ...chat,
              syncStatus: "synced",
            });
          } else {
            console.warn("Skipping invalid chat during sync:", chat);
          }
        }

        for (const message of serverData.messages) {
          if (message?.id && message?.chatId) {
            await this.messages.put({
              ...message,
              syncStatus: "synced",
            });
          } else {
            console.warn("Skipping invalid message during sync:", message);
          }
        }
      }
    );

    const { error, data } = await tryCatch(transactions);

    if (error) {
      console.error("Error syncing from server:", error);
      this.notify("error", { operation: "syncFromServer", error });
      return error.message;
    }

    logger(
      "success",
      `syncCompleted in ${new Date()}, data: ${JSON.stringify(data)}`
    );
    this.notify("syncCompleted", { timestamp: new Date() });
  }

  processSyncQueue() {}
}

const db = new ChatDatabase();

export { db };
