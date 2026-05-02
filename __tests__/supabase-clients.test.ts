import * as fs from 'fs'
import * as path from 'path'

describe('Supabase Client Helpers', () => {
  it('should have server.ts client helper', () => {
    const serverPath = path.join(process.cwd(), 'lib/supabase/server.ts')
    expect(fs.existsSync(serverPath)).toBe(true)
    const content = fs.readFileSync(serverPath, 'utf-8')
    expect(content).toContain('createServiceRoleClient')
  })

  it('should have client.ts browser helper', () => {
    const clientPath = path.join(process.cwd(), 'lib/supabase/client.ts')
    expect(fs.existsSync(clientPath)).toBe(true)
    const content = fs.readFileSync(clientPath, 'utf-8')
    expect(content).toContain('createBrowserClient')
  })
})
