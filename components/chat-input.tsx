import React, { ChangeEvent } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import {
  ArrowUp,
  GlobeLock,
  Lightbulb,
  Loader,
  StopCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInputProps } from "@/types";

export default function ChatInput({
  value,
  onChange,
  submit,
  loading,
  setSelectedOptions,
  selectOptions,
  handleStop,
  isMobile,
}: ChatInputProps) {
  return (
    <div
      className="w-full fixed bottom-0 left-0 right-0 flex justify-center bg-gradient-to-t from-gray-50 via-gray-50 pt-10"
      style={{ left: isMobile ? 0 : "8rem" }}
    >
      <div className="max-w-3xl w-full px-4 pb-4">
        <div className="w-full relative rounded-xl shadow bg-white">
          <Textarea
            className="w-full outline-none focus:!outline-none ring-0 focus:!ring-0 h-[5vh] max-h-[5vh] !p-4 bg-transparent !text-sm !opacity-70 resize-none border-0 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01)]"
            placeholder="Ask follow-up"
            onChange={onChange}
            value={value}
          />

          <div className="flex items-center justify-between !p-2 border-none">
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full hover:border-blue-400 hover:bg-blue-50 hover:text-blue-400 text-xs flex items-center gap-1 !px-2 text-foreground/40 border-foreground/30 cursor-pointer bg-transparent h-7",
                  selectOptions === "DEEP_RESEARCH" &&
                    "text-blue-400 border-blue-400 cursor-pointer bg-blue-50 h-7 hover:bg-blue-100 hover:text-blue-400"
                )}
                onClick={() =>
                  setSelectedOptions({
                    value:
                      selectOptions === "DEEP_RESEARCH"
                        ? "REGULAR"
                        : "DEEP_RESEARCH",
                  })
                }
              >
                <GlobeLock className="w-3 h-3" />
                <span>Deep research</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full hover:border-blue-400 hover:bg-blue-50 hover:text-blue-400 text-xs flex items-center gap-1 !px-2 text-foreground/40 border-foreground/30 cursor-pointer bg-transparent h-7",
                  selectOptions === "THINK" &&
                    "text-blue-400 border-blue-400 cursor-pointer bg-blue-50 h-7 hover:bg-blue-100 hover:text-blue-400"
                )}
                onClick={() =>
                  setSelectedOptions({
                    value: selectOptions === "THINK" ? "REGULAR" : "THINK",
                  })
                }
              >
                <Lightbulb className="w-3 h-3" />
                <span>Think</span>
              </Button>
            </div>

            <div className="flex items-center space-x-3.5">
              {loading && (
                <Button
                  size="icon"
                  className={`h-8 w-8 rounded-full cursor-pointer hover:bg-black/80`}
                  onClick={handleStop}
                >
                  <StopCircle className={`size-5 text-white cursor-pointer`} />
                </Button>
              )}

              <Button
                size="icon"
                className={`h-8 w-8 rounded-full cursor-pointer ${
                  value
                    ? "bg-black hover:bg-gray-800"
                    : "bg-gray-200 cursor-not-allowed"
                }`}
                disabled={!value || loading}
                onClick={submit}
              >
                {loading ? (
                  <Loader className="size-3 animate-spin text-foreground" />
                ) : (
                  <ArrowUp
                    className={`size-5 ${
                      value ? "text-white" : "text-gray-400 cursor-pointer"
                    }`}
                  />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
