const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { loggers, logDatabaseOperation, logSecurityEvent } = require('./logger');

const router = express.Router();

// Database connection (will be passed from main server)
let pool;

function setPool(dbPool) {
  pool = dbPool;
}

// Admin authentication middleware
async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      });
    }

    // Check if user has admin role
    const userResult = await pool.query(
      'SELECT role, name, email, uuid FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    const user = userResult.rows[0];
    if (!user.role || !['admin', 'super_admin'].includes(user.role)) {
      // Log unauthorized access attempt
      await logAdminActivity({
        admin_id: req.user.userId,
        action: 'UNAUTHORIZED_ADMIN_ACCESS',
        details: { attempted_endpoint: req.originalUrl },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      return res.status(403).json({ 
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED' 
      });
    }

    // Add user info to request
    req.admin = user;
    next();
  } catch (error) {
    loggers.admin.error('Admin auth middleware error', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR' 
    });
  }
}

// Super admin only middleware
async function requireSuperAdmin(req, res, next) {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Super admin access required',
      code: 'SUPER_ADMIN_REQUIRED' 
    });
  }
  next();
}

// Log admin activity
async function logAdminActivity({ admin_id, action, target_type, target_id, details, ip_address, user_agent }) {
  try {
    await logDatabaseOperation(
      'Insert admin activity log',
      () => pool.query(`
        INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [admin_id, action, target_type, target_id, JSON.stringify(details), ip_address, user_agent])
    );

    // Also log with winston for immediate monitoring
    loggers.admin.adminActivity(action, admin_id, {
      target_type,
      target_id,
      details,
      ip_address,
      user_agent
    });
  } catch (error) {
    loggers.admin.error('Error logging admin activity', { 
      error: error.message,
      admin_id,
      action,
      target_type,
      target_id
    });
  }
}

// === ADMIN DASHBOARD ENDPOINTS ===

// Get admin dashboard stats
router.get('/dashboard/stats', requireAdmin, async (req, res) => {
  try {
    const [
      usersResult,
      activeUsersResult,
      messagesResult,
      notificationsResult,
      connectionsResult,
      recentUsersResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_banned = true) as banned FROM users'),
      pool.query('SELECT COUNT(*) as active FROM users WHERE last_login > NOW() - INTERVAL \'30 days\''),
      pool.query('SELECT COUNT(*) as total FROM messages WHERE created_at > NOW() - INTERVAL \'24 hours\''),
      pool.query('SELECT COUNT(*) as total FROM notifications WHERE created_at > NOW() - INTERVAL \'24 hours\''),
      pool.query('SELECT COUNT(*) as total FROM user_connections WHERE status = \'accepted\''),
      pool.query('SELECT COUNT(*) as recent FROM users WHERE created_at > NOW() - INTERVAL \'7 days\'')
    ]);

    // Get user type distribution
    const userTypesResult = await pool.query(`
      SELECT type, COUNT(*) as count 
      FROM users 
      GROUP BY type 
      ORDER BY count DESC
    `);

    await logAdminActivity({
      admin_id: req.user.userId,
      action: 'VIEW_DASHBOARD_STATS',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      users: {
        total: parseInt(usersResult.rows[0].total),
        banned: parseInt(usersResult.rows[0].banned),
        active: parseInt(activeUsersResult.rows[0].active),
        recent: parseInt(recentUsersResult.rows[0].recent)
      },
      activity: {
        messages_24h: parseInt(messagesResult.rows[0].total),
        notifications_24h: parseInt(notificationsResult.rows[0].total),
        connections: parseInt(connectionsResult.rows[0].total)
      },
      distribution: userTypesResult.rows
    });

  } catch (error) {
    console.error('❌ Admin dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats',
      code: 'STATS_ERROR' 
    });
  }
});

// === USER MANAGEMENT ENDPOINTS ===

// Get all users with admin details
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      type = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build where conditions
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (type) {
      whereConditions.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (status) {
      if (status === 'banned') {
        whereConditions.push('is_banned = true');
      } else if (status === 'active') {
        whereConditions.push('is_banned = false AND account_status = \'active\'');
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort fields
    const allowedSortFields = ['created_at', 'updated_at', 'last_login', 'name', 'email', 'type'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Get users
    const usersQuery = `
      SELECT 
        uuid as id, name, email, type, role, verified, is_banned, 
        ban_reason, banned_at, last_login, created_at, updated_at,
        login_attempts, email_verified, account_status
      FROM users 
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limitNum, offset);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countParams = params.slice(0, -2); // Remove limit and offset

    const [usersResult, countResult] = await Promise.all([
      pool.query(usersQuery, params),
      pool.query(countQuery, countParams)
    ]);

    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limitNum);

    await logAdminActivity({
      admin_id: req.user.userId,
      action: 'VIEW_USERS_LIST',
      details: { page, limit, search, filters: { role, type, status } },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      users: usersResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('❌ Admin get users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      code: 'USERS_FETCH_ERROR' 
    });
  }
});

// Get single user details
router.get('/users/:id', requireAdmin, [
  param('id').isUUID().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request parameters',
        details: errors.array() 
      });
    }

    const { id } = req.params;

    const userResult = await pool.query(`
      SELECT 
        uuid as id, name, email, type, role, industry, location, description,
        avatar, verified, is_banned, ban_reason, banned_at, banned_by,
        login_attempts, last_failed_login, last_login, email_verified,
        account_status, phone, company, position, bio, created_at, updated_at,
        profile_data, stats
      FROM users 
      WHERE uuid = $1
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    // Get user activity stats
    const [messagesResult, connectionsResult, notificationsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as sent FROM messages WHERE sender_id = (SELECT id FROM users WHERE uuid = $1)', [id]),
      pool.query('SELECT COUNT(*) as connections FROM user_connections WHERE (requester_id = (SELECT id FROM users WHERE uuid = $1) OR addressee_id = (SELECT id FROM users WHERE uuid = $1)) AND status = \'accepted\'', [id]),
      pool.query('SELECT COUNT(*) as notifications FROM notifications WHERE user_id = $1', [id])
    ]);

    const user = {
      ...userResult.rows[0],
      activity: {
        messages_sent: parseInt(messagesResult.rows[0].sent),
        connections: parseInt(connectionsResult.rows[0].connections),
        notifications: parseInt(notificationsResult.rows[0].notifications)
      }
    };

    await logAdminActivity({
      admin_id: req.user.userId,
      action: 'VIEW_USER_DETAILS',
      target_type: 'user',
      target_id: id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ user });

  } catch (error) {
    console.error('❌ Admin get user details error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user details',
      code: 'USER_DETAILS_ERROR' 
    });
  }
});

// Update user (admin)
router.put('/users/:id', requireAdmin, [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('type').optional().isIn(['PME/Startup', 'Expert/Consultant', 'Mentor', 'Investisseur', 'Freelancer']).withMessage('Invalid user type'),
  body('role').optional().isIn(['user', 'admin', 'super_admin']).withMessage('Invalid role'),
  body('verified').optional().isBoolean().withMessage('Verified must be boolean'),
  body('account_status').optional().isIn(['active', 'suspended', 'pending']).withMessage('Invalid account status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if user exists
    const userCheck = await pool.query('SELECT name, email, role FROM users WHERE uuid = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    const currentUser = userCheck.rows[0];

    // Prevent non-super-admins from modifying admin roles
    if (updates.role && req.admin.role !== 'super_admin' && 
        (['admin', 'super_admin'].includes(updates.role) || ['admin', 'super_admin'].includes(currentUser.role))) {
      return res.status(403).json({ 
        error: 'Super admin access required to modify admin roles',
        code: 'SUPER_ADMIN_REQUIRED' 
      });
    }

    // Build update query
    const setFields = [];
    const params = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && ['name', 'email', 'type', 'role', 'verified', 'account_status'].includes(key)) {
        setFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (setFields.length === 0) {
      return res.status(400).json({ 
        error: 'No valid fields to update',
        code: 'NO_UPDATE_FIELDS' 
      });
    }

    setFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id); // Add ID for WHERE clause

    const updateQuery = `
      UPDATE users 
      SET ${setFields.join(', ')} 
      WHERE uuid = $${paramIndex}
      RETURNING uuid as id, name, email, type, role, verified, account_status, updated_at
    `;

    const result = await pool.query(updateQuery, params);

    await logAdminActivity({
      admin_id: req.user.userId,
      action: 'UPDATE_USER',
      target_type: 'user',
      target_id: id,
      details: { 
        updated_fields: Object.keys(updates),
        old_values: currentUser,
        new_values: updates 
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Admin update user error:', error);
    if (error.constraint === 'users_email_key') {
      return res.status(400).json({ 
        error: 'Email already exists',
        code: 'EMAIL_EXISTS' 
      });
    }
    res.status(500).json({ 
      error: 'Failed to update user',
      code: 'USER_UPDATE_ERROR' 
    });
  }
});

// Ban/unban user
router.put('/users/:id/ban', requireAdmin, [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('is_banned').isBoolean().withMessage('is_banned must be boolean'),
  body('ban_reason').optional().trim().isLength({ max: 500 }).withMessage('Ban reason too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { is_banned, ban_reason } = req.body;

    // Check if user exists and get current status
    const userResult = await pool.query('SELECT name, email, is_banned, role FROM users WHERE uuid = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    const user = userResult.rows[0];

    // Prevent banning admin users (unless super admin)
    if (user.role && ['admin', 'super_admin'].includes(user.role) && req.admin.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Cannot ban admin users',
        code: 'CANNOT_BAN_ADMIN' 
      });
    }

    // Prevent self-ban
    if (id === req.user.userId) {
      return res.status(400).json({ 
        error: 'Cannot ban yourself',
        code: 'CANNOT_SELF_BAN' 
      });
    }

    // Update ban status
    const updateQuery = is_banned 
      ? `UPDATE users SET is_banned = true, ban_reason = $2, banned_at = CURRENT_TIMESTAMP, banned_by = $3, updated_at = CURRENT_TIMESTAMP WHERE uuid = $1`
      : `UPDATE users SET is_banned = false, ban_reason = NULL, banned_at = NULL, banned_by = NULL, updated_at = CURRENT_TIMESTAMP WHERE uuid = $1`;

    const params = is_banned ? [id, ban_reason, req.user.userId] : [id];
    await pool.query(updateQuery, params);

    await logAdminActivity({
      admin_id: req.user.userId,
      action: is_banned ? 'BAN_USER' : 'UNBAN_USER',
      target_type: 'user',
      target_id: id,
      details: { 
        user_name: user.name,
        user_email: user.email,
        ban_reason: ban_reason || null,
        previous_status: user.is_banned 
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      message: is_banned ? 'User banned successfully' : 'User unbanned successfully',
      user_id: id,
      is_banned
    });

  } catch (error) {
    console.error('❌ Admin ban/unban user error:', error);
    res.status(500).json({ 
      error: 'Failed to update ban status',
      code: 'BAN_UPDATE_ERROR' 
    });
  }
});

// Delete user (hard delete - super admin only)
router.delete('/users/:id', requireAdmin, requireSuperAdmin, [
  param('id').isUUID().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request parameters',
        details: errors.array() 
      });
    }

    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.userId) {
      return res.status(400).json({ 
        error: 'Cannot delete yourself',
        code: 'CANNOT_SELF_DELETE' 
      });
    }

    // Get user info before deletion
    const userResult = await pool.query('SELECT name, email, type, role FROM users WHERE uuid = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    const user = userResult.rows[0];

    // Delete user (cascade will handle related records)
    await pool.query('DELETE FROM users WHERE uuid = $1', [id]);

    await logAdminActivity({
      admin_id: req.user.userId,
      action: 'DELETE_USER',
      target_type: 'user',
      target_id: id,
      details: { 
        deleted_user: user
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      message: 'User deleted successfully',
      deleted_user: {
        id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Admin delete user error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user',
      code: 'USER_DELETE_ERROR' 
    });
  }
});

// === SYSTEM MONITORING ENDPOINTS ===

// Get system health
router.get('/system/health', requireAdmin, async (req, res) => {
  try {
    const checks = {
      database: false,
      disk_space: 'unknown',
      memory_usage: 'unknown',
      uptime: process.uptime()
    };

    // Database check
    try {
      await pool.query('SELECT 1');
      checks.database = true;
    } catch (error) {
      checks.database = false;
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    checks.memory_usage = {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
    };

    await logAdminActivity({
      admin_id: req.user.userId,
      action: 'CHECK_SYSTEM_HEALTH',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      status: checks.database ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ System health check error:', error);
    res.status(500).json({ 
      error: 'Failed to check system health',
      code: 'HEALTH_CHECK_ERROR' 
    });
  }
});

// Get admin activity logs
router.get('/system/logs', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action = '',
      admin_id = '',
      days = 7
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    let whereConditions = [`l.created_at > NOW() - INTERVAL '${parseInt(days)} days'`];
    let params = [];
    let paramIndex = 1;

    if (action) {
      whereConditions.push(`action ILIKE $${paramIndex}`);
      params.push(`%${action}%`);
      paramIndex++;
    }

    if (admin_id) {
      whereConditions.push(`admin_id = $${paramIndex}`);
      params.push(admin_id);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const logsQuery = `
      SELECT 
        l.id, l.action, l.target_type, l.target_id, l.details,
        l.ip_address, l.created_at, u.name as admin_name, u.email as admin_email
      FROM admin_activity_logs l
      JOIN users u ON l.admin_id = u.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limitNum, offset);

    const countQuery = `
      SELECT COUNT(*) FROM admin_activity_logs l
      JOIN users u ON l.admin_id = u.id
      ${whereClause}
    `;
    const countParams = params.slice(0, -2);

    const [logsResult, countResult] = await Promise.all([
      pool.query(logsQuery, params),
      pool.query(countQuery, countParams)
    ]);

    const totalLogs = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalLogs / limitNum);

    res.json({
      logs: logsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalLogs,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('❌ Get admin logs error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin logs',
      code: 'LOGS_FETCH_ERROR' 
    });
  }
});

// === SYSTEM SETTINGS ENDPOINTS ===

// Get system settings
router.get('/system/settings', requireAdmin, async (req, res) => {
  try {
    const settingsResult = await pool.query(`
      SELECT key, value, description, updated_at 
      FROM system_settings 
      ORDER BY key
    `);

    await logAdminActivity({
      admin_id: req.user.userId,
      action: 'VIEW_SYSTEM_SETTINGS',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      settings: settingsResult.rows
    });

  } catch (error) {
    console.error('❌ Get system settings error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system settings',
      code: 'SETTINGS_FETCH_ERROR' 
    });
  }
});

// Update system settings (super admin only)
router.put('/system/settings', requireAdmin, requireSuperAdmin, [
  body('settings').isArray().withMessage('Settings must be an array'),
  body('settings.*.key').notEmpty().withMessage('Setting key is required'),
  body('settings.*.value').notEmpty().withMessage('Setting value is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: errors.array() 
      });
    }

    const { settings } = req.body;

    // Update settings
    for (const setting of settings) {
      await pool.query(`
        UPDATE system_settings 
        SET value = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
        WHERE key = $1
      `, [setting.key, JSON.stringify(setting.value), req.user.userId]);
    }

    await logAdminActivity({
      admin_id: req.user.userId,
      action: 'UPDATE_SYSTEM_SETTINGS',
      details: { updated_settings: settings },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      message: 'System settings updated successfully',
      updated_count: settings.length
    });

  } catch (error) {
    console.error('❌ Update system settings error:', error);
    res.status(500).json({ 
      error: 'Failed to update system settings',
      code: 'SETTINGS_UPDATE_ERROR' 
    });
  }
});

module.exports = {
  router,
  setPool,
  requireAdmin
};