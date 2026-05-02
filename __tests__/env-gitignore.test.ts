import * as fs from 'fs'
import * as path from 'path'

describe('Environment Configuration', () => {
  it('should have .env.local in .gitignore', () => {
    const gitignorePath = path.join(process.cwd(), '.gitignore')
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
    expect(gitignore).toMatch(/\.env.*\.local/)
  })

  it('should have .env.local.example present', () => {
    const examplePath = path.join(process.cwd(), '.env.local.example')
    expect(fs.existsSync(examplePath)).toBe(true)
  })
})
