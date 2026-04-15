const statuses = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" }
];

export function TaskForm({
  form,
  users,
  loading,
  mode,
  onChange,
  onSubmit,
  onCancel
}) {
  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">{mode === "create" ? "New task" : "Edit task"}</p>
          <h2>{mode === "create" ? "Create a task" : "Update task"}</h2>
        </div>
        {mode === "edit" ? (
          <button className="ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>

      <label>
        Title
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Ship tenant isolation review"
          required
        />
      </label>

      <label>
        Description
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows="4"
          placeholder="Add context, expectations, and links"
        />
      </label>

      <div className="grid-two">
        <label>
          Status
          <select name="status" value={form.status} onChange={onChange}>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Assignee
          <select name="assignedTo" value={form.assignedTo} onChange={onChange}>
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.role})
              </option>
            ))}
          </select>
        </label>
      </div>

      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Saving..." : mode === "create" ? "Create task" : "Save changes"}
      </button>
    </form>
  );
}
