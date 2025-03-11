"use client"
import { Trash2, RefreshCw, Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FeedItem } from "@/lib/utils"

interface FeedListProps {
  feeds: FeedItem[]
  onUpdateFeed: (id: string, field: keyof FeedItem, value: string) => void
  onRemoveFeed: (id: string) => void
  onUrlBlur: (id: string, url: string) => void
  onDetectAllTitles: () => void
  onClearAll: () => void
}

export default function FeedList({
  feeds,
  onUpdateFeed,
  onRemoveFeed,
  onUrlBlur,
  onDetectAllTitles,
  onClearAll,
}: FeedListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <div className="grid grid-cols-[1fr,1fr] gap-2 font-medium">
          <div>
            RSS 链接<span className="text-xs block text-muted-foreground">URL</span>
          </div>
          <div>
            标题<span className="text-xs block text-muted-foreground">Title</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDetectAllTitles} className="flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="text-xs">
              检测所有标题<span className="text-[10px] block text-muted-foreground">Detect All Titles</span>
            </span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearAll} className="flex items-center gap-1">
            <Eraser className="h-3.5 w-3.5" />
            <span className="text-xs">
              清空所有<span className="text-[10px] block text-muted-foreground">Clear All</span>
            </span>
          </Button>
        </div>
      </div>

      {feeds.map((feed) => (
        <div key={feed.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
          <Input
            placeholder="输入 RSS 链接 (Enter RSS feed URL)"
            value={feed.url}
            onChange={(e) => onUpdateFeed(feed.id, "url", e.target.value)}
            onBlur={(e) => onUrlBlur(feed.id, e.target.value)}
            className="w-full"
          />
          <Input
            placeholder={
              feed.loading
                ? "正在检测标题... (Detecting title...)"
                : "输入标题或留空自动检测 (Enter title or auto-detect)"
            }
            value={feed.title}
            onChange={(e) => onUpdateFeed(feed.id, "title", e.target.value)}
            className="w-full"
            disabled={feed.loading}
          />
          <Button variant="ghost" size="icon" onClick={() => onRemoveFeed(feed.id)}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">删除</span>
          </Button>
        </div>
      ))}
    </div>
  )
}

