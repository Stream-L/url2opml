"use client"

import type React from "react"
import { Upload, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ImportExportButtonsProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function ImportExportButtons({ onFileUpload }: ImportExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>
                导入<span className="text-xs block text-muted-foreground">Import</span>
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <Tabs defaultValue="file">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">CSV/Excel</TabsTrigger>
                <TabsTrigger value="opml">OPML</TabsTrigger>
              </TabsList>
              <TabsContent value="file" className="space-y-4 pt-4">
                <h3 className="font-medium">从 CSV 或 Excel 导入</h3>
                <p className="text-xs text-muted-foreground">Import from CSV or Excel</p>
                <p className="text-sm text-muted-foreground mt-2">
                  上传包含 'url' 和 'title' 列的文件。如未提供标题，工具将自动检测。
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload a file with 'url' and 'title' columns. Titles will be auto-detected if not provided.
                </p>
                <Input type="file" accept=".csv,.xlsx,.xls" onChange={onFileUpload} />
              </TabsContent>
              <TabsContent value="opml" className="space-y-4 pt-4">
                <h3 className="font-medium">从 OPML 导入</h3>
                <p className="text-xs text-muted-foreground">Import from OPML</p>
                <p className="text-sm text-muted-foreground mt-2">
                  上传从其他 RSS 阅读器导出的 OPML 文件，一次性导入所有订阅源。
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload an OPML file exported from another RSS reader to import all feeds at once.
                </p>
                <Input type="file" accept=".opml,.xml" onChange={onFileUpload} />
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <FileUp className="h-4 w-4" />
                <span className="sr-only">导入格式</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="w-auto p-0">
              <div className="p-2">
                <p className="text-sm font-medium mb-2">
                  示例格式：<span className="text-xs text-muted-foreground">Example Format:</span>
                </p>
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">url</th>
                        <th className="p-2 text-left">title</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border-t">https://example.com/feed</td>
                        <td className="p-2 border-t">示例订阅源</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-t">https://another.com/rss</td>
                        <td className="p-2 border-t">另一个博客</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

interface FeedListButtonsProps {
  onAddFeed: () => void
  onExportOPML: () => void
  onExportCSV: () => void
}

export function FeedListButtons({ onAddFeed, onExportOPML, onExportCSV }: FeedListButtonsProps) {
  return (
    <>
      <Button variant="outline" onClick={onAddFeed} className="w-full mt-2 flex items-center justify-center gap-2">
        <span>
          添加订阅源<span className="text-xs block text-muted-foreground">Add Feed</span>
        </span>
      </Button>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onExportCSV} className="flex items-center gap-2">
          <span>
            导出 CSV<span className="text-xs block text-muted-foreground">Export CSV</span>
          </span>
        </Button>

        <Button onClick={onExportOPML} className="flex items-center gap-2">
          <span>
            导出 OPML<span className="text-xs block text-muted-foreground">Export OPML</span>
          </span>
        </Button>
      </div>
    </>
  )
}

