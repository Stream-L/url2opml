import { type FeedItem, extractDomain } from "./utils"
import { toast } from "@/hooks/use-toast"

// Detect title for a feed
export const detectTitle = async (
  id: string,
  url: string,
  feeds: FeedItem[],
  updateFeedCallback: (id: string, updates: Partial<FeedItem>) => void,
): Promise<void> => {

  console.log(`====Detecting title for feed ${id} `)


  if (!url || !url.trim()) return

  // Store the current URL to compare later (prevents race conditions)
  const currentUrl = url.trim()

  console.log(`====Detecting title for feed ${id} (${currentUrl})`)

  try {
    // Mark as loading
    updateFeedCallback(id, { loading: true })

    // Set domain as temporary title
    const domain = extractDomain(currentUrl)
    const currentFeed = feeds.find((f) => f.id === id)

    if (currentFeed && currentFeed.titleSource !== "user") {
      updateFeedCallback(id, { title: domain, titleSource: "domain" })
    }

    // Wait a moment to ensure the server has time to process
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      const response = await fetch(`/api/detect-title?url=${encodeURIComponent(currentUrl)}`)
      const data = await response.json()


      console.log("===>Title detection response:", data)

      // Check if the feed URL is still the same (user might have changed it)
      const updatedFeed = feeds.find((f) => f.id === id)
      if (!updatedFeed || updatedFeed.url.trim() !== currentUrl) {
        return // URL changed, abort
      }

      if (data.error) {
        console.log("Title detection returned error:", data.error)
        // Keep the domain as fallback
        return
      }

      if (data.title && updatedFeed.titleSource !== "user") {
        // Only update if the user hasn't manually set the title
        const newTitle = data.title
        const newSource = data.source === "domain_fallback" ? "domain" : "feed"
        console.log(`===>Updating title for feed ${id} (${currentUrl}) to ${newTitle}`)
        updateFeedCallback(id, { title: newTitle, titleSource: newSource })
      }
    } catch (error) {
      console.error("Failed to detect title:", error)
      // Keep the domain as fallback
    }
  } finally {
    // Remove loading state
    updateFeedCallback(id, { loading: false })
  }
}

// Process imported data (CSV, Excel, OPML)

/**
 * 处理导入的数据（CSV、Excel、OPML）。
 * 
 * @param {FeedItem[]} data - 导入的订阅源数据数组。
 * @param {FeedItem[]} currentFeeds - 当前的订阅源数据数组。
 * @param {function} setFeedsCallback - 更新订阅源数据的回调函数。
 * @param {function} queueTitleDetectionCallback - 将订阅源加入标题检测队列的回调函数。
 */
export const processImportedData = (
  // 导入的订阅源数据数组
  data: FeedItem[],
  // 当前的订阅源数据数组
  currentFeeds: FeedItem[],
  // 更新订阅源数据的回调函数
  setFeedsCallback: (feeds: FeedItem[]) => void,
  // 将订阅源加入标题检测队列的回调函数
  queueTitleDetectionCallback: (id: string, url: string) => void,
): void => {
  if (!Array.isArray(data) || data.length === 0) {
    toast({
      title: "导入错误",
      description: "文件中未找到有效数据",
      variant: "destructive",
    })
    return
  }

  toast({
    title: "导入成功",
    description: `已导入 ${data.length} 个订阅源`,
  })

  // 如果当前只有一个空的订阅源，则替换它，否则追加新的订阅源
  if (currentFeeds.length === 1 && !currentFeeds[0].url && !currentFeeds[0].title) {
    setFeedsCallback(data)
  } else {
    setFeedsCallback([...currentFeeds, ...data])
  }

  // 将没有用户提供标题的订阅源加入标题检测队列
  data.forEach((feed) => {
    if (feed.url && feed.titleSource !== "user") {
      queueTitleDetectionCallback(feed.id, feed.url)
    }
  })
}

