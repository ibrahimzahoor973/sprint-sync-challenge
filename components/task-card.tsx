"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Trash2, Play, Pause, CheckCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface TaskCardProps {
  task: Task
  onStatusChange: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => void
  onDelete: (taskId: string) => void
  showDeleteModal: boolean
  setShowDeleteModal: (show: boolean) => void
  isAdmin?: boolean
}

const statusConfig = {
  TODO: {
    label: "To Do",
    icon: Play,
    variant: "secondary" as const,
    nextStatus: "IN_PROGRESS" as const,
    nextLabel: "Start Task",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Pause,
    variant: "default" as const,
    nextStatus: "DONE" as const,
    nextLabel: "Complete Task",
  },
  DONE: {
    label: "Done",
    icon: CheckCircle,
    variant: "outline" as const,
    nextStatus: "TODO" as const,
    nextLabel: "Restart Task",
  },
}

export function TaskCard({
  task,
  isAdmin,
  onStatusChange,
  onDelete,
  showDeleteModal,
  setShowDeleteModal,
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const config = statusConfig[task.status]
  const StatusIcon = config.icon

  const handleStatusClick = async () => {
    setIsUpdating(true)
    try {
      await onStatusChange(task.id, config.nextStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    await onDelete(task.id)
    setShowDeleteModal(false)
    setIsLoading(false)
    toast({
      title: "Task Deleted",
      description: `Task "${task.title}" was deleted successfully.`,
      variant: "default",
    })
  }

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "No time logged"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    return `${hours}h ${mins}m`
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow duration-200 h-[220px] flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-card-foreground truncate text-balance line-clamp-2">
                  {task.title}
                </h3>
                {isAdmin && (
                  <Badge variant="forestgreen" className="text-xs" title={task.user.email}>
                    {task.user.email}
                  </Badge>
                )}
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 text-pretty">{task.description}</p>
              )}
            </div>
            <Trash2 className="mr-2 h-4 w-4" 
                   onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}/>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={config.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(task.totalMinutes)}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusClick();
              }}
              disabled={isUpdating}
              className={cn(
                "text-xs",
                task.status === "DONE" && "text-primary hover:text-primary",
                task.status === "IN_PROGRESS" && "text-accent hover:text-white",
                task.status === "TODO" && "text-green-700 hover:text-green-800"
              )}
            >
              {isUpdating ? "Updating..." : config.nextLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this task?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => {setShowDeleteModal(false)}} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? (<>
              Deleting
               <Loader2 className="h-4 w-4 animate-spin" /> 
              </>
              ): 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}