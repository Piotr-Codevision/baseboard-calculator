import { describe, expect, it } from 'vitest'
import { parseProjectFile, serializeProject, ProjectFileError } from './projectFile'
import type { Wall } from '../types'

function wall(overrides: Partial<Wall> = {}): Wall {
  return {
    id: overrides.id ?? 'w1',
    label: overrides.label ?? 'w1',
    length: overrides.length ?? 100,
    quantity: overrides.quantity ?? 1,
    notes: overrides.notes,
  }
}

describe('project file serialization', () => {
  it('round-trips walls, base length and unit through JSON', () => {
    const walls = [wall({ id: 'a', label: 'A', length: 125 }), wall({ id: 'b', label: 'B', length: 60, quantity: 2 })]
    const json = serializeProject(walls, 240, 'cm')

    const parsed = parseProjectFile(json)

    expect(parsed.baseLength).toBe(240)
    expect(parsed.unit).toBe('cm')
    expect(parsed.walls).toEqual(walls)
    expect(parsed.version).toBe(1)
    expect(typeof parsed.savedAt).toBe('string')
  })

  it('produces valid JSON text', () => {
    const json = serializeProject([wall()], 240, 'cm')
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('throws ProjectFileError for malformed JSON', () => {
    expect(() => parseProjectFile('{not valid json')).toThrow(ProjectFileError)
  })

  it('throws ProjectFileError when baseLength is missing or invalid', () => {
    expect(() => parseProjectFile(JSON.stringify({ unit: 'cm', walls: [] }))).toThrow(
      ProjectFileError,
    )
    expect(() =>
      parseProjectFile(JSON.stringify({ baseLength: 'oops', unit: 'cm', walls: [] })),
    ).toThrow(ProjectFileError)
  })

  it('throws ProjectFileError for an invalid unit', () => {
    expect(() =>
      parseProjectFile(JSON.stringify({ baseLength: 240, unit: 'parsecs', walls: [] })),
    ).toThrow(ProjectFileError)
  })

  it('throws ProjectFileError for invalid wall entries', () => {
    expect(() =>
      parseProjectFile(
        JSON.stringify({ baseLength: 240, unit: 'cm', walls: [{ id: 'x', length: 'oops' }] }),
      ),
    ).toThrow(ProjectFileError)
  })

  it('accepts a minimal valid file without version/savedAt and fills defaults', () => {
    const parsed = parseProjectFile(
      JSON.stringify({ baseLength: 200, unit: 'm', walls: [wall({ id: 'z' })] }),
    )
    expect(parsed.version).toBe(1)
    expect(parsed.baseLength).toBe(200)
    expect(parsed.unit).toBe('m')
    expect(parsed.walls).toHaveLength(1)
  })
})
