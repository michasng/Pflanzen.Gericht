export class ListNameClashError extends Error {
  constructor() {
    super('Du hast bereits eine Liste mit diesem Namen.')
  }
}
