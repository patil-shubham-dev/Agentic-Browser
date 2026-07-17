import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { Logger } from '../logger'
import { PermissionRule } from '../../shared/types'

export class PermissionStore {
  private db: Database.Database
  private logger: Logger

  constructor(logger: Logger) {
    const dbPath = join(app.getPath('userData'), 'permissions.db')
    this.db = new Database(dbPath)
    this.logger = logger
    this.init()
  }

  private init(): void {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS permissions (
          domain TEXT PRIMARY KEY,
          action TEXT NOT NULL CHECK(action IN ('allow', 'block')),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `)
    } catch (err) {
      this.logger.error('Failed to initialize permissions database:', err)
      throw err
    }
  }

  getRule(domain: string): PermissionRule | undefined {
    try {
      const row = this.db.prepare('SELECT * FROM permissions WHERE domain = ?').get(domain) as
        | { domain: string; action: string; created_at: number; updated_at: number }
        | undefined
      if (row) {
        return {
          domain: row.domain,
          action: row.action as 'allow' | 'block',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      }
      return undefined
    } catch (err) {
      this.logger.error(`Failed to get permission rule for domain ${domain}:`, err)
      return undefined
    }
  }

  setRule(domain: string, action: 'allow' | 'block'): PermissionRule {
    try {
      const now = Date.now()
      this.db
        .prepare(
          'INSERT OR REPLACE INTO permissions (domain, action, created_at, updated_at) VALUES (?, ?, ?, ?)'
        )
        .run(domain, action, now, now)
      return {
        domain,
        action,
        createdAt: now,
        updatedAt: now,
      }
    } catch (err) {
      this.logger.error(`Failed to set permission rule for domain ${domain}:`, err)
      throw err
    }
  }

  removeRule(domain: string): void {
    try {
      this.db.prepare('DELETE FROM permissions WHERE domain = ?').run(domain)
      this.logger.info('Permission rule removed:', { domain })
    } catch (err) {
      this.logger.error(`Failed to remove permission rule for domain ${domain}:`, err)
      throw err
    }
  }

  getAllRules(): PermissionRule[] {
    try {
      const rows = this.db.prepare('SELECT * FROM permissions').all() as Array<{
        domain: string
        action: string
        created_at: number
        updated_at: number
      }>
      return rows.map((row) => ({
        domain: row.domain,
        action: row.action as 'allow' | 'block',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    } catch (err) {
      this.logger.error('Failed to get all permission rules:', err)
      return []
    }
  }

  isAllowed(domain: string): boolean {
    try {
      const rule = this.getRule(domain)
      return rule?.action === 'allow'
    } catch (err) {
      this.logger.error(`Failed to check if domain is allowed ${domain}:`, err)
      return false
    }
  }

  isBlocked(domain: string): boolean {
    try {
      const rule = this.getRule(domain)
      return rule?.action === 'block'
    } catch (err) {
      this.logger.error(`Failed to check if domain is blocked ${domain}:`, err)
      return false
    }
  }

  close(): void {
    try {
      this.db.close()
      this.logger.info('Permission database closed')
    } catch (err) {
      this.logger.error('Failed to close permission database:', err)
    }
  }
}
