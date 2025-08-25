const express = require('express');
const PerformanceMonitor = require('./performance-monitor');
const { loggers } = require('./logger');

const router = express.Router();

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor({
  enablePrometheus: true,
  metricsPrefix: 'pme2go_api_',
  collectDefaultMetrics: true
});

// Middleware to add performance monitoring to all routes
const performanceMiddleware = performanceMonitor.createHttpMonitoringMiddleware();

// Performance endpoints
router.get('/metrics', (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    if (!metrics) {
      return res.status(503).json({
        error: 'Prometheus metrics not enabled'
      });
    }
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    loggers.api.error('Failed to get metrics', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

router.get('/report', (req, res) => {
  try {
    const report = performanceMonitor.getPerformanceReport();
    res.json({
      success: true,
      report
    });
  } catch (error) {
    loggers.api.error('Failed to generate performance report', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate performance report',
      message: error.message
    });
  }
});

router.get('/health', (req, res) => {
  try {
    const health = performanceMonitor.getSystemHealth();
    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    loggers.api.error('Failed to get system health', { error: error.message });
    res.status(500).json({
      error: 'Failed to get system health',
      message: error.message
    });
  }
});

router.get('/slow-queries', (req, res) => {
  try {
    const slowQueries = performanceMonitor.getSlowQueries();
    res.json({
      success: true,
      slowQueries,
      count: slowQueries.length
    });
  } catch (error) {
    loggers.api.error('Failed to get slow queries', { error: error.message });
    res.status(500).json({
      error: 'Failed to get slow queries',
      message: error.message
    });
  }
});

router.get('/alerts', (req, res) => {
  try {
    const unresolved = req.query.unresolved === 'true';
    const alerts = performanceMonitor.getAlerts(unresolved);
    res.json({
      success: true,
      alerts,
      count: alerts.length,
      filter: unresolved ? 'unresolved' : 'all'
    });
  } catch (error) {
    loggers.api.error('Failed to get alerts', { error: error.message });
    res.status(500).json({
      error: 'Failed to get alerts',
      message: error.message
    });
  }
});

router.put('/alerts/:alertId/resolve', (req, res) => {
  try {
    const { alertId } = req.params;
    const success = performanceMonitor.resolveAlert(alertId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Alert resolved successfully'
      });
    } else {
      res.status(404).json({
        error: 'Alert not found'
      });
    }
  } catch (error) {
    loggers.api.error('Failed to resolve alert', { 
      alertId: req.params.alertId, 
      error: error.message 
    });
    res.status(500).json({
      error: 'Failed to resolve alert',
      message: error.message
    });
  }
});

router.get('/endpoints', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topEndpoints = performanceMonitor.getTopEndpoints(limit);
    res.json({
      success: true,
      endpoints: topEndpoints,
      limit
    });
  } catch (error) {
    loggers.api.error('Failed to get top endpoints', { error: error.message });
    res.status(500).json({
      error: 'Failed to get top endpoints',
      message: error.message
    });
  }
});

router.post('/reset', (req, res) => {
  try {
    performanceMonitor.reset();
    res.json({
      success: true,
      message: 'Performance data reset successfully'
    });
  } catch (error) {
    loggers.api.error('Failed to reset performance data', { error: error.message });
    res.status(500).json({
      error: 'Failed to reset performance data',
      message: error.message
    });
  }
});

// Performance dashboard endpoint (returns HTML)
router.get('/dashboard', (req, res) => {
  const dashboardHtml = generatePerformanceDashboard();
  res.set('Content-Type', 'text/html');
  res.send(dashboardHtml);
});

function generatePerformanceDashboard() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PME2GO API Performance Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card h3 {
            margin: 0 0 15px 0;
            color: #333;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child {
            border-bottom: none;
        }
        .metric-value {
            font-weight: bold;
            color: #667eea;
        }
        .status-good {
            color: #4caf50;
        }
        .status-warning {
            color: #ff9800;
        }
        .status-error {
            color: #f44336;
        }
        .refresh-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 20px;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            font-weight: bold;
        }
        .refresh-btn:hover {
            background: #5a67d8;
        }
        .alert {
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            border-left: 4px solid;
        }
        .alert-high {
            background-color: #ffebee;
            border-left-color: #f44336;
            color: #c62828;
        }
        .alert-medium {
            background-color: #fff3e0;
            border-left-color: #ff9800;
            color: #ef6c00;
        }
        .alert-low {
            background-color: #e8f5e8;
            border-left-color: #4caf50;
            color: #2e7d32;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 PME2GO API Performance Dashboard</h1>
        <p>Real-time monitoring and performance metrics</p>
        <p><small>Last updated: <span id="lastUpdated">Loading...</span></small></p>
    </div>

    <div class="dashboard-grid">
        <div class="card">
            <h3>📊 System Health</h3>
            <div id="systemHealth" class="loading">Loading...</div>
        </div>

        <div class="card">
            <h3>🚨 Active Alerts</h3>
            <div id="activeAlerts" class="loading">Loading...</div>
        </div>

        <div class="card">
            <h3>🔥 Top Endpoints</h3>
            <div id="topEndpoints" class="loading">Loading...</div>
        </div>

        <div class="card">
            <h3>🐌 Slow Queries</h3>
            <div id="slowQueries" class="loading">Loading...</div>
        </div>

        <div class="card">
            <h3>📈 Performance Report</h3>
            <div id="performanceReport" class="loading">Loading...</div>
        </div>
    </div>

    <button class="refresh-btn" onclick="refreshDashboard()">🔄 Refresh</button>

    <script>
        async function fetchData(endpoint) {
            try {
                const response = await fetch(endpoint);
                return await response.json();
            } catch (error) {
                console.error('Failed to fetch data:', error);
                return null;
            }
        }

        function formatUptime(seconds) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return days > 0 ? \`\${days}d \${hours}h \${mins}m\` : \`\${hours}h \${mins}m\`;
        }

        async function updateSystemHealth() {
            const data = await fetchData('/api/admin/performance/health');
            const container = document.getElementById('systemHealth');
            
            if (data && data.success) {
                const health = data.health;
                container.innerHTML = \`
                    <div class="metric">
                        <span>Uptime</span>
                        <span class="metric-value status-good">\${formatUptime(health.uptime)}</span>
                    </div>
                    <div class="metric">
                        <span>Memory (RSS)</span>
                        <span class="metric-value">\${health.memory.rss}</span>
                    </div>
                    <div class="metric">
                        <span>Memory (Heap)</span>
                        <span class="metric-value">\${health.memory.heapUsed} / \${health.memory.heapTotal}</span>
                    </div>
                    <div class="metric">
                        <span>Total Requests</span>
                        <span class="metric-value">\${health.requests.total.toLocaleString()}</span>
                    </div>
                    <div class="metric">
                        <span>Active Requests</span>
                        <span class="metric-value">\${health.requests.active}</span>
                    </div>
                    <div class="metric">
                        <span>Error Rate</span>
                        <span class="metric-value \${health.requests.errorRate === '0%' ? 'status-good' : 'status-warning'}">\${health.requests.errorRate}</span>
                    </div>
                \`;
            } else {
                container.innerHTML = '<div class="status-error">Failed to load system health</div>';
            }
        }

        async function updateActiveAlerts() {
            const data = await fetchData('/api/admin/performance/alerts?unresolved=true');
            const container = document.getElementById('activeAlerts');
            
            if (data && data.success) {
                if (data.alerts.length === 0) {
                    container.innerHTML = '<div class="status-good">✅ No active alerts</div>';
                } else {
                    container.innerHTML = data.alerts.map(alert => \`
                        <div class="alert alert-\${alert.severity}">
                            <strong>\${alert.type.replace(/_/g, ' ').toUpperCase()}</strong><br>
                            <small>\${alert.message}</small><br>
                            <small>\${new Date(alert.timestamp).toLocaleString()}</small>
                        </div>
                    \`).join('');
                }
            } else {
                container.innerHTML = '<div class="status-error">Failed to load alerts</div>';
            }
        }

        async function updateTopEndpoints() {
            const data = await fetchData('/api/admin/performance/endpoints?limit=5');
            const container = document.getElementById('topEndpoints');
            
            if (data && data.success) {
                if (data.endpoints.length === 0) {
                    container.innerHTML = '<div>No endpoint data available</div>';
                } else {
                    container.innerHTML = data.endpoints.map(endpoint => \`
                        <div class="metric">
                            <span>\${endpoint.endpoint}</span>
                            <div>
                                <div class="metric-value">\${endpoint.requests} req</div>
                                <small>\${endpoint.avgDuration}s avg, \${endpoint.errorRate} errors</small>
                            </div>
                        </div>
                    \`).join('');
                }
            } else {
                container.innerHTML = '<div class="status-error">Failed to load endpoints</div>';
            }
        }

        async function updateSlowQueries() {
            const data = await fetchData('/api/admin/performance/slow-queries');
            const container = document.getElementById('slowQueries');
            
            if (data && data.success) {
                if (data.slowQueries.length === 0) {
                    container.innerHTML = '<div class="status-good">✅ No slow queries detected</div>';
                } else {
                    container.innerHTML = data.slowQueries.slice(0, 3).map(query => \`
                        <div class="metric">
                            <span>\${query.operation} on \${query.table}</span>
                            <div>
                                <div class="metric-value status-warning">\${query.duration.toFixed(2)}s</div>
                                <small>\${new Date(query.timestamp).toLocaleString()}</small>
                            </div>
                        </div>
                    \`).join('');
                }
            } else {
                container.innerHTML = '<div class="status-error">Failed to load slow queries</div>';
            }
        }

        async function updatePerformanceReport() {
            const data = await fetchData('/api/admin/performance/report');
            const container = document.getElementById('performanceReport');
            
            if (data && data.success) {
                const report = data.report;
                container.innerHTML = \`
                    <div class="metric">
                        <span>Uptime</span>
                        <span class="metric-value">\${formatUptime(Math.floor(report.uptime / 1000))}</span>
                    </div>
                    <div class="metric">
                        <span>Total Requests</span>
                        <span class="metric-value">\${report.requests.total.toLocaleString()}</span>
                    </div>
                    <div class="metric">
                        <span>Active Requests</span>
                        <span class="metric-value">\${report.requests.active}</span>
                    </div>
                    <div class="metric">
                        <span>Total Errors</span>
                        <span class="metric-value \${report.requests.errors > 0 ? 'status-warning' : 'status-good'}">\${report.requests.errors}</span>
                    </div>
                    <div class="metric">
                        <span>Last Updated</span>
                        <span class="metric-value">\${new Date(report.timestamp).toLocaleString()}</span>
                    </div>
                \`;
            } else {
                container.innerHTML = '<div class="status-error">Failed to load performance report</div>';
            }
        }

        async function refreshDashboard() {
            document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
            
            await Promise.all([
                updateSystemHealth(),
                updateActiveAlerts(),
                updateTopEndpoints(),
                updateSlowQueries(),
                updatePerformanceReport()
            ]);
        }

        // Initial load
        refreshDashboard();

        // Auto-refresh every 30 seconds
        setInterval(refreshDashboard, 30000);
    </script>
</body>
</html>
  `;
}

// Enhanced database query wrapper for performance tracking
function createDatabaseQueryWrapper(originalQuery) {
  return function wrappedQuery(...args) {
    const startTime = Date.now();
    const queryText = args[0];
    
    return originalQuery.apply(this, args)
      .then(result => {
        const duration = Date.now() - startTime;
        performanceMonitor.trackDatabaseQuery(queryText, duration, null, extractTableName(queryText));
        return result;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        performanceMonitor.trackDatabaseQuery(queryText, duration, error, extractTableName(queryText));
        throw error;
      });
  };
}

function extractTableName(query) {
  const tableMatches = query.toLowerCase().match(/(?:from|into|update|join)\\s+([\\w_]+)/);
  return tableMatches ? tableMatches[1] : 'unknown';
}

module.exports = {
  router,
  performanceMonitor,
  performanceMiddleware,
  createDatabaseQueryWrapper
};