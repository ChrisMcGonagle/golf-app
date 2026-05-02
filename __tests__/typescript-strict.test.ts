import * as fs from 'fs'
import * as path from 'path'

describe('TypeScript Configuration', () => {
  it('should have strict mode enabled', () => {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
    expect(tsconfig.compilerOptions.strict).toBe(true)
  })

  it('should have @ path alias configured', () => {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
    expect(tsconfig.compilerOptions.paths).toBeDefined()
    expect(tsconfig.compilerOptions.paths['@/*']).toBeDefined()
  })
})
