import { motion } from "framer-motion";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import TxLogo from "./tx-logo";
import { BookOpen, Globe, Search } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const MAX_HEIGHT = "3.5rem";

export default function ChatHeader() {
  const [scrollY, setScrollY] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }

      setScrollY(currentScrollY);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);
  return (
    <motion.header
      className={cn(
        "w-full fixed top-0 right-0 flex justify-center z-10 border-b"
      )}
      style={{ height: MAX_HEIGHT }}
      initial={{
        y: 0,
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
      }}
      animate={{
        y: isHeaderVisible ? 0 : -60,
        backdropFilter: `blur(${8 + scrollY * 0.05}px)`,
        backgroundColor: `rgba(255, 255, 255, ${0.8 + scrollY * 0.001})`,
      }}
      transition={{
        y: { type: "spring", stiffness: 300, damping: 30 },
        backdropFilter: { duration: 0.3 },
        backgroundColor: { duration: 0.3 },
      }}
    >
      <div className="flex items-center justify-between px-6 py-2 w-full max-w-7xl">
        <Link href={"/"} className="flex items-center">
          <TxLogo className="w-8 h-8" />
        </Link>

        <div className="flex items-center space-x-1">
          <Link href="/">
            <Button
              size="sm"
              className="ml-1 h-8 px-3 cursor-pointer rounded-full bg-gradient-to-tr from-foreground/80 to-black text-white text-xs"
            >
              <Globe />
              <span>New Research</span>
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
