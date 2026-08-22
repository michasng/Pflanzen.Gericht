import { describe, it, expect } from 'vitest'
import { slugifyUsername } from '../slug'

describe('slugifyUsername', () => {
  it('lowercases ASCII', () => {
    expect(slugifyUsername('GrueneGabel')).toBe('gruenegabel')
  })

  it('transliterates German umlauts', () => {
    expect(slugifyUsername('Grüne Gabel')).toBe('gruene_gabel')
    expect(slugifyUsername('Ärger')).toBe('aerger')
    expect(slugifyUsername('Öl')).toBe('oel')
    expect(slugifyUsername('Üben')).toBe('ueben')
    expect(slugifyUsername('Straße')).toBe('strasse')
  })

  it('replaces disallowed characters with underscores', () => {
    expect(slugifyUsername('hello world')).toBe('hello_world')
    expect(slugifyUsername('foo.bar')).toBe('foo_bar')
    expect(slugifyUsername('foo-bar')).toBe('foo_bar')
  })

  it('collapses consecutive underscores', () => {
    expect(slugifyUsername('foo  bar')).toBe('foo_bar')
    expect(slugifyUsername('foo--bar')).toBe('foo_bar')
  })

  it('trims leading and trailing underscores', () => {
    expect(slugifyUsername(' foo ')).toBe('foo')
    expect(slugifyUsername('_foo_')).toBe('foo')
  })

  it('truncates to 30 characters', () => {
    const long = 'a'.repeat(40)
    expect(slugifyUsername(long)).toHaveLength(30)
  })

  it('is idempotent on already-valid input', () => {
    expect(slugifyUsername('gruene_gabel')).toBe('gruene_gabel')
    expect(slugifyUsername('user_123')).toBe('user_123')
  })
})
