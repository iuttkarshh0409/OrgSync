export function UserForm({
  form,
  errors,
  constraints,
  loading,
  isSubmitDisabled,
  onChange,
  onSubmit
}) {
  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Organization user</p>
          <h2>Create a user</h2>
        </div>
      </div>

      <label>
        Full name
        <input
          name="fullName"
          value={form.fullName}
          onChange={onChange}
          placeholder="Ava Member"
          maxLength={constraints.fullNameMax}
          required
        />
        {errors.fullName ? (
          <span className="field-error">{errors.fullName}</span>
        ) : (
          <span className="field-hint">
            {constraints.fullNameMin}-{constraints.fullNameMax} letters only. Single
            spaces are allowed between words.
          </span>
        )}
      </label>

      <label>
        Email
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="ava@company.com"
          maxLength={constraints.emailMax}
          required
        />
        {errors.email ? (
          <span className="field-error">{errors.email}</span>
        ) : (
          <span className="field-hint">
            Valid email address up to {constraints.emailMax} characters.
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
          placeholder="Password123"
          minLength={constraints.passwordMin}
          maxLength={constraints.passwordMax}
          required
        />
        {errors.password ? (
          <span className="field-error">{errors.password}</span>
        ) : (
          <span className="field-hint">
            {constraints.passwordMin}-{constraints.passwordMax} characters with uppercase,
            lowercase, and number.
          </span>
        )}
      </label>

      <label>
        Role
        <select name="role" value={form.role} onChange={onChange} required>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role ? <span className="field-error">{errors.role}</span> : null}
      </label>

      <button className="primary" type="submit" disabled={loading || isSubmitDisabled}>
        {loading ? "Creating..." : "Create user"}
      </button>
    </form>
  );
}
