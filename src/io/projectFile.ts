import type { Unit, Wall } from '../types'

export const PROJECT_FILE_VERSION = 1

export interface ProjectFile {
  version: number
  savedAt: string
  baseLength: number
  unit: Unit
  walls: Wall[]
}

export class ProjectFileError extends Error {}

const VALID_UNITS: Unit[] = ['cm', 'm', 'in']

function isValidWall(value: unknown): value is Wall {
  if (typeof value !== 'object' || value === null) return false
  const w = value as Record<string, unknown>
  return (
    typeof w.id === 'string' &&
    typeof w.label === 'string' &&
    typeof w.length === 'number' &&
    Number.isFinite(w.length) &&
    typeof w.quantity === 'number' &&
    Number.isFinite(w.quantity) &&
    (w.notes === undefined || typeof w.notes === 'string')
  )
}

/**
 * Serializes the current project (walls + baseboard configuration) to a
 * JSON string. JSON is used because it is native to the JS/TS stack,
 * human-readable, trivially versioned, and far more compact than an
 * equivalent XML representation for this simple record shape.
 */
export function serializeProject(walls: Wall[], baseLength: number, unit: Unit): string {
  const file: ProjectFile = {
    version: PROJECT_FILE_VERSION,
    savedAt: new Date().toISOString(),
    baseLength,
    unit,
    walls,
  }
  return JSON.stringify(file, null, 2)
}

/**
 * Parses and validates a previously saved project JSON string. Throws a
 * ProjectFileError with a human-readable message if the content is not a
 * valid project file.
 */
export function parseProjectFile(raw: string): ProjectFile {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new ProjectFileError('The selected file is not valid JSON.')
  }

  if (typeof data !== 'object' || data === null) {
    throw new ProjectFileError('The selected file does not contain a valid project.')
  }

  const candidate = data as Record<string, unknown>

  if (typeof candidate.baseLength !== 'number' || !Number.isFinite(candidate.baseLength)) {
    throw new ProjectFileError('The project file is missing a valid base baseboard length.')
  }
  if (typeof candidate.unit !== 'string' || !VALID_UNITS.includes(candidate.unit as Unit)) {
    throw new ProjectFileError('The project file is missing a valid unit (cm, m, in).')
  }
  if (!Array.isArray(candidate.walls) || !candidate.walls.every(isValidWall)) {
    throw new ProjectFileError('The project file contains invalid wall entries.')
  }

  return {
    version: typeof candidate.version === 'number' ? candidate.version : 1,
    savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : new Date().toISOString(),
    baseLength: candidate.baseLength,
    unit: candidate.unit as Unit,
    walls: candidate.walls as Wall[],
  }
}

/**
 * Reads a File (e.g. from a file input) as text and parses it as a project
 * file. Returns a rejected promise if reading fails or content is invalid.
 */
export function readProjectFile(file: File): Promise<ProjectFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new ProjectFileError('Failed to read the selected file.'))
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : ''
        resolve(parseProjectFile(text))
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsText(file)
  })
}
