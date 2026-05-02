import * as fs from 'fs'
import * as path from 'path'

describe('Tailwind CSS Configuration', () => {
  it('should have tailwind.config.ts file', () => {
    const tailwindPath = path.join(process.cwd(), 'tailwind.config.ts')
    expect(fs.existsSync(tailwindPath)).toBe(true)
  })

  it('should have postcss.config.mjs file', () => {
    const postcssPath = path.join(process.cwd(), 'postcss.config.mjs')
    expect(fs.existsSync(postcssPath)).toBe(true)
  })
})
