import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AuthForm } from "./components/AuthForm";
import { TaskForm } from "./components/TaskForm";
import { TaskDetailPanel } from "./components/TaskDetailPanel";
import { TaskListPanel } from "./components/TaskListPanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const initialTaskForm = {
  title: "",
  description: "",
  status: "todo",
  assignedTo: ""
};

function normalizeTaskForm(task) {
  if (!task) {
    return initialTaskForm;
  }

  return {
    title: task.title || "",
    description: task.description || "",
    status: task.status || "todo",
    assignedTo: task.assigned_to ? String(task.assigned_to) : ""
  };
}

async function apiRequest(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activity, setActivity] = useState([]);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    organizationName: "",
    fullName: "",
    email: "",
    password: ""
  });
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [taskFormMode, setTaskFormMode] = useState("create");
  const [loading, setLoading] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [taskDeleting, setTaskDeleting] = useState(false);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [selectedTaskId, tasks]
  );

  const canEditSelectedTask = useMemo(() => {
    if (!user || !selectedTask) {
      return false;
    }

    return user.role === "admin";
  }, [selectedTask, user]);

  const canDeleteSelectedTask = useMemo(() => {
    if (!user || !selectedTask) {
      return false;
    }

    return user.role === "admin";
  }, [selectedTask, user]);

  const canUpdateSelectedTaskStatus = useMemo(() => {
    if (!user || !selectedTask) {
      return false;
    }

    return user.role === "member" && selectedTask.assigned_to === user.id;
  }, [selectedTask, user]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        const me = await apiRequest("/auth/me", { token });
        if (cancelled) {
          return;
        }

        setUser(me);
        const [taskData, userData] = await Promise.all([
          apiRequest("/tasks", { token }),
          me.role === "admin" ? apiRequest("/users", { token }) : Promise.resolve([])
        ]);

        if (cancelled) {
          return;
        }

        setTasks(taskData);
        setUsers(userData);
        if (taskData.length > 0) {
          setSelectedTaskId(taskData[0].id);
        }
      } catch (requestError) {
        if (!cancelled) {
          toast.error(requestError.message || "Session expired");
          handleLogout();
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !selectedTaskId) {
      setActivity([]);
      return;
    }

    let cancelled = false;
    apiRequest(`/tasks/${selectedTaskId}/activity`, { token })
      .then((entries) => {
        if (!cancelled) {
          setActivity(entries);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          toast.error(requestError.message || "Failed to load activity");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTaskId, token]);

  function handleAuthFormChange(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  function handleTaskFormChange(event) {
    const { name, value } = event.target;
    setTaskForm((current) => ({ ...current, [name]: value }));
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setUsers([]);
    setTasks([]);
    setSelectedTaskId(null);
    setActivity([]);
    setTaskForm(initialTaskForm);
    setTaskFormMode("create");
  }

  async function refreshTasks(activeTaskId = selectedTaskId) {
    const taskData = await apiRequest("/tasks", { token });
    setTasks(taskData);

    if (taskData.length === 0) {
      setSelectedTaskId(null);
      return;
    }

    const stillExists = taskData.some((task) => task.id === activeTaskId);
    setSelectedTaskId(stillExists ? activeTaskId : taskData[0].id);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const path = authMode === "register" ? "/auth/register" : "/auth/login";
      const payload =
        authMode === "register"
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password
            };

      const data = await apiRequest(path, {
        method: "POST",
        body: payload
      });

      localStorage.setItem("token", data.token);
      setToken(data.token);
      toast.success(
        authMode === "register"
          ? "Organization created successfully"
          : "Login successful"
      );
      setAuthForm({
        organizationName: "",
        fullName: "",
        email: "",
        password: ""
      });
    } catch (requestError) {
      toast.error(
        requestError.message ||
          (authMode === "register" ? "Failed to create account" : "Login failed")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleTaskSubmit(event) {
    event.preventDefault();
    setTaskSaving(true);

    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
        assignedTo: taskForm.assignedTo ? Number(taskForm.assignedTo) : null
      };

      if (taskFormMode === "create") {
        const createdTask = await apiRequest("/tasks", {
          token,
          method: "POST",
          body: payload
        });
        await refreshTasks(createdTask.id);
        toast.success("Task created successfully");
      } else {
        const updatedTask = await apiRequest(`/tasks/${selectedTaskId}`, {
          token,
          method: "PATCH",
          body: payload
        });
        await refreshTasks(updatedTask.id);
        toast.success("Task updated");
      }

      setTaskForm(initialTaskForm);
      setTaskFormMode("create");
    } catch (requestError) {
      toast.error(
        requestError.message === "Forbidden"
          ? "Not authorized"
          : requestError.message ||
          (taskFormMode === "create"
            ? "Failed to create task"
            : "Failed to update task")
      );
    } finally {
      setTaskSaving(false);
    }
  }

  async function handleDeleteTask() {
    if (!selectedTask) {
      return;
    }

    setTaskDeleting(true);

    try {
      await apiRequest(`/tasks/${selectedTask.id}`, {
        token,
        method: "DELETE"
      });
      setTaskForm(initialTaskForm);
      setTaskFormMode("create");
      await refreshTasks();
      toast.success("Task deleted");
    } catch (requestError) {
      toast.error(
        requestError.message === "Forbidden"
          ? "Not authorized"
          : requestError.message || "Failed to delete task"
      );
    } finally {
      setTaskDeleting(false);
    }
  }

  async function handleRefreshUsers() {
    if (!token || user?.role !== "admin") {
      return;
    }

    const userData = await apiRequest("/users", { token });
    setUsers(userData);
  }

  async function handleCreateDemoMember() {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    try {
      await apiRequest("/users", {
        token,
        method: "POST",
        body: {
          fullName: `New Member ${uniqueId}`,
          email: `member-${uniqueId}@demo.test`,
          password: "password123",
          role: "member"
        }
      });
      await handleRefreshUsers();
      toast.success("Member added to organization");
    } catch (requestError) {
      toast.error(requestError.message || "Failed to add member");
    }
  }

  async function handleMemberStatusChange(nextStatus) {
    if (
      !selectedTask ||
      !canUpdateSelectedTaskStatus ||
      nextStatus === selectedTask.status
    ) {
      return;
    }

    setStatusSaving(true);

    try {
      const updatedTask = await apiRequest(`/tasks/${selectedTask.id}`, {
        token,
        method: "PATCH",
        body: {
          status: nextStatus
        }
      });
      await refreshTasks(updatedTask.id);
      toast.success("Task status updated");
    } catch (requestError) {
      toast.error(
        requestError.message === "Forbidden"
          ? "Not authorized"
          : requestError.message || "Failed to update task"
      );
    } finally {
      setStatusSaving(false);
    }
  }

  function enterEditMode() {
    if (!selectedTask) {
      return;
    }

    setTaskForm(normalizeTaskForm(selectedTask));
    setTaskFormMode("edit");
  }

  function cancelEditMode() {
    setTaskForm(initialTaskForm);
    setTaskFormMode("create");
  }

  if (!token || !user) {
    return (
      <main className="auth-shell">
        <AuthForm
          mode={authMode}
          form={authForm}
          loading={loading}
          onChange={handleAuthFormChange}
          onSubmit={handleAuthSubmit}
          onModeChange={() =>
            setAuthMode((current) => (current === "login" ? "register" : "login"))
          }
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero panel">
        <div>
          <p className="eyebrow">Organization</p>
          <h1>{user.organization.name}</h1>
          <p className="subtle">
            Signed in as {user.full_name} ({user.role})
          </p>
        </div>
        <div className="actions">
          {user.role === "admin" ? (
            <button className="ghost" type="button" onClick={handleCreateDemoMember}>
              Add demo member
            </button>
          ) : null}
          <button className="ghost" type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </section>
      <section className="content-grid">
        <div className="stack">
          {user.role === "admin" ? (
            <TaskForm
              form={taskForm}
              users={users}
              loading={taskSaving}
              mode={taskFormMode}
              onChange={handleTaskFormChange}
              onSubmit={handleTaskSubmit}
              onCancel={cancelEditMode}
            />
          ) : null}
          <TaskListPanel
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelect={setSelectedTaskId}
            user={user}
          />
        </div>

        <TaskDetailPanel
          task={selectedTask}
          activity={activity}
          user={user}
          canEditTask={canEditSelectedTask}
          canDeleteTask={canDeleteSelectedTask}
          canUpdateStatus={canUpdateSelectedTaskStatus}
          statusSaving={statusSaving}
          deleting={taskDeleting}
          onEdit={enterEditMode}
          onDelete={handleDeleteTask}
          onStatusChange={handleMemberStatusChange}
        />
      </section>
    </main>
  );
}
