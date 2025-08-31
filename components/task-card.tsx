"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Clock, MoreHorizontal, Edit, Trash2, Play, Pause, CheckCircle } from "lucide-react"
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
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
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

export function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
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

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "No time logged"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    return `${hours}h ${mins}m`
  }

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-card-foreground truncate text-balance">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2 text-pretty">{task.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            onClick={handleStatusClick}
            disabled={isUpdating}
            className={cn(
              "text-xs",
              task.status === "DONE" && "text-primary hover:text-primary",
              task.status === "IN_PROGRESS" && "text-accent hover:text-accent",
            )}
          >
            {isUpdating ? "Updating..." : config.nextLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
