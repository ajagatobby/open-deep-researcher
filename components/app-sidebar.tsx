"use client";
import React, { useState } from "react";
import { PlusIcon, TrashIcon, LogOut, Loader } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import TxLogo from "./tx-logo";
import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import { db } from "@/dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function AppSidebar() {
  const pathname = usePathname();

  const { signOut } = useAuth();
  const [isDeleting, setIsDelecting] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();
  const chats = useLiveQuery(() => db.getChatsByUserId());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Sidebar className="flex flex-col">
      <SidebarContent className="!px-1 flex-grow bg-white">
        <SidebarGroup>
          <SidebarGroupContent className="flex items-center justify-between  w-full">
            <Link href="/" className="flex items-center">
              <TxLogo className="w-8 h-8" />
            </Link>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem
                onClick={() => {
                  router.push(`/`);

                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <SidebarMenuButton className="bg-gradient-to-t from-black to-foreground text-white blue-button cursor-pointer">
                  <PlusIcon />
                  <span>New chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="!px-2">
          <SidebarGroupLabel className="!px-1.5">Today</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="!space-y-0.5">
              {!isLoaded ? (
                Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton asChild className="h-6 !px-1.5">
                        <div className="flex items-center justify-between w-full">
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
              ) : chats?.length === 0 ? (
                <SidebarMenuItem>
                  <div className="text-xs text-muted-foreground/70 py-2 px-1.5">
                    No chats yet. Start a new conversation!
                  </div>
                </SidebarMenuItem>
              ) : (
                chats &&
                chats?.map((item, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      className={cn(
                        "h-6 !px-2 flex items-center justify-between w-full cursor-pointer",
                        pathname === `/${item.id}` ? "bg-accent text-black" : ""
                      )}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => {
                        router.push(`/${item.id}`);
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                    >
                      <span
                        className={cn(
                          "text-xs text-foreground/70 hover:text-foreground truncate overflow-hidden max-w-[95%] opacity-75 group-hover:opacity-100",
                          pathname === `/${item.id}` ? "text-black" : ""
                        )}
                      >
                        {item.title}
                      </span>
                      {hoveredItem === item.id &&
                        (isDeleting ? (
                          <Loader className="size-3 animate-spin" />
                        ) : (
                          <TrashIcon
                            onClick={async (e) => {
                              setIsDelecting(true);
                              e.stopPropagation();
                              await db.deleteChat(item.id);
                              setIsDelecting(false);
                              router.push("/");
                            }}
                            className="size-3 text-muted-foreground"
                          />
                        ))}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User profile footer with skeleton loader */}
      <SidebarFooter className="bg-white">
        <div className="mt-auto border-t !p-3">
          {!user ? (
            <SignInButton>
              <Button className="w-full black-button cursor-pointer hover:opacity-95">
                Sign in
              </Button>
            </SignInButton>
          ) : (
            <div className="flex items-center space-x-3">
              {!user ? (
                <>
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </>
              ) : (
                <>
                  <Avatar className="h-8 w-8">
                    {user?.hasImage ? (
                      <AvatarImage
                        src={user.imageUrl}
                        alt={user.username ?? user.id}
                      />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user &&
                          getInitials(
                            (user.username as string) ||
                              user.emailAddresses[0].emailAddress
                          )}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.emailAddresses[0].emailAddress}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await signOut();
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
