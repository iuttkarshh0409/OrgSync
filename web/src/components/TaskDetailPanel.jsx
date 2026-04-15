function formatDate(value) {
  return new Date(value).toLocaleString();
}

function humanizeAction(action) {
  if (action === "in_progress") {
    return "In Progress";
  }

  return action.charAt(0).toUpperCase() + action.slice(1);
}

const statuses = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" }
];

export function TaskDetailPanel({
  task,
  activity,
  user,
  canEditTask,
  canDeleteTask,
  canUpdateStatus,
  statusSaving,
  deleting,
  onEdit,
  onDelete,
  onStatusChange
}) {
  if (!task) {
    return (
      <div className="panel empty-detail">
        <strong>Select a task</strong>
        <span>View task details and change history here.</span>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Task detail</p>
            <h2>{task.title}</h2>
          </div>
          {canUpdateStatus ? (
            <select
              className={`status-select status-${task.status}`}
              value={task.status}
              onChange={(event) => onStatusChange(event.target.value)}
              disabled={statusSaving}
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          ) : (
            <span className={`status status-${task.status}`}>
              {task.status === "in_progress" ? "In Progress" : task.status}
            </span>
          )}
        </div>

        <p>{task.description || "No description provided."}</p>
        <div className="meta-block">
          <span>Creator: {task.creator_name}</span>
          <span>Assignee: {task.assignee_name || "Unassigned"}</span>
          <span>Created: {formatDate(task.created_at)}</span>
          <span>Updated: {formatDate(task.updated_at)}</span>
        </div>

        {canEditTask || canDeleteTask ? (
          <div className="actions">
            {canEditTask ? (
              <button className="primary" type="button" onClick={onEdit}>
                Edit task
              </button>
            ) : null}
            {canDeleteTask ? (
              <button
                className="danger"
                type="button"
                onClick={onDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete task"}
              </button>
            ) : null}
          </div>
        ) : user?.role === "member" ? (
          <span className="subtle">
            You can update only the status of tasks assigned to you.
          </span>
        ) : (
          <span className="subtle">
            You can view this task, but your role does not allow changes.
          </span>
        )}
      </div>

      <div className="panel stack">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Activity</p>
            <h2>Change history</h2>
          </div>
        </div>

        <div className="activity-list">
          {activity.map((entry) => (
            <div key={entry.id} className="activity-item">
              <div className="activity-item-top">
                <strong>{humanizeAction(entry.action)}</strong>
                <span>{formatDate(entry.created_at)}</span>
              </div>
              <span className="subtle">
                {entry.actor_name} ({entry.actor_email})
              </span>
            </div>
          ))}

          {activity.length === 0 ? (
            <span className="subtle">No activity recorded yet.</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
