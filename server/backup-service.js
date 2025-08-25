const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');
const { Pool } = require('pg');
const archiver = require('archiver');
const { loggers } = require('./logger');

class BackupService {
  constructor(config = {}) {
    this.config = {
      backupDir: config.backupDir || path.join(__dirname, 'backups'),
      retentionDays: config.retentionDays || 30,
      compressionLevel: config.compressionLevel || 6,
      schedules: {
        full: config.fullBackupSchedule || '0 2 * * *', // Daily at 2 AM
        incremental: config.incrementalSchedule || '0 */6 * * *', // Every 6 hours
        cleanup: config.cleanupSchedule || '0 3 * * 0' // Weekly on Sunday at 3 AM
      },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'Postgres2024!'
      },
      ...config
    };

    this.pool = new Pool(this.config.database);
    this.isInitialized = false;
    this.scheduledJobs = [];
  }

  async initialize() {
    try {
      // Create backup directory if it doesn't exist
      await this.ensureDirectoryExists(this.config.backupDir);
      await this.ensureDirectoryExists(path.join(this.config.backupDir, 'full'));
      await this.ensureDirectoryExists(path.join(this.config.backupDir, 'incremental'));
      await this.ensureDirectoryExists(path.join(this.config.backupDir, 'logs'));

      // Test database connection
      await this.testConnection();

      // Start scheduled backups
      this.startScheduledBackups();

      this.isInitialized = true;
      loggers.server.info('Backup service initialized successfully', {
        backupDir: this.config.backupDir,
        retentionDays: this.config.retentionDays,
        schedules: this.config.schedules
      });

      return true;
    } catch (error) {
      loggers.server.error('Failed to initialize backup service', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.promises.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.promises.mkdir(dirPath, { recursive: true });
        loggers.server.debug('Created backup directory', { path: dirPath });
      } else {
        throw error;
      }
    }
  }

  async testConnection() {
    try {
      const result = await this.pool.query('SELECT NOW() as timestamp, version() as version');
      loggers.server.info('Backup service database connection verified', {
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version.substring(0, 50) + '...'
      });
      return true;
    } catch (error) {
      loggers.server.error('Backup service database connection failed', {
        error: error.message,
        host: this.config.database.host,
        database: this.config.database.database
      });
      throw error;
    }
  }

  startScheduledBackups() {
    if (this.config.schedules.full) {
      const fullBackupJob = cron.schedule(this.config.schedules.full, () => {
        this.createFullBackup();
      }, { scheduled: false });

      this.scheduledJobs.push({
        name: 'full-backup',
        job: fullBackupJob,
        schedule: this.config.schedules.full
      });

      fullBackupJob.start();
      loggers.server.info('Scheduled full backup job', { 
        schedule: this.config.schedules.full 
      });
    }

    if (this.config.schedules.incremental) {
      const incrementalJob = cron.schedule(this.config.schedules.incremental, () => {
        this.createIncrementalBackup();
      }, { scheduled: false });

      this.scheduledJobs.push({
        name: 'incremental-backup',
        job: incrementalJob,
        schedule: this.config.schedules.incremental
      });

      incrementalJob.start();
      loggers.server.info('Scheduled incremental backup job', { 
        schedule: this.config.schedules.incremental 
      });
    }

    if (this.config.schedules.cleanup) {
      const cleanupJob = cron.schedule(this.config.schedules.cleanup, () => {
        this.cleanupOldBackups();
      }, { scheduled: false });

      this.scheduledJobs.push({
        name: 'cleanup',
        job: cleanupJob,
        schedule: this.config.schedules.cleanup
      });

      cleanupJob.start();
      loggers.server.info('Scheduled backup cleanup job', { 
        schedule: this.config.schedules.cleanup 
      });
    }
  }

  async createFullBackup(options = {}) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `full_backup_${timestamp}`;
    const backupDir = path.join(this.config.backupDir, 'full', backupName);

    try {
      loggers.server.info('Starting full backup', { backupName });

      await this.ensureDirectoryExists(backupDir);

      // Create database dump
      const dumpFile = await this.createDatabaseDump(backupDir, 'full');
      
      // Create application data backup
      const appDataFile = await this.backupApplicationData(backupDir);

      // Create system info backup
      const sysInfoFile = await this.backupSystemInfo(backupDir);

      // Create backup logs
      const logsFile = await this.backupLogs(backupDir);

      // Create backup manifest
      const manifest = await this.createBackupManifest(backupDir, {
        type: 'full',
        timestamp: new Date().toISOString(),
        files: {
          database: path.basename(dumpFile),
          applicationData: path.basename(appDataFile),
          systemInfo: path.basename(sysInfoFile),
          logs: path.basename(logsFile)
        },
        metadata: {
          databaseSize: await this.getDatabaseSize(),
          nodeVersion: process.version,
          platform: process.platform,
          ...options.metadata
        }
      });

      // Compress backup if requested
      let finalBackupPath = backupDir;
      if (options.compress !== false) {
        finalBackupPath = await this.compressBackup(backupDir);
        
        // Remove uncompressed directory
        await fs.promises.rmdir(backupDir, { recursive: true });
      }

      const duration = Date.now() - startTime;
      const stats = await fs.promises.stat(finalBackupPath);

      loggers.server.info('Full backup completed successfully', {
        backupName,
        backupPath: finalBackupPath,
        duration: `${duration}ms`,
        size: `${Math.round(stats.size / 1024 / 1024 * 100) / 100}MB`,
        compressed: options.compress !== false
      });

      return {
        success: true,
        backupPath: finalBackupPath,
        backupName,
        type: 'full',
        duration,
        size: stats.size,
        manifest
      };

    } catch (error) {
      loggers.server.error('Full backup failed', {
        backupName,
        error: error.message,
        stack: error.stack
      });

      // Cleanup partial backup
      try {
        if (await this.pathExists(backupDir)) {
          await fs.promises.rmdir(backupDir, { recursive: true });
        }
      } catch (cleanupError) {
        loggers.server.warn('Failed to cleanup partial backup', {
          backupDir,
          error: cleanupError.message
        });
      }

      throw error;
    }
  }

  async createIncrementalBackup(options = {}) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `incremental_backup_${timestamp}`;
    const backupDir = path.join(this.config.backupDir, 'incremental', backupName);

    try {
      loggers.server.info('Starting incremental backup', { backupName });

      await this.ensureDirectoryExists(backupDir);

      // Get last backup timestamp for incremental changes
      const lastBackupTime = await this.getLastBackupTimestamp();

      // Create incremental database dump (only changes since last backup)
      const dumpFile = await this.createIncrementalDatabaseDump(backupDir, lastBackupTime);

      // Backup recent logs only
      const logsFile = await this.backupRecentLogs(backupDir, lastBackupTime);

      // Create backup manifest
      const manifest = await this.createBackupManifest(backupDir, {
        type: 'incremental',
        timestamp: new Date().toISOString(),
        baseTimestamp: lastBackupTime,
        files: {
          database: path.basename(dumpFile),
          logs: path.basename(logsFile)
        },
        metadata: {
          nodeVersion: process.version,
          platform: process.platform,
          ...options.metadata
        }
      });

      // Compress backup
      const finalBackupPath = await this.compressBackup(backupDir);
      await fs.promises.rmdir(backupDir, { recursive: true });

      const duration = Date.now() - startTime;
      const stats = await fs.promises.stat(finalBackupPath);

      loggers.server.info('Incremental backup completed successfully', {
        backupName,
        backupPath: finalBackupPath,
        duration: `${duration}ms`,
        size: `${Math.round(stats.size / 1024 / 1024 * 100) / 100}MB`,
        baseTimestamp: lastBackupTime
      });

      return {
        success: true,
        backupPath: finalBackupPath,
        backupName,
        type: 'incremental',
        duration,
        size: stats.size,
        baseTimestamp: lastBackupTime,
        manifest
      };

    } catch (error) {
      loggers.server.error('Incremental backup failed', {
        backupName,
        error: error.message,
        stack: error.stack
      });

      // Cleanup partial backup
      try {
        if (await this.pathExists(backupDir)) {
          await fs.promises.rmdir(backupDir, { recursive: true });
        }
      } catch (cleanupError) {
        loggers.server.warn('Failed to cleanup partial incremental backup', {
          backupDir,
          error: cleanupError.message
        });
      }

      throw error;
    }
  }

  async createDatabaseDump(backupDir, type = 'full') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database_${type}_${timestamp}.sql`;
    const filePath = path.join(backupDir, filename);

    return new Promise((resolve, reject) => {
      const args = [
        '-h', this.config.database.host,
        '-p', this.config.database.port.toString(),
        '-U', this.config.database.user,
        '-d', this.config.database.database,
        '--verbose',
        '--clean',
        '--no-owner',
        '--no-privileges',
        '-f', filePath
      ];

      const pgDump = spawn('pg_dump', args, {
        env: { ...process.env, PGPASSWORD: this.config.database.password },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pgDump.stdout.on('data', (data) => {
        output += data.toString();
      });

      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pgDump.on('close', (code) => {
        if (code === 0) {
          loggers.server.info('Database dump created successfully', {
            filename,
            type,
            outputLines: output.split('\\n').length
          });
          resolve(filePath);
        } else {
          loggers.server.error('Database dump failed', {
            filename,
            type,
            code,
            stderr: errorOutput,
            stdout: output
          });
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`));
        }
      });

      pgDump.on('error', (error) => {
        loggers.server.error('pg_dump process error', {
          filename,
          error: error.message
        });
        reject(error);
      });
    });
  }

  async createIncrementalDatabaseDump(backupDir, sinceTimestamp) {
    // For incremental dumps, we'll dump tables with updated_at/created_at > sinceTimestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database_incremental_${timestamp}.sql`;
    const filePath = path.join(backupDir, filename);

    // Get list of tables that have timestamp columns
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND (column_name = 'updated_at' OR column_name = 'created_at')
      GROUP BY table_name
    `;

    try {
      const tablesResult = await this.pool.query(tablesQuery);
      const tables = tablesResult.rows.map(row => row.table_name);

      if (tables.length === 0) {
        // No tables with timestamps, create empty dump
        await fs.promises.writeFile(filePath, '-- No incremental changes found\\n');
        return filePath;
      }

      return new Promise((resolve, reject) => {
        const args = [
          '-h', this.config.database.host,
          '-p', this.config.database.port.toString(),
          '-U', this.config.database.user,
          '-d', this.config.database.database,
          '--data-only',
          '--verbose',
          '--no-owner',
          '--no-privileges',
          '-f', filePath
        ];

        // Add table filters
        tables.forEach(table => {
          args.push('-t', table);
        });

        const pgDump = spawn('pg_dump', args, {
          env: { ...process.env, PGPASSWORD: this.config.database.password },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let errorOutput = '';

        pgDump.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pgDump.on('close', (code) => {
          if (code === 0) {
            loggers.server.info('Incremental database dump created successfully', {
              filename,
              tables: tables.length,
              sinceTimestamp
            });
            resolve(filePath);
          } else {
            reject(new Error(`Incremental pg_dump failed with code ${code}: ${errorOutput}`));
          }
        });

        pgDump.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      throw new Error(`Failed to create incremental dump: ${error.message}`);
    }
  }

  async backupApplicationData(backupDir) {
    const filename = `application_data_${Date.now()}.json`;
    const filePath = path.join(backupDir, filename);

    // Gather application-specific data
    const appData = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      configuration: {
        jwtSecret: process.env.JWT_SECRET ? '[ENCRYPTED]' : '[NOT_SET]',
        databaseUrl: this.config.database.host,
        emailService: process.env.EMAIL_SERVICE || 'ethereal'
      },
      stats: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    await fs.promises.writeFile(filePath, JSON.stringify(appData, null, 2));

    loggers.server.debug('Application data backed up', { filename });
    return filePath;
  }

  async backupSystemInfo(backupDir) {
    const filename = `system_info_${Date.now()}.json`;
    const filePath = path.join(backupDir, filename);

    const systemInfo = {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        LOG_LEVEL: process.env.LOG_LEVEL
      }
    };

    await fs.promises.writeFile(filePath, JSON.stringify(systemInfo, null, 2));

    loggers.server.debug('System info backed up', { filename });
    return filePath;
  }

  async backupLogs(backupDir) {
    const filename = `logs_backup_${Date.now()}.tar.gz`;
    const filePath = path.join(backupDir, filename);
    const logsDir = path.join(__dirname, 'logs');

    return this.createArchive(logsDir, filePath, {
      pattern: '*.log',
      maxAge: 7 // Only backup logs from last 7 days
    });
  }

  async backupRecentLogs(backupDir, sinceTimestamp) {
    const filename = `recent_logs_${Date.now()}.tar.gz`;
    const filePath = path.join(backupDir, filename);
    const logsDir = path.join(__dirname, 'logs');

    return this.createArchive(logsDir, filePath, {
      pattern: '*.log',
      since: sinceTimestamp
    });
  }

  async createArchive(sourceDir, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
      const archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
          level: this.config.compressionLevel
        }
      });

      const output = fs.createWriteStream(outputPath);

      output.on('close', () => {
        loggers.server.debug('Archive created successfully', {
          outputPath,
          size: `${Math.round(archive.pointer() / 1024 / 1024 * 100) / 100}MB`
        });
        resolve(outputPath);
      });

      archive.on('error', (error) => {
        loggers.server.error('Archive creation failed', {
          outputPath,
          error: error.message
        });
        reject(error);
      });

      archive.pipe(output);

      if (options.pattern) {
        archive.glob(options.pattern, { cwd: sourceDir });
      } else {
        archive.directory(sourceDir, false);
      }

      archive.finalize();
    });
  }

  async createBackupManifest(backupDir, manifestData) {
    const filename = 'manifest.json';
    const filePath = path.join(backupDir, filename);

    const manifest = {
      ...manifestData,
      created: new Date().toISOString(),
      version: '1.0',
      checksums: {}
    };

    // Calculate checksums for files
    if (manifestData.files) {
      for (const [key, filename] of Object.entries(manifestData.files)) {
        const filePath = path.join(backupDir, filename);
        if (await this.pathExists(filePath)) {
          manifest.checksums[key] = await this.calculateChecksum(filePath);
        }
      }
    }

    await fs.promises.writeFile(filePath, JSON.stringify(manifest, null, 2));

    loggers.server.debug('Backup manifest created', { filename });
    return manifest;
  }

  async compressBackup(backupDir) {
    const backupName = path.basename(backupDir);
    const compressedPath = `${backupDir}.tar.gz`;

    return new Promise((resolve, reject) => {
      const archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
          level: this.config.compressionLevel
        }
      });

      const output = fs.createWriteStream(compressedPath);

      output.on('close', () => {
        loggers.server.debug('Backup compressed successfully', {
          backupName,
          compressedPath,
          originalSize: archive.pointer(),
          compressedSize: `${Math.round(archive.pointer() / 1024 / 1024 * 100) / 100}MB`
        });
        resolve(compressedPath);
      });

      archive.on('error', (error) => {
        loggers.server.error('Backup compression failed', {
          backupName,
          error: error.message
        });
        reject(error);
      });

      archive.pipe(output);
      archive.directory(backupDir, backupName);
      archive.finalize();
    });
  }

  async cleanupOldBackups() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    let cleanedCount = 0;
    let totalSize = 0;

    try {
      const backupTypes = ['full', 'incremental'];

      for (const backupType of backupTypes) {
        const backupTypeDir = path.join(this.config.backupDir, backupType);
        
        if (!(await this.pathExists(backupTypeDir))) {
          continue;
        }

        const files = await fs.promises.readdir(backupTypeDir);

        for (const file of files) {
          const filePath = path.join(backupTypeDir, file);
          const stats = await fs.promises.stat(filePath);

          if (stats.mtime < cutoffDate) {
            totalSize += stats.size;
            await fs.promises.rm(filePath, { recursive: true, force: true });
            cleanedCount++;
            
            loggers.server.debug('Cleaned up old backup', {
              backupType,
              filename: file,
              size: `${Math.round(stats.size / 1024 / 1024 * 100) / 100}MB`,
              age: Math.round((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24))
            });
          }
        }
      }

      loggers.server.info('Backup cleanup completed', {
        cleanedCount,
        totalSizeFreed: `${Math.round(totalSize / 1024 / 1024 * 100) / 100}MB`,
        retentionDays: this.config.retentionDays
      });

    } catch (error) {
      loggers.server.error('Backup cleanup failed', {
        error: error.message,
        cleanedCount,
        totalSizeFreed: `${Math.round(totalSize / 1024 / 1024 * 100) / 100}MB`
      });
    }
  }

  // Recovery methods
  async listBackups() {
    const backups = [];
    const backupTypes = ['full', 'incremental'];

    for (const backupType of backupTypes) {
      const backupTypeDir = path.join(this.config.backupDir, backupType);
      
      if (!(await this.pathExists(backupTypeDir))) {
        continue;
      }

      const files = await fs.promises.readdir(backupTypeDir);

      for (const file of files) {
        const filePath = path.join(backupTypeDir, file);
        const stats = await fs.promises.stat(filePath);

        backups.push({
          name: file,
          type: backupType,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          humanSize: `${Math.round(stats.size / 1024 / 1024 * 100) / 100}MB`
        });
      }
    }

    return backups.sort((a, b) => b.created - a.created);
  }

  async restoreFromBackup(backupPath, options = {}) {
    const startTime = Date.now();

    try {
      loggers.server.info('Starting backup restoration', { backupPath });

      // Validate backup exists
      if (!(await this.pathExists(backupPath))) {
        throw new Error(`Backup file not found: ${backupPath}`);
      }

      // Extract backup if compressed
      let extractedDir = backupPath;
      if (path.extname(backupPath) === '.gz') {
        extractedDir = await this.extractBackup(backupPath);
      }

      // Read manifest
      const manifestPath = path.join(extractedDir, 'manifest.json');
      let manifest = {};
      
      if (await this.pathExists(manifestPath)) {
        const manifestContent = await fs.promises.readFile(manifestPath, 'utf8');
        manifest = JSON.parse(manifestContent);
        
        // Verify checksums
        await this.verifyBackupIntegrity(extractedDir, manifest);
      }

      // Restore database
      if (manifest.files?.database || options.forceRestore) {
        await this.restoreDatabase(extractedDir, manifest.files?.database || 'database.sql');
      }

      // Restore logs if requested
      if (options.restoreLogs && (manifest.files?.logs || manifest.files?.recentLogs)) {
        await this.restoreLogs(extractedDir, manifest.files?.logs || manifest.files?.recentLogs);
      }

      // Cleanup extracted files if backup was compressed
      if (extractedDir !== backupPath && (await this.pathExists(extractedDir))) {
        await fs.promises.rm(extractedDir, { recursive: true });
      }

      const duration = Date.now() - startTime;

      loggers.server.info('Backup restoration completed successfully', {
        backupPath,
        duration: `${duration}ms`,
        type: manifest.type || 'unknown',
        timestamp: manifest.timestamp || 'unknown'
      });

      return {
        success: true,
        duration,
        manifest,
        restored: {
          database: true,
          logs: options.restoreLogs || false
        }
      };

    } catch (error) {
      loggers.server.error('Backup restoration failed', {
        backupPath,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Utility methods
  async pathExists(filePath) {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async calculateChecksum(filePath) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async getDatabaseSize() {
    try {
      const result = await this.pool.query(`
        SELECT pg_size_pretty(pg_database_size($1)) as size
      `, [this.config.database.database]);
      return result.rows[0].size;
    } catch {
      return 'Unknown';
    }
  }

  async getLastBackupTimestamp() {
    // Get the most recent backup timestamp from manifest files
    const backups = await this.listBackups();
    return backups.length > 0 ? backups[0].created : new Date(0);
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      scheduledJobs: this.scheduledJobs.map(job => ({
        name: job.name,
        schedule: job.schedule,
        running: job.job.getStatus() === 'scheduled'
      })),
      config: {
        backupDir: this.config.backupDir,
        retentionDays: this.config.retentionDays,
        schedules: this.config.schedules
      }
    };
  }

  async shutdown() {
    try {
      // Stop all scheduled jobs
      this.scheduledJobs.forEach(job => {
        job.job.stop();
      });
      
      // Close database pool
      await this.pool.end();
      
      loggers.server.info('Backup service shut down gracefully');
    } catch (error) {
      loggers.server.error('Error during backup service shutdown', {
        error: error.message
      });
    }
  }
}

module.exports = BackupService;