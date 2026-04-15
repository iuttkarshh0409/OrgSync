const { pool } = require("../db/pool");
const { httpError } = require("../utils/httpError");

function canViewTask(user, task) {
  if (user.role === "admin") {
    return true;
  }

  return task.assigned_to === user.id;
}

function canUpdateTask(user, task) {
  if (user.role === "admin") {
    return true;
  }

  return user.role === "member" && task.assigned_to === user.id;
}

function canDeleteTask(user, task) {
  if (user.role === "admin") {
    return true;
  }

  return false;
}

async function findTaskForOrganization(taskId, organizationId) {
  const result = await pool.query(
    `SELECT t.id,
            t.organization_id,
            t.title,
            t.description,
            t.status,
            t.created_by,
            t.assigned_to,
            t.deleted_at,
            t.created_at,
            t.updated_at
     FROM tasks t
     WHERE t.id = $1 AND t.organization_id = $2`,
    [taskId, organizationId]
  );

  return result.rows[0] || null;
}

async function writeActivityLog(client, payload) {
  await client.query(
    `INSERT INTO task_activity_logs (task_id, organization_id, actor_user_id, action, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      payload.taskId,
      payload.organizationId,
      payload.actorUserId,
      payload.action,
      JSON.stringify(payload.details || {})
    ]
  );
}

async function listTasks(user) {
  const params = [user.organization_id];
  let whereClause = "t.organization_id = $1 AND t.deleted_at IS NULL";

  if (user.role === "member") {
    params.push(user.id);
    whereClause += " AND t.assigned_to = $2";
  }

  const result = await pool.query(
    `SELECT t.id,
            t.organization_id,
            t.title,
            t.description,
            t.status,
            t.created_by,
            t.assigned_to,
            t.created_at, t.updated_at,
            creator.full_name AS creator_name,
            assignee.full_name AS assignee_name
     FROM tasks t
     JOIN users creator ON creator.id = t.created_by
     LEFT JOIN users assignee ON assignee.id = t.assigned_to
     WHERE ${whereClause}
     ORDER BY t.created_at DESC`,
    params
  );

  return result.rows;
}

async function getTaskById(user, taskId) {
  const task = await findTaskForOrganization(taskId, user.organization_id);
  if (!task || task.deleted_at) {
    throw httpError(404, "Task not found");
  }

  if (!canViewTask(user, task)) {
    throw httpError(403, "Forbidden");
  }

  const result = await pool.query(
    `SELECT t.id,
            t.organization_id,
            t.title,
            t.description,
            t.status,
            t.created_by,
            t.assigned_to,
            t.created_at, t.updated_at,
            creator.full_name AS creator_name,
            assignee.full_name AS assignee_name
     FROM tasks t
     JOIN users creator ON creator.id = t.created_by
     LEFT JOIN users assignee ON assignee.id = t.assigned_to
     WHERE t.id = $1`,
    [taskId]
  );

  return result.rows[0];
}

async function ensureAssigneeBelongsToOrganization(organizationId, assignedTo) {
  if (!assignedTo) {
    return null;
  }

  const result = await pool.query(
    `SELECT u.id
     FROM users u
     WHERE u.id = $1 AND u.organization_id = $2`,
    [assignedTo, organizationId]
  );

  if (!result.rows[0]) {
    throw httpError(400, "Assignee must belong to the same organization");
  }

  return assignedTo;
}

async function createTask(user, payload) {
  const client = await pool.connect();

  try {
    const assignedTo = await ensureAssigneeBelongsToOrganization(
      user.organization_id,
      payload.assignedTo
    );

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO tasks (organization_id, title, description, status, created_by, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, organization_id, title, description, status, created_by, assigned_to, created_at, updated_at`,
      [
        user.organization_id,
        payload.title,
        payload.description || "",
        payload.status || "todo",
        user.id,
        assignedTo
      ]
    );

    const task = result.rows[0];

    await writeActivityLog(client, {
      taskId: task.id,
      organizationId: user.organization_id,
      actorUserId: user.id,
      action: "created",
      details: {
        title: task.title,
        status: task.status
      }
    });

    await client.query("COMMIT");
    return getTaskById(user, task.id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateTask(user, taskId, payload) {
  const client = await pool.connect();

  try {
    const task = await findTaskForOrganization(taskId, user.organization_id);
    if (!task || task.deleted_at) {
      throw httpError(404, "Task not found");
    }

    if (!canUpdateTask(user, task)) {
      throw httpError(403, "Forbidden");
    }

    if (user.role === "member") {
      const allowedFields = ["status"];
      const providedFields = Object.keys(payload).filter(
        (key) => payload[key] !== undefined
      );
      const invalidFields = providedFields.filter(
        (field) => !allowedFields.includes(field)
      );

      if (invalidFields.length > 0) {
        throw httpError(403, "Forbidden");
      }
    }

    const assignedTo =
      user.role === "admin" &&
      Object.prototype.hasOwnProperty.call(payload, "assignedTo")
        ? await ensureAssigneeBelongsToOrganization(
            user.organization_id,
            payload.assignedTo
          )
        : task.assigned_to;

    const nextTask = {
      title: payload.title ?? task.title,
      description: payload.description ?? task.description,
      status: payload.status ?? task.status,
      assignedTo
    };

    await client.query("BEGIN");

    await client.query(
      `UPDATE tasks
       SET title = $1,
           description = $2,
           status = $3,
           assigned_to = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [
        nextTask.title,
        nextTask.description,
        nextTask.status,
        nextTask.assignedTo,
        taskId
      ]
    );

    await writeActivityLog(client, {
      taskId,
      organizationId: user.organization_id,
      actorUserId: user.id,
      action: "updated",
      details: {
        before: {
          title: task.title,
          description: task.description,
          status: task.status,
          assignedTo: task.assigned_to
        },
        after: nextTask
      }
    });

    await client.query("COMMIT");
    return getTaskById(user, taskId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteTask(user, taskId) {
  const client = await pool.connect();

  try {
    const task = await findTaskForOrganization(taskId, user.organization_id);
    if (!task || task.deleted_at) {
      throw httpError(404, "Task not found");
    }

    if (!canDeleteTask(user, task)) {
      throw httpError(403, "Forbidden");
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE tasks
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [taskId]
    );

    await writeActivityLog(client, {
      taskId,
      organizationId: user.organization_id,
      actorUserId: user.id,
      action: "deleted",
      details: {
        title: task.title
      }
    });

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function listTaskActivity(user, taskId) {
  const task = await findTaskForOrganization(taskId, user.organization_id);
  if (!task) {
    throw httpError(404, "Task not found");
  }

  if (!canViewTask(user, task)) {
    throw httpError(403, "Forbidden");
  }

  const result = await pool.query(
    `SELECT l.id, l.task_id, l.action, l.details, l.created_at,
            u.full_name AS actor_name, u.email AS actor_email
     FROM task_activity_logs l
     JOIN users u ON u.id = l.actor_user_id
     WHERE l.task_id = $1 AND l.organization_id = $2
     ORDER BY l.created_at DESC`,
    [taskId, user.organization_id]
  );

  return result.rows;
}

module.exports = {
  createTask,
  deleteTask,
  getTaskById,
  listTaskActivity,
  listTasks,
  updateTask
};
