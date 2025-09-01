"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Sparkles } from "lucide-react"

interface AISuggestionModalProps {
  onDescriptionGenerated?: (description: string) => void,
  createTask?: (taskData: {
    title: string
    description?: string
    status?: "TODO" | "IN_PROGRESS" | "DONE"
    totalMinutes?: number
  }, mode?: "create" | "edit") => Promise<void>,
  setTaskTitle?: (title: string) => void,
  callingFrom?: string
}

export function AISuggestionModal({ onDescriptionGenerated, createTask, setTaskTitle, callingFrom }: AISuggestionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("")
  const [generatedDescription, setGeneratedDescription] = useState("")

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setIsLoading(false)
      setError("")
      setTitle("")
      setGeneratedDescription("")
    }
  }

  const generateDescription = async () => {
    if (!title.trim()) {
      setError("Please enter a task title")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "description",
          title: title.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to generate description")
        return
      }

      setGeneratedDescription(data.suggestion)
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const useDescription = () => {
    if (callingFrom === 'task-modal' && onDescriptionGenerated && generatedDescription) {
      onDescriptionGenerated(generatedDescription)
      setIsOpen(false)
      setTitle("")
      setGeneratedDescription("")
      setTaskTitle?.(title.trim())
    } else if (callingFrom === 'dashboard' && createTask && generatedDescription) {
      createTask({
        title: title.trim(),
        description: generatedDescription,
        status: "TODO",
        totalMinutes: 0,
      }, "create")
      setIsOpen(false)
      setTitle("")
      setGeneratedDescription("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Suggestions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Suggestions
          </DialogTitle>
          <DialogDescription>
            Get intelligent task descriptions for your work.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full flex flex-col gap-6">
          <div className="space-y-2 w-full">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              placeholder="Enter your task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={generateDescription}
            disabled={isLoading || !title.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Description
              </>
            )}
          </Button>

          {generatedDescription && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-sm">Generated Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedDescription}
                  onChange={(e) => setGeneratedDescription(e.target.value)}
                  rows={6}
                  className="mb-3 w-full"
                />
                <div className="flex gap-2">
                  <Button onClick={useDescription} size="sm" disabled={isLoading}>
                    Use This Description
                  </Button>
                  <Button onClick={generateDescription} variant="outline" size="sm" disabled={isLoading}>
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}