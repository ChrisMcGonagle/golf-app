import fs from 'fs'
import path from 'path'

describe('PBI-001: Project Scaffold', () => {
  test('TypeScript strict mode is enabled', () => {
    const tsconfigPath = path.join(__dirname, '../tsconfig.json')
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
    expect(tsconfig.compilerOptions.strict).toBe(true)
  })

  test('.env.local is in .gitignore', () => {
    const gitignorePath = path.join(__dirname, '../.gitignore')
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
    expect(gitignore).toMatch(/\.env\.local/)
  })

  test('.env.local.example exists with required keys', () => {
    const examplePath = path.join(__dirname, '../.env.local.example')
    expect(fs.existsSync(examplePath)).toBe(true)
    const example = fs.readFileSync(examplePath, 'utf-8')
    expect(example).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(example).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    expect(example).toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(example).toContain('ACTIVE_USER_SECRET')
  })

  test('Supabase server client exists', () => {
    const serverPath = path.join(__dirname, '../lib/supabase/server.ts')
    expect(fs.existsSync(serverPath)).toBe(true)
    const content = fs.readFileSync(serverPath, 'utf-8')
    expect(content).toContain('createServiceRoleClient')
  })

  test('Supabase browser client exists', () => {
    const clientPath = path.join(__dirname, '../lib/supabase/client.ts')
    expect(fs.existsSync(clientPath)).toBe(true)
    const content = fs.readFileSync(clientPath, 'utf-8')
    expect(content).toContain('createBrowserClient')
  })

  test('bcrypt and iron-session are installed', () => {
    const packagePath = path.join(__dirname, '../package.json')
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
    expect(pkg.dependencies).toHaveProperty('bcrypt')
    expect(pkg.dependencies).toHaveProperty('iron-session')
  })

  test('Tailwind CSS is configured', () => {
    const tailwindPath = path.join(__dirname, '../tailwind.config.ts')
    expect(fs.existsSync(tailwindPath)).toBe(true)
  })

  test('ESLint is configured', () => {
    const eslintPath = path.join(__dirname, '../.eslintrc.json')
    expect(fs.existsSync(eslintPath)).toBe(true)
  })
})
