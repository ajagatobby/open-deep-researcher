"use client";
import React, { useEffect, useState } from "react";
import SearchInput from "../search-input";
import { generateUUID, getTimeBasedGreeting, logger } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { mobileSuggestions, suggestions } from "@/lib/mock";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/hooks/store/use-chat";
import { generateId } from "ai";
import { useUser } from "@clerk/nextjs";
import { generateChatTitle } from "@/lib/agents/tools";
import { useLocalStorage } from "@/hooks";

export default function HomeLayout() {
  const [selectedOption, setSelectedOption] = useLocalStorage<{
    value: string;
  }>("model-type", {
    value: "REGULAR",
  });
  const [loaded, setLoaded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const setQuery = useChatStore((state) => state.setQuery);
  const addMessage = useChatStore((state) => state.addMessage);
  const setTitle = useChatStore((state) => state.setChatTitle);
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoaded(true);

    const timer = setTimeout(() => {
      setShowSuggestions(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const categoryVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (!searchQuery) {
      toast.warning("You have to enter a search query!");
      return;
    }
    setQuery(searchQuery);
    const id = generateUUID();

    const title = await generateChatTitle({ prompt: searchQuery });

    setTitle(title);
    addMessage(
      {
        content: searchQuery,
        role: "user",
        id: `msg-L${generateId()}`,
        parts: [],
      },
      id
    );
    router.push("/" + id);
  };

  return (
    <div className="flex flex-col justify-center items-center w-full sm:h-screen h-[80vh]">
      <div className="max-w-2xl w-full mx-auto space-y-8 sm:p-0 p-2">
        <div>
          <motion.h1
            className="text-2xl capitalize"
            initial={{ opacity: 0, filter: "blur(3px)", y: 10 }}
            animate={{
              opacity: loaded ? 1 : 0,
              filter: loaded ? "blur(0px)" : "blur(3px)",
              y: loaded ? 0 : 10,
            }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            {getTimeBasedGreeting(user?.firstName || "Dear")}
          </motion.h1>
          <motion.h1
            className="text-2xl font-light text-foreground opacity-60"
            initial={{ opacity: 0, filter: "blur(3px)", y: 10 }}
            animate={{
              opacity: loaded ? 0.6 : 0,
              filter: loaded ? "blur(0px)" : "blur(3px)",
              y: loaded ? 0 : 10,
            }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            What research do you want to conduct?
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: loaded ? 1 : 0,
            y: loaded ? 0 : 20,
          }}
          transition={{ duration: 0.3, delay: 1.0 }}
        >
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            handleSubmit={handleSubmit}
            loading={loading}
            selectOptions={selectedOption.value}
            setSelectedOptions={setSelectedOption}
          />

          {/* Desktop Search Suggestions */}
          <AnimatePresence key="desktop-suggestions">
            {showSuggestions && (
              <motion.div
                className="mt-6 sm:grid grid-cols-1 md:grid-cols-3 gap-5 hidden"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
              >
                {suggestions.map((category, index) => (
                  <motion.div
                    key={`desktop-category-${index}`}
                    className="bg-white/5 backdrop-blur-sm rounded-md p-4"
                    variants={categoryVariants}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-gray-100/20 h-5 w-5 rounded-full flex items-center justify-center">
                        {category.icon}
                      </div>
                      <span className="text-xs font-medium text-gray-500/80">
                        {category.title}
                      </span>
                    </div>

                    <motion.ul
                      className="space-y-1.5"
                      variants={containerVariants}
                    >
                      {category.items.map((item, itemIndex) => (
                        <motion.li
                          key={`desktop-item-${index}-${itemIndex}`}
                          variants={itemVariants}
                          transition={{ delay: 0.1 * itemIndex }}
                          className="cursor-pointer"
                        >
                          <button
                            className="w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 relative overflow-hidden group cursor-pointer"
                            onClick={() =>
                              setSearchQuery(
                                `Make an extensive deep research on ${item}`
                              )
                            }
                          >
                            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"></span>
                            <Search className="h-3 w-3 text-gray-400/80 relative z-10 group-hover:text-gray-600 transition-colors duration-300" />
                            <span className="text-gray-700/90 text-xs relative z-10 group-hover:text-gray-900 transition-colors duration-300">
                              {item}
                            </span>
                          </button>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Search Suggestions */}
          <AnimatePresence key="mobile-suggestions">
            {showSuggestions && (
              <motion.div
                className="mt-6 sm:hidden grid-cols-1 md:grid-cols-3 gap-5 grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
              >
                {mobileSuggestions.map((category, index) => (
                  <motion.div
                    key={`mobile-category-${index}`}
                    className="bg-white/5 backdrop-blur-sm rounded-md p-4"
                    variants={categoryVariants}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-gray-100/20 h-5 w-5 rounded-full flex items-center justify-center">
                        {category.icon}
                      </div>
                      <span className="text-xs font-medium text-gray-500/80">
                        {category.title}
                      </span>
                    </div>

                    <motion.ul
                      className="space-y-1.5"
                      variants={containerVariants}
                    >
                      {category.items.map((item, itemIndex) => (
                        <motion.li
                          key={`mobile-item-${index}-${itemIndex}`}
                          variants={itemVariants}
                          transition={{ delay: 0.1 * itemIndex }}
                          className="cursor-pointer"
                        >
                          <button
                            className="w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 relative overflow-hidden group cursor-pointer"
                            onClick={() =>
                              setSearchQuery(
                                `Make an extensive deep research on ${item}`
                              )
                            }
                          >
                            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"></span>
                            <Search className="h-3 w-3 text-gray-400/80 relative z-10 group-hover:text-gray-600 transition-colors duration-300" />
                            <span className="text-gray-700/90 text-xs relative z-10 group-hover:text-gray-900 transition-colors duration-300">
                              {item}
                            </span>
                          </button>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
