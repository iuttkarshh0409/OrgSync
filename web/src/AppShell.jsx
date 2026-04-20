import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AuthForm } from "./components/AuthForm";
import { TaskForm } from "./components/TaskForm";
import { TaskDetailPanel } from "./components/TaskDetailPanel";
import { TaskListPanel } from "./components/TaskListPanel";
import { UserForm } from "./components/UserForm";
import {
  CONSTRAINTS,
  hasErrors,
  validateLoginForm,
  validateRegisterForm,
  validateTaskForm,
  validateUserForm
} from "./utils/validation";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const initialTaskForm = {
  title: "",
  description: "",
  status: "todo",
  assignedTo: ""
};

const initialUserForm = {
  fullName: "",
  email: "",
  password: "",
  role: "member"
};

const initialAuthForm = {
  organizationName: "",
  fullName: "",
  email: "",
  password: ""
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

export default function AppShell() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activity, setActivity] = useState([]);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [taskFormMode, setTaskFormMode] = useState("create");
  const [loading, setLoading] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [taskDeleting, setTaskDeleting] = useState(false);
  const [authErrors, setAuthErrors] = useState({});
  const [userErrors, setUserErrors] = useState({});
  const [taskErrors, setTaskErrors] = useState({});
  const liveAuthToastErrorsRef = useRef({});

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [selectedTaskId, tasks]
  );

  const authValidation = useMemo(
    () => (authMode === "register" ? validateRegisterForm(authForm) : validateLoginForm(authForm)),
    [authForm, authMode]
  );
  const userValidation = useMemo(() => validateUserForm(userForm), [userForm]);
  const taskValidation = useMemo(() => validateTaskForm(taskForm), [taskForm]);

  const canEditSelectedTask = user?.role === "admin";
  const canDeleteSelectedTask = user?.role === "admin";
  const canUpdateSelectedTaskStatus =
    !!user &&
    !!selectedTask &&
    user.role === "member" &&
    selectedTask.assigned_to === user.id;

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
    const { name, value } = event.target;

    // Enforce fullName max length at the handler level
    let finalValue = value;
    if (name === "fullName" && value.length > CONSTRAINTS.fullNameMax) {
      finalValue = value.slice(0, CONSTRAINTS.fullNameMax);
      toast.error(`Full name must be ${CONSTRAINTS.fullNameMax} characters or fewer.`, {
        id: "auth-error-fullName-max"
      });
    }

    // Enforce email max length at the handler level
    if (name === "email" && value.length > CONSTRAINTS.emailMax) {
      finalValue = value.slice(0, CONSTRAINTS.emailMax);
      toast.error(`Email must be ${CONSTRAINTS.emailMax} characters or fewer.`, {
        id: "auth-error-email-max"
      });
    }

    const nextForm = { ...authForm, [name]: finalValue };
    setAuthForm(nextForm);
    setAuthErrors(
      authMode === "register"
        ? validateRegisterForm(nextForm).errors
        : validateLoginForm(nextForm).errors
    );
  }

  function handleUserFormChange(event) {
    const { name, value } = event.target;
    const nextForm = { ...userForm, [name]: value };
    setUserForm(nextForm);
    setUserErrors(validateUserForm(nextForm).errors);
  }

  function handleTaskFormChange(event) {
    const { name, value } = event.target;
    const nextForm = { ...taskForm, [name]: value };
    setTaskForm(nextForm);
    setTaskErrors(validateTaskForm(nextForm).errors);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setUsers([]);
    setTasks([]);
    setSelectedTaskId(null);
    setActivity([]);
    setAuthForm(initialAuthForm);
    setUserForm(initialUserForm);
    setTaskForm(initialTaskForm);
    setTaskFormMode("create");
    Object.keys(liveAuthToastErrorsRef.current).forEach((fieldName) => {
      toast.dismiss(`auth-error-${fieldName}`);
    });
    setAuthErrors({});
    setUserErrors({});
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
      const { errors, payload } = authValidation;
      if (hasErrors(errors)) {
        setAuthErrors(errors);
        toast.error("Please fix the highlighted authentication fields.");
        return;
      }

      const path = authMode === "register" ? "/auth/register" : "/auth/login";
      const data = await apiRequest(path, {
        method: "POST",
        body: payload
      });

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setAuthForm(initialAuthForm);
      setAuthErrors({});
      toast.success(
        authMode === "register"
          ? "Organization created successfully"
          : "Login successful"
      );
    } catch (requestError) {
      toast.error(
        requestError.message ||
          (authMode === "register" ? "Failed to create account" : "Login failed")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setUserSaving(true);

    try {
      const { errors, payload } = userValidation;
      if (hasErrors(errors)) {
        setUserErrors(errors);
        toast.error("Please fix the highlighted user fields.");
        return;
      }

      await apiRequest("/users", {
        token,
        method: "POST",
        body: payload
      });
      await handleRefreshUsers();
      setUserForm(initialUserForm);
      setUserErrors({});
      toast.success("User created successfully");
    } catch (requestError) {
      toast.error(requestError.message || "Failed to create user");
    } finally {
      setUserSaving(false);
    }
  }

  async function handleTaskSubmit(event) {
    event.preventDefault();
    setTaskSaving(true);

    try {
      const { errors, payload } = taskValidation;
      if (hasErrors(errors)) {
        setTaskErrors(errors);
        toast.error("Please fix the highlighted task fields.");
        return;
      }

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
      setTaskErrors({});
    } catch (requestError) {
      toast.error(
        requestError.message === "Forbidden"
          ? "Not authorized"
          : requestError.message || "Failed to save task"
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
      setTaskErrors({});
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
          fullName: "Demo Member",
          email: `member-${uniqueId}@demo.test`,
          password: "Password123",
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
        body: { status: nextStatus }
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

    const nextForm = normalizeTaskForm(selectedTask);
    setTaskForm(nextForm);
    setTaskErrors(validateTaskForm(nextForm).errors);
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
          isSubmitDisabled={loading || hasErrors(authValidation.errors)}
          loading={loading}
          onChange={handleAuthFormChange}
          onSubmit={handleAuthSubmit}
          onModeChange={() => {
            Object.keys(liveAuthToastErrorsRef.current).forEach((fieldName) => {
              toast.dismiss(`auth-error-${fieldName}`);
            });
            setAuthErrors({});
            setAuthForm(initialAuthForm);
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
            <>
              <UserForm
                form={userForm}
                errors={userErrors}
                constraints={CONSTRAINTS}
                loading={userSaving}
                isSubmitDisabled={userSaving || hasErrors(userValidation.errors)}
                onChange={handleUserFormChange}
                onSubmit={handleCreateUser}
              />
              <TaskForm
                form={taskForm}
                users={users}
                errors={taskErrors}
                constraints={{
                  titleMin: CONSTRAINTS.taskTitleMin,
                  titleMax: CONSTRAINTS.taskTitleMax,
                  descriptionMax: CONSTRAINTS.taskDescriptionMax
                }}
                isSubmitDisabled={taskSaving || hasErrors(taskValidation.errors)}
                loading={taskSaving}
                mode={taskFormMode}
                onChange={handleTaskFormChange}
                onSubmit={handleTaskSubmit}
                onCancel={cancelEditMode}
              />
            </>
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
