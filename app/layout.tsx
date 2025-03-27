import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { ClerkProvider, SignInButton } from "@clerk/nextjs";
import "./globals.css";
import {
  SIDEBAR_WIDTH,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cookies } from "next/headers";
import TxLogo from "@/components/tx-logo";
import Link from "next/link";
import { YouTube, Twitter } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";

const openSans = Open_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "10x Researcher",
  description:
    "Make deepresearch on topics that throughly matters using 10x ai",
  openGraph: {
    title: "10x Researcher",
    description:
      "Make deepresearch on topics that throughly matters using 10x ai",
    images: [
      {
        url: "https://a6mey415ct.ufs.sh/f/rbcyNovH7ibJeUrguduwXr0UJ7LMEtFSm2TY4cVyvkjnwdlC",
        width: 1200,
        height: 630,
        alt: "Make deepresearch on topics that throughly matters using 10x ai",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "10x Researcher",
    description:
      "Make deepresearch on topics that throughly matters using 10x ai",
    images: [
      "https://a6mey415ct.ufs.sh/f/rbcyNovH7ibJeUrguduwXr0UJ7LMEtFSm2TY4cVyvkjnwdlC",
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className={`${openSans.className} w-full mx-auto antialiased`}>
          <SidebarProvider defaultOpen={true}>
            <div className="sm:hidden fixed flex items-center justify-between w-full bg-white/10 backdrop-blur-3xl h-12 px-4 z-50">
              <SidebarTrigger />
              <TxLogo className="w-10" />
              <div className="flex items-center space-x-4 p-2">
                {session.userId ? (
                  <div className="flex items-center space-x-4 p-2">
                    <Link href="https://www.youtube.com/@blakeandersonw">
                      <YouTube className="size-4" />
                    </Link>
                    <Link href="https://www.youtube.com/@blakeandersonw">
                      <Twitter className="size-4" />
                    </Link>
                  </div>
                ) : (
                  <SignInButton>
                    <Button className="w-full black-button cursor-pointer hover:opacity-95">
                      Sign in
                    </Button>
                  </SignInButton>
                )}
              </div>
            </div>
            <AppSidebar />
            <Toaster />
            {children}
          </SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
