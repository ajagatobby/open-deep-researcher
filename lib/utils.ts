import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FaviconOptions {
  useFallbacks?: boolean;
  useGoogleFavicon?: boolean;
  includeSizeParam?: boolean;
  size?: number;
}

function getFavicon(url: string, options: FaviconOptions = {}): string | null {
  const {
    useFallbacks = true,
    useGoogleFavicon = true,
    includeSizeParam = true,
    size = 32,
  } = options;

  if (!url) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const origin = urlObj.origin;

    const faviconSources: string[] = [];

    faviconSources.push(`${origin}/favicon.ico`);

    if (useFallbacks) {
      faviconSources.push(`${origin}/favicon.png`);
      faviconSources.push(`${origin}/assets/favicon.ico`);
      faviconSources.push(`${origin}/images/favicon.ico`);
      faviconSources.push(`${origin}/static/favicon.ico`);
    }

    if (useGoogleFavicon) {
      let googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}`;
      if (includeSizeParam) {
        googleFaviconUrl += `&sz=${size}`;
      }
      faviconSources.push(googleFaviconUrl);
    }

    return faviconSources[0] as string;
  } catch (error) {
    console.error("Error getting favicon:", error);
    return null;
  }
}

async function checkFaviconExists(faviconUrl: string): Promise<boolean> {
  try {
    const response = await fetch(faviconUrl, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function getBestFavicon(
  url: string,
  options: FaviconOptions = {}
): Promise<string | null> {
  const faviconSources: string[] = [];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const origin = urlObj.origin;

    faviconSources.push(`${origin}/favicon.ico`);
    faviconSources.push(`${origin}/favicon.png`);

    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const iconLinks = doc.querySelectorAll(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
      );
      iconLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (href) {
          const faviconUrl = href.startsWith("http")
            ? href
            : new URL(href, origin).href;
          faviconSources.push(faviconUrl);
        }
      });
    } catch (e) {
      console.log("Could not fetch HTML to extract favicon");
    }

    faviconSources.push(
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=${
        options.size || 32
      }`
    );

    for (const source of faviconSources) {
      if (await checkFaviconExists(source)) {
        return source;
      }
    }

    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=${
      options.size || 32
    }`;
  } catch (error) {
    console.error("Error finding best favicon:", error);
    return null;
  }
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const sleep = async (ms: number) =>
  await new Promise((resolve) => setTimeout(resolve, ms));

const logger = (
  status: "error" | "warning" | "success" | "info",
  message: any,
  context?: Record<string, any>
) => {
  const timestamp = new Date().toISOString();
  const icons = {
    error: "🛑",
    warning: "🟠",
    success: "🟢",
    info: "ℹ️",
  };

  const statusText = status.toUpperCase();
  const formattedMessage =
    typeof message === "object" ? JSON.stringify(message, null, 2) : message;
  const contextInfo = context
    ? `\nContext: ${JSON.stringify(context, null, 2)}`
    : "";

  const logMessage = `[${timestamp}] ${icons[status]} ${statusText}: ${formattedMessage}${contextInfo}`;

  switch (status) {
    case "error":
      console.error(logMessage);
      break;
    case "warning":
      console.warn(logMessage);
      break;
    case "success":
    case "info":
    default:
      console.log(logMessage);
  }

  // You could also send logs to a monitoring service here

  return logMessage;
};

export function getDomainFromUrl(url: string): string {
  try {
    // Handle invalid URLs
    if (!url || typeof url !== "string") {
      return "Unknown source";
    }

    // Add protocol if missing to make URL parsing work
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const urlObj = new URL(url);
    let domain = urlObj.hostname;

    // Remove 'www.' prefix if present
    if (domain.startsWith("www.")) {
      domain = domain.substring(4);
    }

    // For common domains, try to extract the organization name
    // For example, convert 'github.com' to 'GitHub'
    const domainMap: Record<string, string> = {
      "github.com": "GitHub",
      "stackoverflow.com": "Stack Overflow",
      "medium.com": "Medium",
      "wikipedia.org": "Wikipedia",
      "arxiv.org": "arXiv",
      "youtube.com": "YouTube",
      "twitter.com": "Twitter",
      "linkedin.com": "LinkedIn",
      "facebook.com": "Facebook",
      "reddit.com": "Reddit",
      "google.com": "Google",
      "nytimes.com": "New York Times",
      "washingtonpost.com": "Washington Post",
      "cnn.com": "CNN",
      "bbc.com": "BBC",
      "bbc.co.uk": "BBC",
      "theguardian.com": "The Guardian",
      "forbes.com": "Forbes",
    };

    // Check if domain is in our mapping
    for (const [domainKey, readableName] of Object.entries(domainMap)) {
      if (domain === domainKey || domain.endsWith("." + domainKey)) {
        return readableName;
      }
    }

    // For subdomains, try to extract main domain but keep it clean
    const parts = domain.split(".");
    if (parts.length > 2) {
      // Get the organization part (usually second-to-last part)
      // Example: for 'docs.example.com', return 'Example'
      const orgPart = parts[parts.length - 2];
      return orgPart.charAt(0).toUpperCase() + orgPart.slice(1);
    }

    // For simple domains, just return first part capitalized
    // Example: 'example.com' becomes 'Example'
    const mainPart = parts[0];
    return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
  } catch (error) {
    console.error("Error parsing URL:", error);
    return "Unknown source";
  }
}

const getTimeBasedGreeting = (name: string) => {
  const currentHour = new Date().getHours();

  let greeting;
  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour >= 12 && currentHour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  return `${greeting} ${name}.`;
};

export {
  getFavicon,
  getBestFavicon,
  checkFaviconExists,
  sleep,
  logger,
  getTimeBasedGreeting,
};
