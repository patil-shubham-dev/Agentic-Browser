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

  endSession(id: string): void {
    try {
    this.db
      .prepare('UPDATE sessions SET end_time = ?, status = ? WHERE id = ?')
      .run(Date.now(), 'completed', id)
    } catch (err) {
      this.logger.error(`Failed to end session ${id}:`, err)
    }

  logAction(sessionId: string, action: AgentAction): void {
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
      this.logger.error(`Failed to log action for session ${sessionId}:`, err)
    }

  updateActionStatus(actionId: string, status: AgentAction['status'], result?: AgentAction['result']): void {
    try {
    this.db
      .prepare('UPDATE actions SET status = ?, result = ? WHERE id = ?')
      .run(status, result ? JSON.stringify(result) : null, actionId)
    } catch (err) {
      this.logger.error(`Failed to update action status for action ${actionId}:`, err)
    }

  getSession(id: string): SessionLog | undefined {
    try {
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
    } catch (err) {
      this.logger.error(`Failed to get session log for session ${id}:`, err)
      return undefined
    }

  close(): void {
    try {
    this.db.close()
    } catch (err) {
      this.logger.error('Failed to close session database:', err)
    }
}
