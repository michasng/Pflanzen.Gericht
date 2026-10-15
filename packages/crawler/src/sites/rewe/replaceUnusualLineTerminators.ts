const UNUSUAL_LINE_TERMINATORS_PATTERN = /[\u2028\u2029]/g

export const replaceUnusualLineTerminators = (text: string): string =>
  text.replace(UNUSUAL_LINE_TERMINATORS_PATTERN, '\n')
