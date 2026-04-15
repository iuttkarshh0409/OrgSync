function formatDate(value) {
  return new Date(value).toLocaleString();
}

function humanizeAction(action) {
  if (action === "in_progress") {
    return "In Progress";
  }

  return action.charAt(0).toUpperCase() + action.slice(1);
}

export function TaskDetail({
  task,
  activity,
  canManage,
  deleting,
  onEdit,
  onDelete
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
          <span className={`status status-${task.status}`}>
            {task.status === "in_progress" ? "In Progress" : task.status}
          </span>
        </div>

        <p>{task.description || "No description provided."}</p>
        <div className="meta-block">
          <span>Creator: {task.creator_name}</span>
          <span>Assignee: {task.assignee_name || "Unassigned"}</span>
          <span>Created: {formatDate(task.created_at)}</span>
          <span>Updated: {formatDate(task.updated_at)}</span>
        </div>

        {canManage ? (
          <div className="actions">
            <button className="primary" type="button" onClick={onEdit}>
              Edit task
            </button>
            <button
              className="danger"
              type="button"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete task"}
            </button>
          </div>
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
