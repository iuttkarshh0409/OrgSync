export function AuthForm({
  mode,
  form,
  loading,
  onChange,
  onSubmit,
  onModeChange
}) {
  const isRegister = mode === "register";

  return (
    <div className="panel auth-panel">
      <div>
        <p className="eyebrow">Multi-tenant RBAC demo</p>
        <h1>{isRegister ? "Create your organization" : "Sign in"}</h1>
        <p className="subtle">
          {isRegister
            ? "Bootstrap a new organization with an admin account."
            : "Access only the tasks and users that belong to your organization."}
        </p>
      </div>

      <form className="stack" onSubmit={onSubmit}>
        {isRegister ? (
          <label>
            Organization name
            <input
              name="organizationName"
              value={form.organizationName}
              onChange={onChange}
              placeholder="Acme Corp"
              required
            />
          </label>
        ) : null}

        <label>
          Full name
          <input
            name="fullName"
            value={form.fullName}
            onChange={onChange}
            placeholder="Jane Doe"
            required={isRegister}
          />
        </label>

        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="jane@company.com"
            required
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Password"
            required
          />
        </label>

        <button className="primary" type="submit" disabled={loading}>
          {loading
            ? "Working..."
            : isRegister
              ? "Create organization"
              : "Sign in"}
        </button>
      </form>

      <button className="ghost" type="button" onClick={onModeChange}>
        {isRegister ? "Already have an account?" : "Need a new organization?"}
      </button>

      <div className="demo-box">
        <strong>Seeded demo accounts</strong>
        <span>`alice@acme.test` / `password123`</span>
        <span>`mark@acme.test` / `password123`</span>
        <span>`gina@globex.test` / `password123`</span>
      </div>
    </div>
  );
}
