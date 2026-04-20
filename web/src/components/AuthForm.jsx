export function AuthForm({
  mode,
  form,
  errors,
  constraints,
  isSubmitDisabled,
  loading,
  onChange,
  onSubmit,
  onModeChange
}) {
  const isRegister = mode === "register";

  return (
    <div className="panel auth-panel">
      <div>
        <p className="eyebrow">OrgSync</p>
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
              maxLength={constraints.organizationNameMax}
              required
            />
            {errors.organizationName ? (
              <span className="field-error">{errors.organizationName}</span>
            ) : (
              <span className="field-hint">
                {constraints.organizationNameMin}-{constraints.organizationNameMax} characters.
              </span>
            )}
          </label>
        ) : null}

        {isRegister ? (
          <label>
            Full name
            <input
              name="fullName"
              value={form.fullName}
              onChange={onChange}
              placeholder="Jane Doe"
              maxLength={constraints.fullNameMax}
              required
            />
            {errors.fullName ? (
              <span className="field-error">{errors.fullName}</span>
            ) : (
              <span className="field-hint">
                {constraints.fullNameMin}-{constraints.fullNameMax} alphabets only.
              </span>
            )}
          </label>
        ) : null}

        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="jane@company.com"
            maxLength={constraints.emailMax}
            autoComplete="email"
            required
          />
          {errors.email ? (
            <span className="field-error">{errors.email}</span>
          ) : (
            <span className="field-hint">
              Gmail addresses only (e.g. jane@gmail.com).
            </span>
          )}
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Password"
            minLength={constraints.passwordMin}
            maxLength={constraints.passwordMax}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
          />
          {errors.password ? (
            <span className="field-error">{errors.password}</span>
          ) : (
            <span className="field-hint">
              {isRegister
                ? `Use ${constraints.passwordMin}-${constraints.passwordMax} characters with uppercase, lowercase, number, and special character.`
                : `Enter your password. Maximum ${constraints.passwordMax} characters.`}
            </span>
          )}
        </label>

        <button
          className="primary"
          type="submit"
          disabled={loading || isSubmitDisabled}
        >
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
    </div>
  );
}
