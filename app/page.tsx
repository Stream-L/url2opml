"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Info, Plus, Download, FileText } from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"

import FeedList from "@/components/feed-list"
import ImportExportButtons from "@/components/import-export-buttons"
import V0Logo from "@/components/v0-logo"

import { type FeedItem, downloadFile, generateOPML, generateCSV, parseOPML } from "@/lib/utils"
import { detectTitle, processImportedData } from "@/lib/feed-service"

export default function OPMLGenerator() {
  const [feeds, setFeeds] = useState<FeedItem[]>([{ id: "1", url: "", title: "", titleSource: "user" }])
  const [titleDetectionQueue, setTitleDetectionQueue] = useState<{ id: string; url: string }[]>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)

  // 处理标题检测队列
  useEffect(() => {
    processQueue()
  }, [titleDetectionQueue, isProcessingQueue, feeds])

  const processQueue = async () => {
    if (titleDetectionQueue.length === 0 || isProcessingQueue) return

    setIsProcessingQueue(true)
    const item = titleDetectionQueue[0]

    try {
      await detectTitle(item.id, item.url, feeds, updateFeedPartial)
    } catch (error) {
      console.error("Error processing queue item:", error)
    }

    // 从队列中移除已处理的项
    setTitleDetectionQueue((prev) => prev.slice(1))
    setIsProcessingQueue(false)
  }

  const addFeed = () => {
    const newId = Date.now().toString()
    const newFeed = { id: newId, url: "", title: "", titleSource: "user" }
    setFeeds([...feeds, newFeed])
  }

  const removeFeed = (id: string) => {
    if (feeds.length > 1) {
      setFeeds(feeds.filter((feed) => feed.id !== id))
      // 如果在队列中也移除
      setTitleDetectionQueue((prev) => prev.filter((item) => item.id !== id))
    } else {
      // 如果这是最后一个订阅源，只清空其内容
      setFeeds([{ id: "1", url: "", title: "", titleSource: "user" }])
      setTitleDetectionQueue([])
    }
  }

  const clearAll = () => {
    setFeeds([{ id: "1", url: "", title: "", titleSource: "user" }])
    setTitleDetectionQueue([])
    toast({
      title: "已清空所有内容",
      description: "All feeds have been cleared",
    })
  }

  const updateFeed = (id: string, field: keyof FeedItem, value: string) => {
    setFeeds((prevFeeds) =>
      prevFeeds.map((feed) => {
        if (feed.id === id) {
          // 如果手动更新标题，标记为用户提供
          const updates: Partial<FeedItem> = { [field]: value }
          if (field === "title") {
            updates.titleSource = "user"
          }
          // 如果更新URL，重置标题（如果不是用户提供的）
          if (field === "url" && feed.titleSource !== "user") {
            updates.title = ""
            updates.titleSource = undefined
          }
          return { ...feed, ...updates }
        }
        return feed
      }),
    )
  }

  const updateFeedPartial = (id: string, updates: Partial<FeedItem>) => {
    setFeeds((prevFeeds) => prevFeeds.map((feed) => (feed.id === id ? { ...feed, ...updates } : feed)))
  }
  //终端显示函数调用
  console.log("====UpdateFeedPartial", feeds)

  const queueTitleDetection = (id: string, url: string) => {
    if (!url || !url.trim()) return

    // 检查此URL是否已在队列中
    const isAlreadyQueued = titleDetectionQueue.some((item) => item.id === id && item.url === url.trim())

    if (!isAlreadyQueued) {
      setTitleDetectionQueue((prev) => [...prev, { id, url: url.trim() }])
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split(".").pop()?.toLowerCase()

    if (fileExt === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors)
            toast({
              title: "导入错误",
              description: "解析 CSV 文件时出错",
              variant: "destructive",
            })
            return
          }

          const importedFeeds = results.data
            .filter((item: any) => {
              const url = item.url || item.URL || ""
              return url.trim() !== ""
            })
            .map((item: any, index: number) => {
              const url = (item.url || item.URL || "").trim()
              const titleValue = item.title || item.Title || ""
              const titleString = typeof titleValue === "string" ? titleValue : String(titleValue)
              const hasTitle = titleString.trim() !== ""
              const title = titleString.trim()

              return {
                id: `import-${Date.now()}-${index}`,
                url,
                title,
                titleSource: hasTitle ? "user" : undefined,
              }
            })

          processImportedData(importedFeeds, feeds, setFeeds, queueTitleDetection)
        },
        error: (error) => {
          console.error("CSV parsing error:", error)
          toast({
            title: "导入错误",
            description: "无法解析 CSV 文件",
            variant: "destructive",
          })
        },
      })
    } else if (fileExt === "xlsx" || fileExt === "xls") {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          if (data) {
            const workbook = XLSX.read(data, { type: "array" })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)

            const importedFeeds = jsonData
              .filter((item: any) => {
                const url = item.url || item.URL || ""
                return url.trim() !== ""
              })
              .map((item: any, index: number) => {
                const url = (item.url || item.URL || "").trim()
                // Convert to string before trimming to handle non-string values
                const titleValue = item.title || item.Title || ""
                const titleString = typeof titleValue === "string" ? titleValue : String(titleValue)
                const hasTitle = titleString.trim() !== ""
                const title = titleString.trim()

                return {
                  id: `import-${Date.now()}-${index}`,
                  url,
                  title,
                  titleSource: hasTitle ? "user" : undefined,
                }
              })

            processImportedData(importedFeeds, feeds, setFeeds, queueTitleDetection)
          }
        } catch (error) {
          console.error("Excel parsing error:", error)
          toast({
            title: "导入错误",
            description: "无法解析 Excel 文件",
            variant: "destructive",
          })
        }
      }
      reader.onerror = () => {
        toast({
          title: "导入错误",
          description: "无法读取文件",
          variant: "destructive",
        })
      }
      reader.readAsArrayBuffer(file)
    } else if (fileExt === "opml" || fileExt === "xml") {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          if (content) {
            const importedFeeds = parseOPML(content)

            if (importedFeeds.length === 0) {
              toast({
                title: "导入错误",
                description: "OPML 文件中未找到有效的 RSS 订阅源",
                variant: "destructive",
              })
              return
            }

            processImportedData(importedFeeds, feeds, setFeeds, queueTitleDetection)
          }
        } catch (error) {
          console.error("OPML parsing error:", error)
          toast({
            title: "导入错误",
            description: "无法解析 OPML 文件",
            variant: "destructive",
          })
        }
      }
      reader.onerror = () => {
        toast({
          title: "导入错误",
          description: "无法读取文件",
          variant: "destructive",
        })
      }
      reader.readAsText(file)
    } else {
      toast({
        title: "不支持的文件格式",
        description: "请上传 CSV、Excel 或 OPML 文件",
        variant: "destructive",
      })
    }

    // 重置文件输入
    event.target.value = ""
  }

  const handleExportOPML = () => {
    const validFeeds = feeds.filter((feed) => feed.url.trim() !== "")

    if (validFeeds.length === 0) {
      toast({
        title: "导出错误",
        description: "请添加至少一个有效的 RSS 订阅链接",
        variant: "destructive",
      })
      return
    }

    const opml = generateOPML(validFeeds)
    downloadFile(opml, "rss-feeds.opml", "application/xml")

    toast({
      title: "OPML 已生成",
      description: `已创建包含 ${validFeeds.length} 个订阅源的 OPML 文件`,
    })
  }

  const handleExportCSV = () => {
    const validFeeds = feeds.filter((feed) => feed.url.trim() !== "")

    if (validFeeds.length === 0) {
      toast({
        title: "导出错误",
        description: "请添加至少一个有效的 RSS 订阅链接",
        variant: "destructive",
      })
      return
    }

    const csv = generateCSV(validFeeds)
    downloadFile(csv, "rss-feeds.csv", "text/csv")

    toast({
      title: "CSV 已生成",
      description: `已创建包含 ${validFeeds.length} 个订阅源的 CSV 文件`,
    })
  }

  const handleUrlBlur = async (id: string, url: string) => {
    if (!url || !url.trim()) return

    const feed = feeds.find((f) => f.id === id)
    if (!feed) return

    // 仅在URL更改或标题为空时检测标题
    if (feed.url !== url.trim() || !feed.title) {
      await queueTitleDetection(id, url)
      const updatedFeed = feeds.find((f) => f.id === id)
      // 处理队列
      processQueue()
      //detectTitle
      detectTitle(id, url, feeds, updateFeedPartial)
      
      return updatedFeed?.title
    }
  }

  const handleDetectAllTitles = async () => {
    // 找到所有有URL但没有标题或只有基于域名的标题的feeds
    const feedsToDetect = feeds.filter(
      (feed) => feed.url.trim() !== "" && (feed.title === "" || feed.titleSource === "domain" || !feed.titleSource),
    )

    if (feedsToDetect.length === 0) {
      toast({
        title: "没有需要检测的订阅源",
        description: "所有订阅源已有标题或没有有效的 URL",
      })
      return 
    }

    // 仅在已有feeds中处理，不添加新的feed
    for (const [index, feed] of feedsToDetect.entries()) {
      setTimeout(async () => {
        await queueTitleDetection(feed.id, feed.url)
        const updatedFeed = feeds.find((f) => f.id === feed.id)
        if (updatedFeed) {
          setFeeds((prevFeeds) =>
            prevFeeds.map((f) => (f.id === updatedFeed.id ? { ...f, title: updatedFeed.title } : f)),
          )
        }
        // 处理队列
        processQueue()
      }, index * 100) // 错开队列添加
    }

    toast({
      title: "正在检测标题",
      description: `已将 ${feedsToDetect.length} 个订阅源加入标题检测队列`,
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            URL 转 OPML 生成器
            <span className="text-sm block text-muted-foreground font-normal">URL to OPML Generator</span>
          </h1>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="transition-all duration-150">
                  <Info className="h-5 w-5" />
                  <span className="sr-only">信息</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  此工具帮助您从 RSS 订阅链接创建 OPML 文件。
                  <br />
                  OPML 文件可以导入到 RSS 阅读器中，一次性订阅多个源。
                  <br />
                  This tool helps you create an OPML file from RSS feed URLs.
                  <br />
                  OPML files can be imported into RSS readers to subscribe to multiple feeds at once.
                  <br />
                  <a href="https://zhuanlan.zhihu.com/p/564975250" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    期刊RSS获取的教程参考
                  </a>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <ImportExportButtons onFileUpload={handleFileUpload} />

        <div className="space-y-4 mb-8">
          <FeedList
            feeds={feeds}
            onUpdateFeed={updateFeed}
            onRemoveFeed={removeFeed}
            onUrlBlur={handleUrlBlur}
            onDetectAllTitles={handleDetectAllTitles}
            onClearAll={clearAll}
          />

          <Button variant="outline" onClick={addFeed} className="w-full mt-2 flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            <span>
              添加订阅源
              <br />
              Add Feed
            </span>
          </Button>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>
                导出 CSV
                <br />
                Export CSV
              </span>
            </Button>

            <Button onClick={handleExportOPML} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>
                导出 OPML
                <br />
                Export OPML
              </span>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t py-4">
        <div className="container max-w-4xl mx-auto px-4 flex justify-center items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <V0Logo className="h-5 w-5" />
          </div>
          <div className="mx-2">•</div>
          <div>
            <span className="text-xs block text-center">Created by Stream-L</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

