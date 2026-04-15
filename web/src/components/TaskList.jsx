function statusLabel(status) {
  if (status === "in_progress") {
    return "In Progress";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function TaskList({ tasks, selectedTaskId, onSelect }) {
  return (
    <div className="panel stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Tasks</p>
          <h2>Organization work</h2>
        </div>
        <span className="pill">{tasks.length} visible</span>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            className={`task-card ${selectedTaskId === task.id ? "selected" : ""}`}
            onClick={() => onSelect(task.id)}
          >
            <div className="task-card-top">
              <strong>{task.title}</strong>
              <span className={`status status-${task.status}`}>{statusLabel(task.status)}</span>
            </div>
            <span className="subtle">{task.description || "No description provided."}</span>
            <span className="meta">
              Creator: {task.creator_name}
              {task.assignee_name ? ` • Assignee: ${task.assignee_name}` : ""}
            </span>
          </button>
        ))}

        {tasks.length === 0 ? (
          <div className="empty-state">
            <strong>No tasks available</strong>
            <span>Members only see tasks they created. Admins see the full org queue.</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
