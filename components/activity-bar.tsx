"use client";
import {
  Check,
  Expand,
  Minimize2,
  Search,
  BookOpen,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles,
  Copy,
  Menu,
  Brain,
  LightbulbIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFavicon } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ResearchProgress {
  completedQueries: number;
  currentBreadth: number;
  currentDepth: number;
  totalBreadth: number;
  totalDepth: number;
  totalQueries: number;
  currentQuery: string;
}

interface ActivityBarProps extends Partial<ResearchProgress> {
  thinking?: string;
  searchingKeywords?: string[];
  readingSources?: { url: string; title: string }[];
  learnings?: string[];
  onExpand?: () => void;
  onShare?: () => void;
  onOpenInNew?: () => void;
  onCopy?: () => void;
  onSave?: () => void;
  onFilter?: () => void;
  className?: string;
}

interface SourceItemProps {
  source: { url: string; title: string };
  index: number;
}

const SourceItem = memo(({ source, index }: SourceItemProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={source.url}
            className={`
            !bg-white !border !border-gray-200 !p-1.5 md:!p-2 !rounded-md !text-[9px] md:!text-[10px] 
            !flex !items-center !gap-1.5 md:!gap-2 !transition-all !hover:border-blue-300 
            !hover:shadow-sm !group ${
              index === 0 ? "!ring-1 !ring-blue-200" : ""
            }
          `}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="!bg-white !size-5 md:!size-6 !items-center !flex !justify-center !rounded-sm !overflow-hidden !border !border-gray-200 !shrink-0">
              <img
                src={getFavicon(source.url) || "/placeholder.svg"}
                className="!size-3 md:!size-4"
                alt={`${source.title} favicon`}
              />
            </div>
            <div className="!flex-1 !min-w-0">
              <div className="!flex !items-center !justify-between !mb-0.5">
                <p className="!truncate !font-medium !text-gray-900">
                  {source.title}
                </p>
                <ExternalLink className="!size-2.5 md:!size-3 !text-gray-400 !opacity-0 !group-hover:opacity-100 !transition-opacity" />
              </div>
              <div className="!flex !items-center !justify-between">
                <p className="!truncate !text-gray-500 !text-[7px] md:!text-[8px]">
                  {new URL(source.url).hostname.replace("www.", "")}
                </p>
              </div>
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent className="!max-w-[300px]">
          <p className="!text-xs !font-medium">{source.title}</p>
          <p className="!text-[10px] !text-gray-500">{source.url}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
SourceItem.displayName = "SourceItem";

interface KeywordItemProps {
  keyword: string;
  index: number;
}

const KeywordItem = memo(({ keyword, index }: KeywordItemProps) => {
  return (
    <div
      key={index}
      className="!group !bg-gray-50 !border !border-gray-200 !px-1.5 md:!px-2 !py-0.5 md:!py-1 !text-[9px] md:!text-[10px] !rounded-md !text-gray-800 !flex !items-center !gap-1.5 !transition-colors !hover:bg-gray-100 !hover:border-gray-300"
    >
      <Search className="!size-2.5 md:!size-3 !text-gray-500" />
      <span className="!font-medium">{keyword}</span>
      <Badge
        variant="outline"
        className="!text-[7px] md:!text-[8px] !ml-1 !px-1 !py-0 !bg-gray-100 !opacity-0 !group-hover:opacity-100 !transition-opacity hidden sm:inline-flex"
      >
        {Math.floor(Math.random() * 10) + 1} results
      </Badge>
    </div>
  );
});
KeywordItem.displayName = "KeywordItem";

const LearningItem = memo(
  ({ learning, index }: { learning: string; index: number }) => {
    return (
      <div className="!group !bg-green-50 !border !border-green-200 !p-2 md:!p-2.5 !text-[9px] md:!text-[10px] !rounded-md !text-gray-800 !transition-colors !hover:bg-green-100 !hover:border-green-300">
        <div className="!flex !items-center !gap-1.5 !mb-1">
          <LightbulbIcon className="!size-3 md:!size-3.5 !text-green-600" />
          <span className="!font-medium !text-green-800">
            Insight {index + 1}
          </span>
        </div>
        <p className="!text-gray-700 leading-4">{learning}</p>
      </div>
    );
  }
);
LearningItem.displayName = "LearningItem";

interface ProgressBarProps {
  progressPercentage: number;
  completedQueries: number;
  totalQueries: number;
}

const ProgressBar = memo(
  ({
    progressPercentage,
    completedQueries,
    totalQueries,
  }: ProgressBarProps) => {
    return (
      <div className="!px-2 md:!px-3 !py-2 !border-b !bg-gray-50">
        <div className="!flex !items-center !justify-between !mb-1 flex-wrap gap-1">
          <div className="!flex !items-center !gap-1.5">
            <span className="!text-[10px] !font-medium !text-gray-700">
              Research Progress
            </span>
            <Badge
              variant="outline"
              className="!text-[9px] !px-1.5 !py-0 !bg-blue-50 !border-blue-200 !text-blue-700"
            >
              {progressPercentage}%
            </Badge>
          </div>
          <span className="!text-[9px] md:!text-[10px] !text-gray-500">
            {completedQueries} of {totalQueries} queries completed
          </span>
        </div>
        <div className="!h-1.5 !w-full !bg-gray-200 !rounded-full !overflow-hidden">
          <div
            className="!h-full !bg-blue-500 !rounded-full !transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  }
);
ProgressBar.displayName = "ProgressBar";

const ActivityBar = ({
  thinking = "Analyzing sources and generating insights based on the research query...",
  searchingKeywords = [],
  readingSources = [],
  learnings = [],
  onExpand,
  onShare,
  onOpenInNew,
  onCopy,
  onSave,
  onFilter,
  completedQueries = 0,
  currentBreadth = 0,
  currentDepth = 0,
  totalBreadth = 0,
  totalDepth = 0,
  totalQueries = 0,
  currentQuery = "",
  className = "",
}: ActivityBarProps) => {
  const [activeTab, setActiveTab] = useState<"research" | "sources">(
    "research"
  );
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const progressPercentage = useMemo(
    () =>
      Math.min(
        100,
        Math.round((completedQueries / Math.max(1, totalQueries)) * 100)
      ),
    [completedQueries, totalQueries]
  );

  // Toggle section expansion - memoized callback
  const toggleSection = useCallback((section: string): void => {
    setExpandedSection((prevSection: string | null) =>
      prevSection === section ? null : section
    );
  }, []);

  // Toggle container expansion - memoized callback
  const toggleExpand = useCallback((): void => {
    setIsExpanded((prev: boolean) => !prev);
    if (onExpand) onExpand();
  }, [onExpand]);

  // Calculate grid columns based on screen size - memoized
  const gridColumns = useMemo((): string => {
    if (screenWidth < 640) return "!grid-cols-1";
    if (screenWidth < 1024) return isExpanded ? "!grid-cols-2" : "!grid-cols-1";
    return isExpanded ? "!grid-cols-3" : "!grid-cols-2";
  }, [screenWidth, isExpanded]);

  // Memoize the limited sources array
  const limitedSources = useMemo(() => {
    if (!readingSources || readingSources.length === 0) return [];

    const limit =
      expandedSection === "sources" || isExpanded
        ? readingSources.length
        : isMobile
        ? 2
        : 4;
    return readingSources.slice(0, limit);
  }, [readingSources, expandedSection, isExpanded, isMobile]);

  // Memoize the limited learnings array
  const limitedLearnings = useMemo(() => {
    if (!learnings || learnings.length === 0) return [];

    const limit =
      expandedSection === "learnings" || isExpanded
        ? learnings.length
        : isMobile
        ? 2
        : 3;
    return learnings.slice(0, limit);
  }, [learnings, expandedSection, isExpanded, isMobile]);

  // Debounced resize handler
  useEffect(() => {
    if (typeof window === "undefined") return;

    let resizeTimer: ReturnType<typeof setTimeout>;

    const handleResize = (): void => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setScreenWidth(window.innerWidth);
        setIsMobile(window.innerWidth < 768);
      }, 100);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Ensure we have valid arrays for keywords and sources
  const keywords = searchingKeywords || [];
  const sources = readingSources || [];
  const insights = learnings || [];

  return (
    <motion.div
      ref={containerRef}
      className={`!bg-white !rounded-md !border !overflow-hidden w-full ${className}`}
      animate={{
        width: "100%",
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
      }}
      initial={false}
      layout
    >
      {/* Header with tabs */}
      <div className="!flex !items-center !justify-between !px-2 md:!px-3 !py-2 !border-b">
        <div className="!flex !gap-1 md:!gap-2">
          <button
            onClick={() => setActiveTab("research")}
            className={`!flex !items-center !px-1.5 md:!px-2.5 !py-1 md:!py-1.5 !rounded-md !text-xs !font-medium !transition-colors !bg-white !text-gray-900`}
          >
            <Sparkles className="!mr-1 md:!mr-1.5 !size-3 md:!size-3.5" />
            <span>Deep Research</span>
          </button>
        </div>

        <div className="!flex !items-center !gap-1 md:!gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="!h-6 md:!h-7 !px-1.5 md:!px-2 !hover:bg-gray-50 cursor-pointer"
                  onClick={toggleExpand}
                >
                  {isExpanded ? (
                    <Minimize2 className="!size-3 md:!size-3.5" />
                  ) : (
                    <Expand className="!size-3 md:!size-3.5" />
                  )}
                  <span className="!text-[10px] !font-medium hidden sm:inline ml-1">
                    {isExpanded ? "Collapse" : "Expand"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isExpanded ? "Collapse" : "Expand"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Research Progress Bar */}
      <ProgressBar
        progressPercentage={progressPercentage}
        completedQueries={completedQueries}
        totalQueries={totalQueries}
      />

      {/* Main content area */}
      <motion.div
        animate={{
          height: isExpanded
            ? isMobile
              ? "300px"
              : "460px"
            : isMobile
            ? "220px"
            : "260px",
          transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
        }}
        initial={false}
        layout
      >
        <ScrollArea className="h-full" scrollHideDelay={50}>
          <div className="!px-2 md:!px-3 pt-3 pb-10">
            <div className="!flex">
              {/* Stepper */}
              <div className="!relative !flex !flex-col !items-center">
                <div className="!w-4 md:!w-5 !h-4 md:!h-5 !rounded-full !bg-blue-500 !flex !justify-center !items-center !shrink-0 !z-10">
                  <Check className="!size-2.5 md:!size-3 !text-white" />
                </div>
                {/* Stepper line */}
                <div className="!w-0.5 !bg-blue-200 !absolute !top-4 md:!top-5 !bottom-0 !h-[calc(100%-16px)] md:!h-[calc(100%-20px)]"></div>
              </div>

              {/* Stepper content */}
              <div className="!space-y-3 md:!space-y-4 !pl-3 md:!pl-4 !flex-1">
                {/* Learnings section - NEW */}
                {insights.length > 0 && (
                  <div className="!space-y-2">
                    <div
                      className="!flex !items-center !justify-between !cursor-pointer"
                      onClick={() => toggleSection("learnings")}
                    >
                      <div className="!flex !items-center !gap-1.5">
                        <Brain className="!size-3 md:!size-3.5 !text-green-600" />
                        <p className="!text-[10px] md:!text-[11px] !font-medium !text-gray-900">
                          Key Insights
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="!text-[8px] md:!text-[9px] !px-1.5 !py-0 !bg-green-50 !text-green-700 !border-green-200"
                      >
                        {insights.length} found
                      </Badge>
                    </div>
                    <div
                      className={`!space-y-2 ${
                        expandedSection === "learnings" || isExpanded
                          ? ""
                          : "!max-h-40 md:!max-h-48 !overflow-hidden !relative"
                      }`}
                    >
                      <div className="!space-y-2">
                        {limitedLearnings.map((learning, index) => (
                          <LearningItem
                            key={`learning-${index}`}
                            learning={learning}
                            index={index}
                          />
                        ))}
                      </div>
                      {expandedSection !== "learnings" &&
                        !isExpanded &&
                        insights.length > (isMobile ? 2 : 3) && (
                          <div className="!absolute !inset-x-0 !bottom-0 !h-10 md:!h-12 !bg-gradient-to-t !from-white !to-transparent !pointer-events-none"></div>
                        )}
                    </div>
                    {insights.length > (isMobile ? 2 : 3) && !isExpanded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!h-6 md:!h-8 !text-[9px] md:!text-[10px] !w-full !text-gray-600 !hover:bg-gray-100 cursor-pointer"
                        onClick={() => toggleSection("learnings")}
                      >
                        {expandedSection === "learnings"
                          ? "Show fewer insights"
                          : `Show all ${insights.length} insights`}
                        <ChevronRight
                          className={`!ml-1 !size-2.5 md:!size-3 !transition-transform ${
                            expandedSection === "learnings" ? "!rotate-90" : ""
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                )}

                {/* Searching section */}
                {keywords.length > 0 && (
                  <div className="!space-y-2">
                    <div
                      className="!flex !items-center !justify-between !cursor-pointer"
                      onClick={() => toggleSection("search")}
                    >
                      <div className="!flex !items-center !gap-1.5">
                        <Search className="!size-3 md:!size-3.5 !text-gray-600" />
                        <p className="!text-[10px] md:!text-[11px] !font-medium !text-gray-900">
                          Search Queries
                        </p>
                      </div>
                    </div>
                    <div
                      className={`!space-y-2 ${
                        expandedSection === "search" || isExpanded
                          ? ""
                          : "!max-h-16 md:!max-h-20 !overflow-hidden !relative"
                      }`}
                    >
                      <div className="!flex !flex-wrap !gap-1 md:!gap-1.5">
                        {keywords.map((keyword, index) => (
                          <KeywordItem
                            key={`keyword-${index}`}
                            keyword={keyword}
                            index={index}
                          />
                        ))}
                      </div>
                      {expandedSection !== "search" &&
                        !isExpanded &&
                        keywords.length > 4 && (
                          <div className="!absolute !inset-x-0 !bottom-0 !h-8 md:!h-10 !bg-gradient-to-t !from-white !to-transparent !pointer-events-none"></div>
                        )}
                    </div>
                    {keywords.length > 4 && !isExpanded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!h-6 md:!h-8 !text-[9px] md:!text-[10px] !w-full !text-gray-600 !hover:bg-gray-100 cursor-pointer"
                        onClick={() => toggleSection("search")}
                      >
                        {expandedSection === "search"
                          ? "Show less"
                          : "Show all queries"}
                        <ChevronRight
                          className={`!ml-1 !size-2.5 md:!size-3 !transition-transform ${
                            expandedSection === "search" ? "!rotate-90" : ""
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                )}

                {/* Reading section */}
                {sources.length > 0 && (
                  <div className="!space-y-2">
                    <div
                      className="!flex !items-center !justify-between !cursor-pointer flex-wrap gap-1"
                      onClick={() => toggleSection("sources")}
                    >
                      <div className="!flex !items-center !gap-1.5">
                        <BookOpen className="!size-3 md:!size-3.5 !text-gray-600" />
                        <p className="!text-[10px] md:!text-[11px] !font-medium !text-gray-900">
                          Sources
                        </p>
                      </div>
                      <div className="!flex !items-center !gap-1 md:!gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className="!text-[8px] md:!text-[9px] !flex !items-center !px-1.5 !py-0 !bg-gray-50"
                        >
                          <Clock className="!size-2 md:!size-2.5 !mr-0.5" />
                          Updated
                        </Badge>
                        <span className="!text-[9px] md:!text-[10px] !text-gray-500">
                          {sources.length} found
                        </span>
                      </div>
                    </div>
                    <div
                      className={`!space-y-2 ${
                        expandedSection === "sources" || isExpanded
                          ? ""
                          : "!max-h-32 md:!max-h-40 !overflow-hidden !relative"
                      }`}
                    >
                      <div className={`!grid ${gridColumns} !gap-2`}>
                        {limitedSources.map((source, index) => (
                          <SourceItem
                            key={`source-${index}`}
                            source={source}
                            index={index}
                          />
                        ))}

                        {sources.length > (isMobile ? 2 : 4) &&
                          expandedSection !== "sources" &&
                          !isExpanded && (
                            <Link
                              href="#"
                              aria-label="View more sources"
                              className="!flex !flex-col !items-center !justify-center !border !border-dashed !border-gray-300 !rounded-md !p-2 !text-gray-500 !hover:bg-gray-50 !hover:text-gray-700 !transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                toggleSection("sources");
                              }}
                            >
                              <span className="!font-medium !text-[9px] md:!text-[10px]">
                                +{sources.length - (isMobile ? 2 : 4)} more
                                sources
                              </span>
                              <span className="!text-[7px] md:!text-[8px] !text-gray-400 !mt-0.5">
                                Click to view all
                              </span>
                            </Link>
                          )}
                      </div>
                      {expandedSection !== "sources" &&
                        !isExpanded &&
                        sources.length > (isMobile ? 2 : 4) && (
                          <div className="!absolute !inset-x-0 !bottom-0 !h-10 md:!h-12 !bg-gradient-to-t !from-white !to-transparent !pointer-events-none"></div>
                        )}
                    </div>
                    {sources.length > (isMobile ? 2 : 4) &&
                      expandedSection === "sources" &&
                      !isExpanded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!h-6 !text-[9px] md:!text-[10px] !w-full !text-gray-600 !hover:bg-gray-100"
                          onClick={() => toggleSection("sources")}
                        >
                          Show fewer sources
                          <ChevronRight className="!ml-1 !size-2.5 md:!size-3 !rotate-90" />
                        </Button>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </motion.div>

      {/* Footer */}
      <div className="!border-t !py-1.5 md:!py-2 !px-2 md:!px-3 !flex !items-center !justify-between !bg-gray-50">
        <div className="!flex !items-center !gap-1 md:!gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className="!bg-blue-50 !border-blue-200 !text-blue-700 !text-[8px] md:!text-[9px] !px-1 md:!px-1.5 !py-0 md:!py-0.5"
          >
            <Sparkles className="!mr-0.5 md:!mr-1 !size-2.5 md:!size-3" />
            <span className="hidden xs:inline">AI Web Search</span>
            <span className="xs:hidden">AI Search</span>
          </Badge>
          {insights.length > 0 && (
            <>
              <div className="!size-1 !rounded-full !bg-gray-300" />
              <Badge
                variant="outline"
                className="!bg-green-50 !border-green-200 !text-green-700 !text-[8px] md:!text-[9px] !px-1 md:!px-1.5 !py-0 md:!py-0.5"
              >
                <Brain className="!mr-0.5 md:!mr-1 !size-2.5 md:!size-3" />
                <span>{insights.length} Insights</span>
              </Badge>
            </>
          )}
          <div className="!size-1 !rounded-full !bg-gray-300 hidden sm:block" />
          <span className="!text-[9px] md:!text-[10px] !text-gray-500 hidden sm:inline">
            Last updated just now
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(ActivityBar);
