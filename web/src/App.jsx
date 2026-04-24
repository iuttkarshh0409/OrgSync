import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AuthForm } from "./components/AuthForm";
import { TaskForm } from "./components/TaskForm";
import { TaskDetailPanel } from "./components/TaskDetailPanel";
import { TaskListPanel } from "./components/TaskListPanel";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "/api");
console.log("OrgSync API URL:", API_URL);
const CONSTRAINTS = {
  organizationNameMax: 80,
  fullNameMin: 3,
  fullNameMax: 20,
  emailMax: 254,
  passwordMin: 8,
  passwordMax: 30,
  taskTitleMax: 120,
  taskDescriptionMax: 1000
};
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
  const [authErrors, setAuthErrors] = useState({});
  const [taskErrors, setTaskErrors] = useState({});
  const liveAuthToastErrorsRef = useRef({});

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

  useEffect(() => {
    const previousErrors = liveAuthToastErrorsRef.current;

    Object.entries(authErrors).forEach(([fieldName, message]) => {
      const toastId = `auth-error-${fieldName}`;

      if (message && previousErrors[fieldName] !== message) {
        toast.error(message, { id: toastId });
      }

      if (!message && previousErrors[fieldName]) {
        toast.dismiss(toastId);
      }
    });

    Object.keys(previousErrors).forEach((fieldName) => {
      if (!authErrors[fieldName]) {
        toast.dismiss(`auth-error-${fieldName}`);
      }
    });

    liveAuthToastErrorsRef.current = authErrors;
  }, [authErrors]);

  function handleAuthFormChange(event) {
    let { name, value } = event.target;

    if (name === "fullName" && value.length > CONSTRAINTS.fullNameMax) {
      toast.error(`Full name must be ${CONSTRAINTS.fullNameMax} characters or fewer.`, {
        id: "auth-error-fullName-max"
      });
      value = value.slice(0, CONSTRAINTS.fullNameMax);
    }

    setAuthForm((current) => {
      const nextForm = { ...current, [name]: value };
      setAuthErrors((existing) => ({
        ...existing,
        [name]: validateAuthField(name, value, nextForm, authMode)
      }));
      return nextForm;
    });
  }

  function handleTaskFormChange(event) {
    const { name, value } = event.target;
    setTaskErrors((current) => ({ ...current, [name]: undefined }));
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
    Object.keys(liveAuthToastErrorsRef.current).forEach((fieldName) => {
      toast.dismiss(`auth-error-${fieldName}`);
    });
    setAuthErrors({});
    setTaskErrors({});
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
      const { errors, payload } = validateAuthPayload(authForm, authMode);
      if (Object.keys(errors).length > 0) {
        setAuthErrors(errors);
        toast.error("Please fix the highlighted authentication fields.");
        return;
      }

      setAuthErrors({});
      const path = authMode === "register" ? "/auth/register" : "/auth/login";

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
      const { errors, payload } = validateTaskPayload(taskForm);
      if (Object.keys(errors).length > 0) {
        setTaskErrors(errors);
        toast.error("Please fix the highlighted task fields.");
        return;
      }

      setTaskErrors({});

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
          password: "Password123!",
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

    setTaskErrors({});
    setTaskForm(normalizeTaskForm(selectedTask));
    setTaskFormMode("edit");
  }

  function cancelEditMode() {
    setTaskForm(initialTaskForm);
    setTaskFormMode("create");
    setTaskErrors({});
  }

  if (!token || !user) {
    return (
      <main className="auth-shell">
        <AuthForm
          mode={authMode}
          form={authForm}
          errors={authErrors}
          constraints={CONSTRAINTS}
          loading={loading}
          onChange={handleAuthFormChange}
          onSubmit={handleAuthSubmit}
          onModeChange={() => {
            Object.keys(liveAuthToastErrorsRef.current).forEach((fieldName) => {
              toast.dismiss(`auth-error-${fieldName}`);
            });
            setAuthErrors({});
            setAuthMode((current) => (current === "login" ? "register" : "login"));
          }}
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
              errors={taskErrors}
              constraints={{
                titleMax: CONSTRAINTS.taskTitleMax,
                descriptionMax: CONSTRAINTS.taskDescriptionMax
              }}
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

function containsUnsafeControlCharacters(value) {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value);
}

function containsMarkupLikeInput(value) {
  return /<[^>]*>|[<>]/.test(value);
}

function containsInvalidEmailCharacters(value) {
  return /[^A-Za-z0-9._%+\-@]/.test(value);
}


function normalizeSingleLine(value) {
  return value.replace(/\s+/g, " ").trim();
}

function validateAuthPayload(form, mode) {
  const errors = {};
  const payload = {
    email: normalizeSingleLine(form.email || ""),
    password: form.password || ""
  };

  if (mode === "register") {
    payload.organizationName = normalizeSingleLine(form.organizationName || "");
    payload.fullName = normalizeSingleLine(form.fullName || "");

    if (payload.organizationName.length < 2) {
      errors.organizationName = "Organization name must be at least 2 characters.";
    } else if (payload.organizationName.length > CONSTRAINTS.organizationNameMax) {
      errors.organizationName = `Organization name must be ${CONSTRAINTS.organizationNameMax} characters or fewer.`;
    } else if (
      containsUnsafeControlCharacters(payload.organizationName) ||
      containsMarkupLikeInput(payload.organizationName)
    ) {
      errors.organizationName =
        "Organization name cannot include control characters or markup-like text.";
    }

    if (payload.fullName.length < CONSTRAINTS.fullNameMin) {
      errors.fullName = `Full name must be at least ${CONSTRAINTS.fullNameMin} characters.`;
    } else if (payload.fullName.length > CONSTRAINTS.fullNameMax) {
      errors.fullName = `Full name must be ${CONSTRAINTS.fullNameMax} characters or fewer.`;
    } else if (
      containsUnsafeControlCharacters(payload.fullName) ||
      containsMarkupLikeInput(payload.fullName)
    ) {
      errors.fullName =
        "Full name cannot include control characters or markup-like text.";
    } else if (!/^[A-Za-z]+$/.test(payload.fullName)) {
      errors.fullName = "Full name must only contain alphabets.";
    }
  }

  if (payload.email.length === 0) {
    errors.email = "Email is required.";
  } else if (payload.email.length > CONSTRAINTS.emailMax) {
    errors.email = `Email must be ${CONSTRAINTS.emailMax} characters or fewer.`;
  } else if (containsInvalidEmailCharacters(payload.email)) {
    errors.email = "Email contains invalid characters.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (mode === "register") {
    if (payload.password.length < CONSTRAINTS.passwordMin) {
      errors.password = `Password must be at least ${CONSTRAINTS.passwordMin} characters.`;
    } else if (payload.password.length > CONSTRAINTS.passwordMax) {
      errors.password = `Password must be ${CONSTRAINTS.passwordMax} characters or fewer.`;
    } else if (containsUnsafeControlCharacters(payload.password)) {
      errors.password = "Password contains unsupported control characters.";
    } else if (!/[A-Z]/.test(payload.password)) {
      errors.password = "Password must include at least one uppercase letter.";
    } else if (!/[a-z]/.test(payload.password)) {
      errors.password = "Password must include at least one lowercase letter.";
    } else if (!/[0-9]/.test(payload.password)) {
      errors.password = "Password must include at least one number.";
    } else if (!/[^A-Za-z0-9]/.test(payload.password)) {
      errors.password = "Password must include at least one special character.";
    }
  } else if (payload.password.length === 0) {
    errors.password = "Password is required.";
  }

  return {
    errors,
    payload: mode === "register" ? payload : {
      email: payload.email,
      password: payload.password
    }
  };
}

function validateAuthField(name, value, form, mode) {
  const normalizedValue =
    name === "password" ? value : normalizeSingleLine(value || "");

  if (normalizedValue.length === 0) {
    return undefined;
  }

  if (name === "fullName" && mode === "register") {
    if (normalizedValue.length > CONSTRAINTS.fullNameMax) {
      return `Full name must be ${CONSTRAINTS.fullNameMax} characters or fewer.`;
    }

    if (
      containsUnsafeControlCharacters(normalizedValue) ||
      containsMarkupLikeInput(normalizedValue)
    ) {
      return "Full name cannot include control characters or markup-like text.";
    }

    if (!/^[A-Za-z]+$/.test(normalizedValue)) {
      return "Full name must only contain alphabets.";
    }

    return normalizedValue.length < CONSTRAINTS.fullNameMin
      ? `Full name must be at least ${CONSTRAINTS.fullNameMin} characters.`
      : undefined;
  }

  if (name === "email") {
    if (normalizedValue.length > CONSTRAINTS.emailMax) {
      return `Email must be ${CONSTRAINTS.emailMax} characters or fewer.`;
    }

    if (containsInvalidEmailCharacters(normalizedValue)) {
      return "Email contains invalid characters.";
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)
      ? undefined
      : "Enter a valid email address.";
  }

  if (name === "password") {
    if (normalizedValue.length > CONSTRAINTS.passwordMax) {
      return `Password must be ${CONSTRAINTS.passwordMax} characters or fewer.`;
    }

    if (containsUnsafeControlCharacters(normalizedValue)) {
      return "Password contains unsupported characters.";
    }

    if (mode === "register") {
      if (normalizedValue.length < CONSTRAINTS.passwordMin) {
        return `Password must be at least ${CONSTRAINTS.passwordMin} characters.`;
      }

      if (!/[A-Z]/.test(normalizedValue)) {
        return "Password must include at least one uppercase letter.";
      }

      if (!/[a-z]/.test(normalizedValue)) {
        return "Password must include at least one lowercase letter.";
      }

      if (!/[0-9]/.test(normalizedValue)) {
        return "Password must include at least one number.";
      }

      if (!/[^A-Za-z0-9]/.test(normalizedValue)) {
        return "Password must include at least one special character.";
      }
    }
  }

  return undefined;
}

function validateTaskPayload(form) {
  const errors = {};
  const payload = {
    title: normalizeSingleLine(form.title || ""),
    description: (form.description || "").trim(),
    status: form.status,
    assignedTo: form.assignedTo ? Number(form.assignedTo) : null
  };

  if (payload.title.length < 3) {
    errors.title = "Title must be at least 3 characters.";
  } else if (payload.title.length > CONSTRAINTS.taskTitleMax) {
    errors.title = `Title must be ${CONSTRAINTS.taskTitleMax} characters or fewer.`;
  } else if (
    containsUnsafeControlCharacters(payload.title) ||
    containsMarkupLikeInput(payload.title)
  ) {
    errors.title = "Title cannot include control characters or markup-like text.";
  }

  if (payload.description.length > CONSTRAINTS.taskDescriptionMax) {
    errors.description = `Description must be ${CONSTRAINTS.taskDescriptionMax} characters or fewer.`;
  } else if (containsUnsafeControlCharacters(payload.description)) {
    errors.description = "Description contains unsupported control characters.";
  }

  return { errors, payload };
}
