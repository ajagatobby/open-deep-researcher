import { Message } from "ai";

type ResearchProgress = {
  currentDepth: number;
  totalDepth: number;
  currentBreadth: number;
  totalBreadth: number;
  currentQuery?: string;
  totalQueries: number;
  completedQueries: number;
  learnings?: Array<string>;
};

type ResearchResult = {
  learnings: string[];
  visitedUrls: string[];
};

interface Component {
  code: string;
  filename: string;
}

interface OptionalComponent {
  code?: string;
  filename?: string;
}

type errorMessageTypes =
  | "NO_QUERY_FOUND"
  | "NONE"
  | "SEARCH_QUERY_FAILED"
  | "SCRAPE_RESULT_FAILED";

type AllowedTools = "deepResearch" | "search" | "extract" | "scrape";

interface DeepSearchTypes {
  id: string;
  messages: Array<Message>;
  searchType: options;
}

export interface SourceInfo {
  url: string;
  domain: string;
}

// Update your existing Stypes with additional event types
export type Stypes =
  | "title"
  | "user-message-id"
  | "search-keyword"
  | "source-logger"
  | "clarification"
  | "completed"
  | "research-progress"
  | "research-learning"
  | "research-activity"
  | "research-queries"
  | "research-search"
  | "research-results"
  | "research-error"
  | "research-warning"
  | "research-next-direction"
  | "research-report-chunk"
  | "research-complete";

// Update your StreamType to handle more complex content
type StreamType = {
  type: Stypes;
  content: string | string[] | Record<string, any>;
};

type ResearchProgress = {
  currentDepth: number;
  totalDepth: number;
  currentBreadth: number;
  totalBreadth: number;
  currentQuery?: string;
  totalQueries: number;
  completedQueries: number;
};

type options = "DEEP_RESEARCH" | "THINK" | "REGULAR";

interface ChatInputProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  submit?: () => void;
  loading?: boolean;
  setSelectedOptions: (value: T) => void;
  selectOptions: string;
  handleStop?: () => void;
  isMobile: boolean;
}

interface OptionObject {
  value: options | string;
}

interface SearchInputProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit?: () => void;
  loading?: boolean;
  setSelectedOptions: (value: OptionObject) => void;
  selectOptions: options | string;
}
