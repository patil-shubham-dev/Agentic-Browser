import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { Logger } from '../logger'
import { SessionLog, AgentAction } from '../../shared/types'

export class SessionStore {
  private db: Database.Database
  private logger: Logger

  constructor(logger: Logger) {
    const dbPath = join(app.getPath('userData'), 'sessions.db')
    this.db = new Database(dbPath)
    this.logger = logger
    this.init()
  }

  private init(): void {
    try {
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
    } catch (err) {
      this.logger.error('Failed to initialize session database:', err)
      throw err
    }
  }

  createSession(tabId: string): string {
    try {
      const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      this.db
        .prepare('INSERT INTO sessions (id, tab_id, start_time, status) VALUES (?, ?, ?, ?)')
        .run(id, tabId, Date.now(), 'running')
      return id
    } catch (err) {
      this.logger.error(`Failed to create session for tab ${tabId}:`, err)
      throw err
    }
  }

  endSession(id: string): void {
    try {
      this.db
        .prepare('UPDATE sessions SET end_time = ?, status = ? WHERE id = ?')
        .run(Date.now(), 'ended', id)
      this.logger.info('Session ended:', { sessionId: id })
    } catch (err) {
      this.logger.error(`Failed to end session ${id}:`, err)
      throw err
    }
  }

  getSession(id: string): SessionLog | null {
    try {
      const session = this.db
        .prepare('SELECT * FROM sessions WHERE id = ?')
        .get(id) as any

      if (!session) return null

      const actions = this.db
        .prepare('SELECT * FROM actions WHERE session_id = ? ORDER BY timestamp')
        .all(id) as any[]

      return {
        id: session.id,
        tabId: session.tab_id,
        startTime: session.start_time,
        endTime: session.end_time,
        status: session.status,
        actions: actions.map((a) => ({
          id: a.id,
          type: a.type,
          params: JSON.parse(a.params),
          timestamp: a.timestamp,
          status: a.status,
          result: a.result ? JSON.parse(a.result) : undefined,
        })),
      }
    } catch (err) {
      this.logger.error(`Failed to get session ${id}:`, err)
      return null
    }
  }

  getAllSessions(): SessionLog[] {
    try {
      const sessions = this.db
        .prepare('SELECT * FROM sessions ORDER BY start_time DESC')
        .all() as any[]

      return sessions.map((session) => {
        const actions = this.db
          .prepare('SELECT * FROM actions WHERE session_id = ? ORDER BY timestamp')
          .all(session.id) as any[]

        return {
          id: session.id,
          tabId: session.tab_id,
          startTime: session.start_time,
          endTime: session.end_time,
          status: session.status,
          actions: actions.map((a) => ({
            id: a.id,
            type: a.type,
            params: JSON.parse(a.params),
            timestamp: a.timestamp,
            status: a.status,
            result: a.result ? JSON.parse(a.result) : undefined,
          })),
        }
      })
    } catch (err) {
      this.logger.error('Failed to get all sessions:', err)
      return []
    }
  }

  addAction(sessionId: string, action: AgentAction): void {
    try {
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
    } catch (err) {
      this.logger.error(`Failed to add action to session ${sessionId}:`, err)
      throw err
    }
  }

  updateActionStatus(actionId: string, status: string, result?: any): void {
    try {
      this.db
        .prepare('UPDATE actions SET status = ?, result = ? WHERE id = ?')
        .run(status, result ? JSON.stringify(result) : null, actionId)
    } catch (err) {
      this.logger.error(`Failed to update action ${actionId}:`, err)
      throw err
    }
  }

  close(): void {
    try {
      this.db.close()
      this.logger.info('Session database closed')
    } catch (err) {
      this.logger.error('Failed to close session database:', err)
    }
  }
}
