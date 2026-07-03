import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

export interface ProfileConfig {
  name: string
  isEphemeral: boolean
  userDataPath: string
  createdAt: number
}

export class ProfileService {
  private defaultProfile: ProfileConfig
  private profiles: Map<string, ProfileConfig> = new Map()
  private profilesPath: string

  constructor() {
    this.profilesPath = join(app.getPath('userData'), 'profiles')
    if (!existsSync(this.profilesPath)) {
      mkdirSync(this.profilesPath, { recursive: true })
    }

    this.defaultProfile = {
      name: 'default',
      isEphemeral: false,
      userDataPath: join(this.profilesPath, 'default'),
      createdAt: Date.now(),
    }

    this.ensureProfileDir(this.defaultProfile)
  }

  private ensureProfileDir(profile: ProfileConfig): void {
    if (!existsSync(profile.userDataPath)) {
      mkdirSync(profile.userDataPath, { recursive: true })
    }
  }

  getDefaultProfile(): ProfileConfig {
    return this.defaultProfile
  }

  createEphemeralProfile(): ProfileConfig {
    const id = `ephemeral-${Date.now()}`
    const profile: ProfileConfig = {
      name: id,
      isEphemeral: true,
      userDataPath: join(this.profilesPath, id),
      createdAt: Date.now(),
    }
    this.ensureProfileDir(profile)
    this.profiles.set(id, profile)
    return profile
  }

  cleanupEphemeralProfile(profile: ProfileConfig): void {
    if (profile.isEphemeral) {
      const { rmSync } = require('fs')
      if (existsSync(profile.userDataPath)) {
        rmSync(profile.userDataPath, { recursive: true, force: true })
      }
      this.profiles.delete(profile.name)
    }
  }

  getProfilePath(profile: ProfileConfig): string {
    return profile.userDataPath
  }
}
