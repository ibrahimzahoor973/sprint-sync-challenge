"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { AISuggestionModal } from "./ai-suggestion-modal"

interface Task {
  id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  totalMinutes: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
  }
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: {
    title: string
    description?: string
    status?: "TODO" | "IN_PROGRESS" | "DONE"
    totalMinutes?: number
  }) => Promise<void>
  task?: Task | null
  mode: "create" | "edit"
}

export function TaskModal({ isOpen, onClose, onSave, task, mode }: TaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO")
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && task) {
        setTitle(task.title)
        setDescription(task.description || "")
        setStatus(task.status)
        setTotalMinutes(task.totalMinutes)
      } else {
        setTitle("")
        setDescription("")
        setStatus("TODO")
        setTotalMinutes(0)
      }
      setError("")
    }
  }, [isOpen, mode, task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    setIsLoading(true)

    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        status: mode === "edit" ? status : undefined,
        totalMinutes: mode === "edit" ? totalMinutes : undefined,
      })
      onClose()
    } catch (error: any) {
      setError(error.message || "Failed to save task")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDescriptionGenerated = (generatedDescription: string) => {
    setDescription(generatedDescription)
  }

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, "0")}`
  }

  const parseHoursToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    return (hours || 0) * 60 + (minutes || 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Task" : "Edit Task"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new task to your list. Use AI suggestions to generate detailed descriptions."
              : "Update your task details and track progress."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <AISuggestionModal onDescriptionGenerated={handleDescriptionGenerated} />
            </div>
            <Textarea
              id="description"
              placeholder="Describe your task in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {mode === "edit" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: "TODO" | "IN_PROGRESS" | "DONE") => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time Spent (hours:minutes)</Label>
                <Input
                  id="time"
                  type="time"
                  value={formatMinutesToHours(totalMinutes)}
                  onChange={(e) => setTotalMinutes(parseHoursToMinutes(e.target.value))}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : mode === "create" ? (
                "Create Task"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
