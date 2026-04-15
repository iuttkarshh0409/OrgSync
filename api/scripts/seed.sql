INSERT INTO organizations (name)
VALUES ('Acme Corp'), ('Globex Inc')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (organization_id, full_name, email, password_hash, role)
SELECT o.id, 'Alice Admin', 'alice@acme.test', crypt('password123', gen_salt('bf')), 'admin'
FROM organizations o
WHERE o.name = 'Acme Corp'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (organization_id, full_name, email, password_hash, role)
SELECT o.id, 'Mark Member', 'mark@acme.test', crypt('password123', gen_salt('bf')), 'member'
FROM organizations o
WHERE o.name = 'Acme Corp'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (organization_id, full_name, email, password_hash, role)
SELECT o.id, 'Gina Admin', 'gina@globex.test', crypt('password123', gen_salt('bf')), 'admin'
FROM organizations o
WHERE o.name = 'Globex Inc'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (organization_id, full_name, email, password_hash, role)
SELECT o.id, 'Mina Member', 'mina@globex.test', crypt('password123', gen_salt('bf')), 'member'
FROM organizations o
WHERE o.name = 'Globex Inc'
ON CONFLICT (email) DO NOTHING;

INSERT INTO tasks (organization_id, title, description, status, created_by, assigned_to)
SELECT org.id, 'Prepare quarterly report', 'Compile progress and blockers', 'in_progress', creator.id, assignee.id
FROM organizations org
JOIN users creator ON creator.organization_id = org.id AND creator.email = 'alice@acme.test'
JOIN users assignee ON assignee.organization_id = org.id AND assignee.email = 'mark@acme.test'
WHERE org.name = 'Acme Corp'
  AND NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.organization_id = org.id AND t.title = 'Prepare quarterly report'
  );

INSERT INTO tasks (organization_id, title, description, status, created_by, assigned_to)
SELECT org.id, 'Audit customer imports', 'Validate migration quality before launch', 'todo', creator.id, assignee.id
FROM organizations org
JOIN users creator ON creator.organization_id = org.id AND creator.email = 'gina@globex.test'
JOIN users assignee ON assignee.organization_id = org.id AND assignee.email = 'mina@globex.test'
WHERE org.name = 'Globex Inc'
  AND NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.organization_id = org.id AND t.title = 'Audit customer imports'
  );

INSERT INTO task_activity_logs (task_id, organization_id, actor_user_id, action, details)
SELECT t.id, t.organization_id, t.created_by, 'created', jsonb_build_object('title', t.title, 'status', t.status)
FROM tasks t
WHERE NOT EXISTS (
  SELECT 1 FROM task_activity_logs l WHERE l.task_id = t.id AND l.action = 'created'
);
