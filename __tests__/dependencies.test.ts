import * as fs from 'fs'
import * as path from 'path'

describe('Dependencies Installed', () => {
  it('should have bcrypt installed', () => {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    expect(packageJson.dependencies.bcrypt || packageJson.devDependencies.bcrypt).toBeDefined()
  })

  it('should have iron-session installed', () => {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    expect(packageJson.dependencies['iron-session'] || packageJson.devDependencies['iron-session']).toBeDefined()
  })

  it('should have @supabase/supabase-js installed', () => {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    expect(packageJson.dependencies['@supabase/supabase-js']).toBeDefined()
  })
})
