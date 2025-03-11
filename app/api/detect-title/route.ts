import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    // Normalize URL if needed
    let feedUrl = url
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      feedUrl = "https://" + url
    }

    // Extract domain for fallback
    let domain = ""
    try {
      const urlObj = new URL(feedUrl)
      domain = urlObj.hostname.replace("www.", "")
    } catch (e) {
      console.error("URL parsing error:", e)
    }

    // Fetch the feed with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(feedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
          "Accept-Language": "en-US,en;q=0.5",
          Referer: "https://www.google.com/",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
        redirect: "follow",
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`Failed to fetch feed: ${response.status} ${response.statusText}`)
        // If we get a 403 or other error, return the domain as fallback
        if (domain) {
          return NextResponse.json({ title: domain, source: "domain_fallback" })
        }
        return NextResponse.json(
          {
            error: `Failed to fetch feed: ${response.status} ${response.statusText}`,
          },
          { status: 200 },
        ) // Return 200 with error info
      }

      const contentType = response.headers.get("content-type") || ""
      const text = await response.text()

      // Debug: Log a sample of the response
      console.log("Response content type:", contentType)
      console.log("Response text sample:", text.substring(0, 500))

      let title = ""

      // Try to parse as XML (RSS/Atom)
      if (
        contentType.includes("xml") ||
        contentType.includes("rss") ||
        contentType.includes("atom") ||
        text.includes("<rss") ||
        text.includes("<feed") ||
        text.includes("<?xml")
      ) {
        try {
          // First try with XML mode
          const $ = cheerio.load(text, { xmlMode: true })

          // Try different RSS/Atom paths for the title
          // The order is important - try the most specific selectors first
          title =
            $("channel > title").first().text() ||
            $("rss > channel > title").first().text() ||
            $("feed > title").first().text() ||
            $("rdf\\:RDF > channel > title").first().text() ||
            $("rdf\\:rdf > channel > title").first().text() ||
            $("title").first().text()

          // If we found a title with XML mode, clean it up
          if (title) {
            // Remove CDATA markers if present
            title = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
            title = title.trim()
          }

          // If still no title, try a more direct approach for the specific structure
          if (!title && text.includes("<channel>") && text.includes("<title>")) {
            const channelMatch = /<channel>[\s\S]*?<title>([\s\S]*?)<\/title>/i.exec(text)
            if (channelMatch && channelMatch[1]) {
              title = channelMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim()
            }
          }
        } catch (xmlError) {
          console.error("XML parsing error:", xmlError)

          // Try a regex approach as fallback
          try {
            const titleRegex = /<title>([\s\S]*?)<\/title>/i
            const match = titleRegex.exec(text)
            if (match && match[1]) {
              title = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim()
            }
          } catch (regexError) {
            console.error("Regex fallback error:", regexError)
          }
        }
      }

      // If we couldn't find a title in the feed, try to get the page title
      if (!title) {
        try {
          // Try to parse as HTML
          const $ = cheerio.load(text)
          title =
            $("title").first().text() ||
            $('meta[property="og:title"]').attr("content") ||
            $('meta[name="twitter:title"]').attr("content")
        } catch (htmlError) {
          console.error("HTML parsing error:", htmlError)
        }
      }

      // If still no title, use the domain
      if (!title && domain) {
        title = domain
      }

      return NextResponse.json({
        title: title.trim() || domain || url,
        source: title ? "feed" : "domain_fallback",
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error("Fetch error:", fetchError)

      // Return domain as fallback if available
      if (domain) {
        return NextResponse.json({ title: domain, source: "domain_fallback" })
      }

      throw fetchError
    }
  } catch (error) {
    console.error("Error detecting title:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to detect title",
        fallback: true,
      },
      { status: 200 },
    ) // Return 200 with error flag instead of 500
  }
}

