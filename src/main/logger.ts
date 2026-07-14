import { app } from 'electron'
import { join } from 'path'
import * as fs from 'fs'

export class Logger {
  private logFilePath: string

  constructor(private context: string) {
    const logDir = join(app.getPath('userData'), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    this.logFilePath = join(logDir, `${new Date().toISOString().slice(0, 10)}.log`)
  }

  info(msg: string, data?: any) {
    const logEntry = this.formatLogEntry('info', msg, data)
    console.log(`[${this.context}] ${msg}`, data)
    this.writeToFile(logEntry)
  }

  warn(msg: string, data?: any) {
    const logEntry = this.formatLogEntry('warn', msg, data)
    console.warn(`[${this.context}] ${msg}`, data)
    this.writeToFile(logEntry)
  }

  error(msg: string, err?: Error) {
    const logEntry = this.formatLogEntry('error', msg, err)
    console.error(`[${this.context}] ${msg}`, err)
    this.writeToFile(logEntry)
  }

  private formatLogEntry(level: string, msg: string, data?: any): string {
    const entry: any = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message: msg,
    }
    if (data) {
      entry.data = data instanceof Error ? { message: data.message, stack: data.stack } : data
    }
    return JSON.stringify(entry)
  }

  private writeToFile(logEntry: string) {
    fs.appendFile(this.logFilePath, logEntry + '\n', (err) => {
      if (err) {
        console.error('Failed to write to log file:', err)
      }
    })
  }
}
