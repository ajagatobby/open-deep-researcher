//@ts-nocheck

"use client";
import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
import { MemoizedReactMarkdown } from "./ui/markdown";
import remarkToc from "remark-toc";
import { Citing } from "./custom-link";
import { CodeBlock } from "./ui/code-block";
import { PluggableList } from "react-markdown/lib/react-markdown";
import { NormalComponents } from "react-markdown/lib/complex-types";
import { SpecialComponents } from "react-markdown/lib/ast-to-react";
import {
  Info,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Maximize2,
  ZoomIn,
} from "lucide-react";

const LATEX_PATTERN = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/;
const TASK_LIST_PATTERN = /\s*-\s*\[[xX\s]\]/;
const FOOTNOTE_PATTERN = /\[\^[^\]]+\]/;
const TABLE_PATTERN = /\|[^|]+\|/;
const IMAGE_PATTERN = /!\[[^\]]*\]\([^)]+\)/;
const DETAILS_PATTERN = /<details>[\s\S]*?<\/details>/;

const preprocessContent = (content: string): string => {
  let processed = content;

  processed = processed.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, equation) => `$$${equation}$$`
  );

  processed = processed.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, equation) => `$${equation}$`
  );

  processed = processed
    .replace(/- \[ \]/g, "- [ ] ")
    .replace(/- \[x\]/gi, "- [x] ");

  // Ensure proper footnote reference syntax
  processed = processed.replace(/\[\^(\d+)\](?!:)/g, "[^$1]:");

  // Fix table formatting for better rendering
  if (TABLE_PATTERN.test(processed)) {
    const lines = processed.split("\n");
    const processedLines = lines.map((line) => {
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        // Ensure proper spacing in table cells
        return line
          .replace(/\|([^\|]*)\|/g, "| $1 |")
          .replace(/\|\s+\|/g, "| |");
      }
      return line;
    });
    processed = processedLines.join("\n");
  }

  // Make details/summary elements more robust
  processed = processed.replace(
    /<details>\s*<summary>(.*?)<\/summary>/g,
    "<details><summary>$1</summary>"
  );

  return processed;
};

interface ChatMessageProps {
  message: string;
  className?: string;
  enableLinkPreview?: boolean;
  enableAnchorLinks?: boolean;
  enableImageZoom?: boolean;
  maxImageWidth?: number;
}

export function ChatMessage({
  message,
  className,
  enableLinkPreview = false,
  enableAnchorLinks = true,
  enableImageZoom = true,
  maxImageWidth = 800,
}: ChatMessageProps) {
  const content = message || "";

  // Detect content features
  const containsLaTeX = LATEX_PATTERN.test(content);
  const containsTaskList = TASK_LIST_PATTERN.test(content);
  const containsFootnotes = FOOTNOTE_PATTERN.test(content);
  const containsTables = TABLE_PATTERN.test(content);
  const containsImages = IMAGE_PATTERN.test(content);
  const containsDetails = DETAILS_PATTERN.test(content);

  // Process content based on detected features
  const processedContent = preprocessContent(content);

  // Configure remark plugins based on content
  const remarkPlugins = [
    remarkGfm,
    remarkMath,
    remarkEmoji,
    [remarkToc, { tight: true, ordered: true, prefix: "toc-" }],
  ];

  // Configure rehype plugins based on content
  const rehypePlugins = [
    [
      rehypeExternalLinks,
      { target: "_blank", rel: ["noopener", "noreferrer"] },
    ],
    rehypeSlug,
    rehypeSanitize,
  ];

  // Add KaTeX support if LaTeX detected
  if (containsLaTeX) {
    rehypePlugins.push([
      rehypeKatex as any,
      {
        throwOnError: false,
        errorColor: "#FF6B6B",
        macros: {
          // Common math macros
          "\\R": "\\mathbb{R}",
          "\\N": "\\mathbb{N}",
          "\\Z": "\\mathbb{Z}",
        },
      },
    ]);
  }

  // Track rendered images for zoom functionality
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Handle image zoom click
  const handleImageClick = useCallback(
    (src: string) => {
      if (enableImageZoom) {
        setZoomedImage(src);
      }
    },
    [enableImageZoom]
  );

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        // You could add a toast notification here
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  }, []);

  // Close zoomed image modal
  const closeZoomedImage = useCallback(() => {
    setZoomedImage(null);
  }, []);

  // Function to determine blockquote type and styling
  const getBlockquoteInfo = (text) => {
    text = text.toLowerCase().trim();

    if (text.startsWith("note:") || text.startsWith("note :")) {
      return {
        type: "note",
        className:
          "border-l-4 border-blue-400 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-800 pl-4 py-3 my-4 rounded-r",
        icon: (
          <Info className="h-5 w-5 text-blue-500 inline-block mr-2 flex-shrink-0" />
        ),
      };
    } else if (text.startsWith("warning:") || text.startsWith("warning :")) {
      return {
        type: "warning",
        className:
          "border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800 pl-4 py-3 my-4 rounded-r",
        icon: (
          <AlertTriangle className="h-5 w-5 text-amber-500 inline-block mr-2 flex-shrink-0" />
        ),
      };
    } else if (text.startsWith("tip:") || text.startsWith("tip :")) {
      return {
        type: "tip",
        className:
          "border-l-4 border-green-400 bg-green-50/50 dark:bg-green-950/30 dark:border-green-800 pl-4 py-3 my-4 rounded-r",
        icon: (
          <Lightbulb className="h-5 w-5 text-green-500 inline-block mr-2 flex-shrink-0" />
        ),
      };
    } else if (text.startsWith("success:") || text.startsWith("success :")) {
      return {
        type: "success",
        className:
          "border-l-4 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-800 pl-4 py-3 my-4 rounded-r",
        icon: (
          <CheckCircle2 className="h-5 w-5 text-emerald-500 inline-block mr-2 flex-shrink-0" />
        ),
      };
    }

    return {
      type: "default",
      className:
        "border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-4 italic text-gray-700 dark:text-gray-300",
      icon: null,
    };
  };

  return (
    <div className={cn("w-full relative", className)}>
      <MemoizedReactMarkdown
        rehypePlugins={rehypePlugins as PluggableList}
        remarkPlugins={remarkPlugins as PluggableList}
        remarkRehypeOptions={{
          handlers: {},
          allowDangerousHtml: true,
        }}
        components={
          {
            code({ node, inline, className, children, ...props }) {
              // Handle cursor placeholder
              if (children.length && children[0] === "▍") {
                return (
                  <span className="mt-1 cursor-default animate-pulse">▍</span>
                );
              }

              // Clean up any cursor placeholder in code
              if (children.length) {
                children[0] = (children[0] as string).replace("`▍`", "▍");
              }

              // Extract language for syntax highlighting
              const match = /language-(\w+)/.exec(className || "");
              const language = (match && match[1]) || "";
              const codeString = String(children).replace(/\n$/, "");

              // Render inline code
              if (inline) {
                return (
                  <code
                    className={cn(
                      "px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded font-mono text-[0.9em]",
                      className
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                );
              }

              // Use the custom CodeBlock component for code blocks with copy button
              return (
                <div className="relative group">
                  <CodeBlock language={language} value={codeString} />
                </div>
              );
            },

            a: ({ href, children, ...props }) => {
              const isExternal = href?.startsWith("http");

              return (
                <Citing href={href} {...props}>
                  <span>{children}</span>
                  {isExternal && (
                    <ExternalLink className="ml-0.5 inline h-3 w-3 text-gray-400" />
                  )}
                </Citing>
              );
            },

            // Enhanced table component
            // Enhanced table components
            table: ({ children, ...props }) => (
              <div className="my-6 w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <table {...props} className="w-full border-collapse text-sm">
                  {children}
                </table>
              </div>
            ),

            thead: ({ children, ...props }) => (
              <thead
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                {...props}
              >
                {children}
              </thead>
            ),

            tbody: ({ children, ...props }) => (
              <tbody
                className="divide-y divide-gray-200 dark:divide-gray-700"
                {...props}
              >
                {children}
              </tbody>
            ),

            tr: ({ children, ...props }) => (
              <tr
                className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                {...props}
              >
                {children}
              </tr>
            ),

            th: ({ children, ...props }) => (
              <th
                className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white text-left"
                {...props}
              >
                {children}
              </th>
            ),

            td: ({ children, ...props }) => (
              <td
                className="px-4 py-3 text-gray-700 dark:text-gray-300"
                {...props}
              >
                {children}
              </td>
            ),

            // Enhanced list components
            ul: ({ children, ...props }) => (
              <ul {...props} className="my-4 list-disc pl-6 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol {...props} className="my-4 list-decimal pl-6 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li {...props} className="my-0.5">
                {children}
              </li>
            ),

            // Enhanced blockquote with special handling for notes/warnings
            blockquote: ({ children, ...props }) => {
              const childrenArray = React.Children.toArray(children);
              const firstChild = childrenArray[0];

              // Default styling
              let blockquoteInfo = {
                type: "default",
                className:
                  "border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-4 italic text-gray-700 dark:text-gray-300",
                icon: null,
              };

              // Check if first line contains a note/warning indicator
              if (
                firstChild &&
                React.isValidElement(firstChild) &&
                firstChild.props.children
              ) {
                const text = String(firstChild.props.children);
                blockquoteInfo = getBlockquoteInfo(text);

                // If we detected a special blockquote type, modify the first paragraph to remove the prefix
                if (
                  blockquoteInfo.type !== "default" &&
                  React.isValidElement(firstChild)
                ) {
                  const textContent = String(firstChild.props.children);
                  const colonIndex = textContent.indexOf(":");
                  if (colonIndex !== -1) {
                    // Create a new first child without the prefix
                    const newFirstChild = React.cloneElement(
                      firstChild,
                      firstChild.props,
                      textContent.slice(colonIndex + 1).trim()
                    );
                    childrenArray[0] = newFirstChild;
                  }
                }
              }

              return (
                <div {...props} className={blockquoteInfo.className}>
                  <div className="flex">
                    {blockquoteInfo.icon && blockquoteInfo.icon}
                    <div>{childrenArray}</div>
                  </div>
                </div>
              );
            },

            // Enhanced heading components
            h1: ({ children, ...props }) => (
              <h1
                {...props}
                className="mt-6 mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100 pb-1 border-b border-gray-200 dark:border-gray-800"
                id={
                  props.id ||
                  String(children)
                    .toLowerCase()
                    .replace(/[^\w]+/g, "-")
                }
              >
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2
                {...props}
                className="mt-6 mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100 pb-0.5 border-b border-gray-200 dark:border-gray-800"
                id={
                  props.id ||
                  String(children)
                    .toLowerCase()
                    .replace(/[^\w]+/g, "-")
                }
              >
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3
                {...props}
                className="mt-5 mb-2 text-base font-semibold text-gray-900 dark:text-gray-100"
                id={
                  props.id ||
                  String(children)
                    .toLowerCase()
                    .replace(/[^\w]+/g, "-")
                }
              >
                {children}
              </h3>
            ),
            p: ({ children, ...props }) => (
              <p
                {...props}
                className="text-sm leading-6 text-gray-700 dark:text-gray-300"
              >
                {children}
              </p>
            ),

            // Enhanced horizontal rule
            hr: (props) => (
              <hr
                {...props}
                className="my-6 border-t border-gray-200 dark:border-gray-800"
              />
            ),

            // Task lists with checkboxes
            input: ({ type, checked, ...props }) => {
              if (type === "checkbox") {
                return (
                  <span
                    className={`inline-block h-4 w-4 rounded border ${
                      checked
                        ? "bg-blue-500 border-blue-500 flex items-center justify-center"
                        : "border-gray-300 dark:border-gray-600"
                    } mr-2 align-text-bottom`}
                  >
                    {checked && <Check className="h-3 w-3 text-white" />}
                  </span>
                );
              }
              return <input type={type} {...props} />;
            },

            // Enhanced image component with proper sizing and loading
            img: ({ alt, src, ...props }) => (
              <div className="my-4 relative group">
                <img
                  src={src}
                  alt={alt || ""}
                  className={cn(
                    "rounded-lg w-full",
                    enableImageZoom &&
                      "cursor-zoom-in hover:opacity-95 transition-opacity"
                  )}
                  style={{ maxWidth: `${maxImageWidth}px` }}
                  loading="lazy"
                  onClick={
                    enableImageZoom
                      ? () => handleImageClick(src || "")
                      : undefined
                  }
                  {...props}
                />
                {enableImageZoom && (
                  <button
                    onClick={() => handleImageClick(src || "")}
                    className="absolute bottom-2 right-2 p-1.5 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Zoom image"
                  >
                    <ZoomIn size={14} />
                  </button>
                )}
                {alt && (
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                    {alt}
                  </div>
                )}
              </div>
            ),

            // Enhanced details/summary (collapsible content)
            details: ({ children, ...props }) => (
              <details
                className="my-4 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden"
                {...props}
              >
                {children}
              </details>
            ),

            summary: ({ children, ...props }) => (
              <summary
                className="font-medium cursor-pointer p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                {...props}
              >
                {children}
              </summary>
            ),

            // Enhanced pre for code blocks (simplified as we're using CodeBlock)
            pre: ({ children, ...props }) => (
              <div className="my-4 rounded-lg overflow-hidden" {...props}>
                {children}
              </div>
            ),

            // Enhanced kbd for keyboard shortcuts
            kbd: ({ children, ...props }) => (
              <kbd
                className="px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm inline-flex items-center justify-center min-w-[1.6rem]"
                {...props}
              >
                {children}
              </kbd>
            ),

            // Enhanced sup/sub for footnotes and special text
            sup: ({ children, ...props }) => (
              <sup
                className="text-xs text-blue-600 dark:text-blue-400 font-medium top-[-0.5em]"
                {...props}
              >
                {children}
              </sup>
            ),

            sub: ({ children, ...props }) => (
              <sub
                className="text-xs text-gray-600 dark:text-gray-400"
                {...props}
              >
                {children}
              </sub>
            ),

            // Enhanced mark for highlighted text
            mark: ({ children, ...props }) => (
              <mark
                className="bg-yellow-100 dark:bg-yellow-800/30 px-1 rounded"
                {...props}
              >
                {children}
              </mark>
            ),
          } as unknown as Partial<
            Omit<NormalComponents, keyof SpecialComponents> & SpecialComponents
          >
        }
      >
        {processedContent}
      </MemoizedReactMarkdown>

      {/* Image Zoom Modal */}
      {enableImageZoom && zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={closeZoomedImage}
        >
          <div className="relative max-w-5xl max-h-screen p-4">
            <div className="overflow-hidden rounded-lg">
              <img
                src={zoomedImage}
                alt="Zoomed view"
                className="max-w-full max-h-[85vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
