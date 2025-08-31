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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Sparkles, Clock, Target, Lightbulb } from "lucide-react"

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

  // Daily plan tab state
  const [dailyPlan, setDailyPlan] = useState<any>(null)

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

  const generateDailyPlan = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "daily_plan",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to generate daily plan")
        return
      }

      setDailyPlan(data.plan)
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
      setTaskTitle(title.trim())
    } else if (callingFrom === 'dashboard' && createTask && generatedDescription) {
      console.log('Creating a new task using AI')
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Suggestions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Suggestions
          </DialogTitle>
          <DialogDescription>
            Get intelligent task descriptions or personalized daily planning recommendations.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="description">Task Description</TabsTrigger>
            <TabsTrigger value="daily-plan">Daily Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  placeholder="Enter your task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={generateDescription} disabled={isLoading || !title.trim()} className="w-full">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Generated Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={generatedDescription}
                      onChange={(e) => setGeneratedDescription(e.target.value)}
                      rows={4}
                      className="mb-3"
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
          </TabsContent>

          <TabsContent value="daily-plan" className="space-y-4">
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={generateDailyPlan} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Generate Daily Plan
                  </>
                )}
              </Button>

              {dailyPlan && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        Daily Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{dailyPlan.summary}</p>
                      <Badge variant="secondary">Estimated work time: {dailyPlan.estimatedWorkTime}</Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4" />
                        Priority Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {dailyPlan.priorityTasks?.map((task: any, index: number) => (
                          <div key={task.id} className="flex items-start gap-2 p-2 bg-muted rounded-md">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">{task.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Lightbulb className="h-4 w-4" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {dailyPlan.recommendations?.map((rec: string, index: number) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {dailyPlan.motivationalTip && (
                    <Alert>
                      <Sparkles className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Tip:</strong> {dailyPlan.motivationalTip}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}