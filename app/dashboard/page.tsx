"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TaskCard } from "@/components/task-card"
import { TaskModal } from "@/components/task-modal"
import { AISuggestionModal } from "@/components/ai-suggestion-modal"
import { Plus, LogOut, CheckCircle, Clock, Play, UserIcon, BarChart3, Zap } from "lucide-react"

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

interface AppUser {
  id: string
  email: string
  isAdmin: boolean
  createdAt: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskModalMode, setTaskModalMode] = useState<"create" | "edit">("create")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<AppUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [stats, setStats] = useState({total: 0, todo: 0, inProgress: 0, done: 0, totalTime: 0})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const router = useRouter()

  useEffect(() => {
  fetchUsers()
  fetchUserAndTasks()
  }, [])

  useEffect(() => {
    if (filteredTasks.length === 0 || !selectedUserId) {
      getTaskStats(tasks)
    }
    filterTasks()
  }, [tasks, activeTab, selectedUserId])

  const fetchUserAndTasks = async () => {
    try {
      // Fetch current user
      const userResponse = await fetch("/api/auth/me")
      if (!userResponse.ok) {
        router.push("/login")
        return
      }
      const userData = await userResponse.json()
      setUser(userData.user)

      // Fetch tasks
      const tasksResponse = await fetch("/api/tasks")
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        setTasks(tasksData.tasks)
      }
    } catch (error) {
      setError("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

    const getTaskStats = (tasksList: Task[]) => {
      const total = tasksList.length;
      const todo = tasksList.filter((t) => t.status === "TODO").length
      const inProgress = tasksList.filter((t) => t.status === "IN_PROGRESS").length
      const done = tasksList.filter((t) => t.status === "DONE").length
      const totalTime = tasksList.reduce((sum, task) => sum + task.totalMinutes, 0)
      setStats({total, todo, inProgress, done, totalTime})
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.log('User fetch error:', error)
    }
  }

  const filterTasks = () => {
    let filtered = tasks
    if (user?.isAdmin && selectedUserId) {
      filtered = filtered.filter((task) => task.user.id === selectedUserId)
      getTaskStats(filtered)
    }
    switch (activeTab) {
      case "todo":
        filtered = filtered.filter((task) => task.status === "TODO")
        break
      case "in-progress":
        filtered = filtered.filter((task) => task.status === "IN_PROGRESS")
        break
      case "done":
        filtered = filtered.filter((task) => task.status === "DONE")
        break
      default:
        break
    }
    setFilteredTasks(filtered)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleCreateTask = () => {
    setTaskModalMode("create")
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    if (showDeleteModal) return;
    setTaskModalMode("edit")
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const handleSaveTask = async (
    taskData: {
      title: string
      description?: string
      status?: "TODO" | "IN_PROGRESS" | "DONE"
      totalMinutes?: number
      userId?: string
    },
    mode: "create" | "edit" = taskModalMode
  ) => {
    try {
      if (mode === "create") {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to create task")
        }

        const { task } = await response.json()
        setTasks((prev) => [task, ...prev])
      } else if (editingTask) {
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to update task")
        }

        const { task } = await response.json()
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
      }
    } catch (error: any) {
      throw error
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => {
    try {
      const response = await fetch(`/api/tasks/status/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task status")
      }

      const { task } = await response.json()
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
    } catch (error) {
      setError("Failed to update task status")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete task")
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      setShowDeleteModal(false)
      setDeletingTask(null)
    } catch (error) {
      setError("Failed to delete task")
    }
  }


  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    return `${hours}h ${mins}m`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold text-card-foreground">SprintSync</h1>
              </div>
              {user?.isAdmin && <Badge variant="secondary">Admin</Badge>}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Do</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stats.todo}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.done}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{formatTime(stats.totalTime)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Only Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-foreground text-balance">Your Tasks</h2>
          <div className="flex items-center space-x-3">
            {user?.isAdmin && (
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">All Users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
              </select>
            )}
            <AISuggestionModal createTask={handleSaveTask} callingFrom="dashboard"/>
            <Button onClick={handleCreateTask}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="todo">To Do ({stats.todo})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({stats.inProgress})</TabsTrigger>
            <TabsTrigger value="done">Done ({stats.done})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-card-foreground mb-2">
                      {activeTab === "all" ? "No tasks yet" : `No ${activeTab.replace("-", " ")} tasks`}
                    </h3>
                    <p className="text-muted-foreground mb-4 text-pretty">
                      {activeTab === "all"
                        ? "Create your first task to get started with SprintSync."
                        : `You don't have any ${activeTab.replace("-", " ")} tasks right now.`}
                    </p>
                    {activeTab === "all" && (
                      <Button onClick={handleCreateTask}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Task
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.map((task) => (
                  <div key={task.id} onClick={() => handleEditTask(task)} className="cursor-pointer">
                    <TaskCard
                      task={task}
                      isAdmin={user?.isAdmin}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteTask}
                      showDeleteModal={showDeleteModal && deletingTask?.id === task.id}
                      setShowDeleteModal={(show) => {
                        setShowDeleteModal(show)
                        setDeletingTask(show ? task : null)
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        mode={taskModalMode}
        isAdmin={user?.isAdmin || false}
        users={users}
      />
    </div>
  )
}