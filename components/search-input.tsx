import React, { ChangeEvent } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowUp, GlobeLock, Lightbulb, Loader } from "lucide-react";
import { SearchInputProps } from "@/types";
import { cn } from "@/lib/utils";
import { SignInButton, useAuth } from "@clerk/nextjs";

export default function SearchInput({
  value,
  onChange,
  handleSubmit,
  loading,
  setSelectedOptions,
  selectOptions,
}: SearchInputProps) {
  const { isSignedIn } = useAuth();
  return (
    <div className="w-full relative rounded-xl border bg-white shadow-sm">
      <Textarea
        className="w-full outline-none focus:!outline-none ring-0 focus:!ring-0 h-[10vh] max-h-[10vh] sm:p-4 p-2 bg-transparent !text-sm !opacity-70 resize-none border-0 shadow-none"
        placeholder="Ask me anything"
        value={value}
        onChange={onChange}
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

        {isSignedIn ? (
          <Button
            size="icon"
            className={`h-8 cursor-pointer w-8 rounded-full ${
              value
                ? "bg-black hover:bg-gray-800"
                : "bg-gray-200 cursor-not-allowed"
            }`}
            disabled={!value || loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <Loader className="size-3 animate-spin text-white" />
            ) : (
              <ArrowUp
                className={`size-5 ${
                  value ? "text-white" : "text-gray-400 cursor-pointer"
                }`}
              />
            )}
          </Button>
        ) : (
          <SignInButton>
            <Button
              size="icon"
              className={`h-8 cursor-pointer w-8 rounded-full ${
                value
                  ? "bg-black hover:bg-gray-800"
                  : "bg-gray-200 cursor-not-allowed"
              }`}
              disabled={!value || loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <Loader className="size-3 animate-spin text-white" />
              ) : (
                <ArrowUp
                  className={`size-5 ${
                    value ? "text-white" : "text-gray-400 cursor-pointer"
                  }`}
                />
              )}
            </Button>
          </SignInButton>
        )}
      </div>
    </div>
  );
}
