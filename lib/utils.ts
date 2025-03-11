import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as cheerio from "cheerio"
import Papa from "papaparse"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface FeedItem {
  id: string
  url: string
  title: string
  loading?: boolean
  titleSource?: "user" | "domain" | "feed" | "auto"
}

// Extract domain from URL as a fallback for title
export const extractDomain = (url: string): string => {
  try {
    // Add protocol if missing
    let processedUrl = url
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      processedUrl = "https://" + url
    }

    const urlObj = new URL(processedUrl)

    const domain = urlObj.hostname.replace("www.", "")

    console.log("===>Extracted domain:", domain)

    return domain
  } catch (e) {
    // If URL parsing fails, return the original URL

    return url
  }
}

// Escape XML special characters
export const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case "&":
        return "&amp;"
      case "'":
        return "&apos;"
      case '"':
        return "&quot;"
      default:
        return c
    }
  })
}

// Download a file
export const downloadFile = (content: string, fileName: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Parse OPML file content
export const parseOPML = (opmlContent: string): FeedItem[] => {
  try {
    const $ = cheerio.load(opmlContent, { xmlMode: true })
    const outlines = $('outline[type="rss"], outline[xmlUrl]')

    const feeds: FeedItem[] = []

    outlines.each((_, element) => {
      const $el = $(element)
      const xmlUrl = $el.attr("xmlUrl") || ""

      if (xmlUrl) {
        const title = $el.attr("title") || $el.attr("text") || ""

        feeds.push({
          id: `import-${Date.now()}-${feeds.length}`,
          url: xmlUrl,
          title: title,
          titleSource: title ? "user" : undefined,
        })
      }
    })

    return feeds
  } catch (error) {
    console.error("Error parsing OPML:", error)
    return []
  }
}

// Generate OPML content from feeds
export const generateOPML = (feeds: FeedItem[]): string => {
  const validFeeds = feeds.filter((feed) => feed.url.trim() !== "")

  const outlines = validFeeds
    .map((feed) => {
      const title = feed.title.trim() || feed.url
      return `    <outline type="rss" text="${escapeXml(title)}" title="${escapeXml(title)}" xmlUrl="${escapeXml(feed.url)}" />`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>RSS Subscriptions</title>
  </head>
  <body>
${outlines}
  </body>
</opml>`
}

// Generate CSV content from feeds
export const generateCSV = (feeds: FeedItem[]): string => {
  const validFeeds = feeds.filter((feed) => feed.url.trim() !== "")

  // Create CSV data
  const csvData = validFeeds.map((feed) => ({
    url: feed.url,
    title: feed.title.trim() || feed.url,
  }))

  // Convert to CSV string
  return Papa.unparse(csvData)
}

