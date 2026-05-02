import fs from 'fs'
import path from 'path'

describe('PBI-002: profiles schema', () => {
  const schemaPath = path.join(__dirname, '../supabase/schema.sql')

  test('schema file exists', () => {
    expect(fs.existsSync(schemaPath)).toBe(true)
  })

  test('profiles table includes the required columns and constraints', () => {
    const schema = fs.readFileSync(schemaPath, 'utf-8').toLowerCase()

    expect(schema).toContain('create table if not exists public.profiles')
    expect(schema).toMatch(/id\s+uuid/)
    expect(schema).toMatch(/display_name\s+text\s+not\s+null/)
    expect(schema).toMatch(/role\s+text\s+not\s+null/)
    expect(schema).toMatch(/pin_hash\s+text/)
    expect(schema).toMatch(/pin_fail_count\s+integer\s+not\s+null\s+default\s+0/)
    expect(schema).toMatch(/pin_locked_until\s+timestamptz/)
    expect(schema).toMatch(/created_at\s+timestamptz\s+not\s+null\s+default\s+now\s*\(\s*\)/)
    expect(schema).toMatch(/references\s+auth\.users\s*\(\s*id\s*\)\s+on\s+delete\s+cascade/)
    expect(schema).toMatch(/constraint\s+profiles_role_check\s+check\s*\(\s*role\s+in\s*\(\s*'staff'\s*,\s*'admin'\s*\)\s*\)/)
  })

  test('row level security is enabled and public access is revoked', () => {
    const schema = fs.readFileSync(schemaPath, 'utf-8').toLowerCase()

    expect(schema).toContain('alter table public.profiles enable row level security;')
    expect(schema).toContain('revoke all on table public.profiles from public;')
    expect(schema).toContain('revoke all on table public.profiles from anon;')
    expect(schema).toContain('revoke all on table public.profiles from authenticated;')
  })
})