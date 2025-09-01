"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
import { Loader2, Sparkles } from "lucide-react"
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
    userId?: string
  }) => Promise<void>
  task?: Task | null
  mode: "create" | "edit"
  users?: { id: string; email: string }[]
  isAdmin?: boolean
}

export function TaskModal({ isOpen, onClose, onSave, task, mode, users = [], isAdmin = false }: TaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO")
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [assignedUserId, setAssignedUserId] = useState<string>(task?.user?.id || "")
  const [aiSuggestedEmails, setAiSuggestedEmails] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [useAiSuggestions, setUseAiSuggestions] = useState(false)
  const aiButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && task) {
        setAssignedUserId(task.user?.id || "")
        setTitle(task.title)
        setDescription(task.description || "")
        setStatus(task.status)
        setTotalMinutes(task.totalMinutes)
      } else {
        setAssignedUserId("")
        setTitle("")
        setDescription("")
        setStatus("TODO")
        setTotalMinutes(0)
      }
      setError("")
      setAiSuggestedEmails([])
      setUseAiSuggestions(false)
    }
  }, [isOpen, mode, task])

  const handleAISuggestUser = async () => {
    setAiLoading(true)
    setAiSuggestedEmails([])
    setError("")
    try {
      const res = await fetch("/api/ai/assign-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      })
      const data = await res.json()
      let emails: string[] = []
      if (Array.isArray(data.suggestion)) {
        emails = data.suggestion.filter((email: string) => typeof email === "string")
      } else if (typeof data.suggestion === "string") {
        emails = [data.suggestion]
      }
      if (emails.length > 0) {
        setAiSuggestedEmails(emails)
        setUseAiSuggestions(true)
        setError("")
      } else {
        setError("AI could not find any suitable users for this task.")
        setUseAiSuggestions(false)
      }
    } catch (err) {
      setError("AI suggestion failed")
      setUseAiSuggestions(false)
    } finally {
      setAiLoading(false)
    }
  }

  const handleShowAllUsers = () => {
    setUseAiSuggestions(false)
    setAiSuggestedEmails([])
    setError("")
  }

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
        userId: isAdmin ? assignedUserId : undefined,
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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

          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="assign-user">Assign User</Label>
              {useAiSuggestions && (
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-muted-foreground">
                    AI suggested these users for this task:
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={handleShowAllUsers}
                  >
                    Show all users
                  </Button>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <select
                  id="assign-user"
                  className="border rounded px-2 py-1 text-sm"
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">{task?.user.email || 'Unassigned'}</option>
                  {(useAiSuggestions ? users.filter(u => aiSuggestedEmails.includes(u.email)) : users).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </select>
                <Button
                  ref={aiButtonRef}
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={aiLoading || !description.trim()}
                  onClick={handleAISuggestUser}
                  aria-label="AI Suggest User"
                  style={{ marginLeft: 4 }}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            {title.length > 60 ? (
              <Textarea
                id="title"
                value={title}
                onChange={(e) => {
                  setError("");
                  setTitle(e.target.value)
                }}
                disabled={isLoading}
                rows={2}
                className="w-full max-h-32 overflow-y-auto"
              />
            ) : (
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setError("");
                  setTitle(e.target.value);
                }}
                disabled={isLoading}
                className="w-full"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <AISuggestionModal onDescriptionGenerated={handleDescriptionGenerated} callingFrom="task-modal" setTaskTitle={setTitle}/>
            </div>
            <Textarea
            className="max-h-[300px] overflow-y-auto"
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
                  type="text"
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