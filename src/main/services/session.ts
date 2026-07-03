import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { SessionLog, AgentAction } from '../../shared/types'

export class SessionStore {
  private db: Database.Database

  constructor() {
    const dbPath = join(app.getPath('userData'), 'sessions.db')
    this.db = new Database(dbPath)
    this.init()
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        tab_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        status TEXT NOT NULL DEFAULT 'running'
      );

      CREATE TABLE IF NOT EXISTS actions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        params TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        status TEXT NOT NULL,
        result TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
    `)
  }

  createSession(tabId: string): string {
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.db
      .prepare('INSERT INTO sessions (id, tab_id, start_time, status) VALUES (?, ?, ?, ?)')
      .run(id, tabId, Date.now(), 'running')
    return id
  }

  endSession(id: string): void {
    this.db
      .prepare('UPDATE sessions SET end_time = ?, status = ? WHERE id = ?')
      .run(Date.now(), 'completed', id)
  }

  logAction(sessionId: string, action: AgentAction): void {
    this.db
      .prepare(
        'INSERT INTO actions (id, session_id, type, params, timestamp, status, result) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        action.id,
        sessionId,
        action.type,
        JSON.stringify(action.params),
        action.timestamp,
        action.status,
        action.result ? JSON.stringify(action.result) : null
      )
  }

  updateActionStatus(actionId: string, status: AgentAction['status'], result?: AgentAction['result']): void {
    this.db
      .prepare('UPDATE actions SET status = ?, result = ? WHERE id = ?')
      .run(status, result ? JSON.stringify(result) : null, actionId)
  }

  getSession(id: string): SessionLog | undefined {
    const session = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as
      | { id: string; tab_id: string; start_time: number; end_time: number | null; status: string }
      | undefined
    if (!session) return undefined

    const actions = this.db
      .prepare('SELECT * FROM actions WHERE session_id = ? ORDER BY timestamp')
      .all(id) as {
      id: string
      session_id: string
      type: string
      params: string
      timestamp: number
      status: string
      result: string | null
    }[]

    return {
      id: session.id,
      tabId: session.tab_id,
      startTime: session.start_time,
      endTime: session.end_time,
      actions: actions.map(a => ({
        id: a.id,
        type: a.type as AgentAction['type'],
        params: JSON.parse(a.params),
        timestamp: a.timestamp,
        status: a.status as AgentAction['status'],
        result: a.result ? JSON.parse(a.result) : undefined,
      })),
      status: session.status as SessionLog['status'],
    }
  }

  close(): void {
    this.db.close()
  }
}
