import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { PermissionRule } from '../../shared/types'

export class PermissionStore {
  private db: Database.Database

  constructor() {
    const dbPath = join(app.getPath('userData'), 'permissions.db')
    this.db = new Database(dbPath)
    this.init()
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS permissions (
        domain TEXT PRIMARY KEY,
        action TEXT NOT NULL CHECK(action IN ('allow', 'block')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)
  }

  getRule(domain: string): PermissionRule | undefined {
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
  }

  setRule(domain: string, action: 'allow' | 'block'): void {
    const now = Date.now()
    this.db
      .prepare(
        'INSERT OR REPLACE INTO permissions (domain, action, created_at, updated_at) VALUES (?, ?, COALESCE((SELECT created_at FROM permissions WHERE domain = ?), ?), ?)'
      )
      .run(domain, action, domain, now, now)
  }

  removeRule(domain: string): void {
    this.db.prepare('DELETE FROM permissions WHERE domain = ?').run(domain)
  }

  getAllRules(): PermissionRule[] {
    const rows = this.db
      .prepare('SELECT domain, action, created_at, updated_at FROM permissions ORDER BY domain')
      .all() as { domain: string; action: string; created_at: number; updated_at: number }[]
    return rows.map(r => ({
      domain: r.domain,
      action: r.action as 'allow' | 'block',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  }

  isAllowed(domain: string): boolean {
    const rule = this.getRule(domain)
    if (!rule) return false
    return rule.action === 'allow'
  }

  isBlocked(domain: string): boolean {
    const rule = this.getRule(domain)
    if (!rule) return false
    return rule.action === 'block'
  }

  close(): void {
    this.db.close()
  }
}
