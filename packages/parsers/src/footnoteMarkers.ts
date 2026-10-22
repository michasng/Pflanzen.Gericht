export const FOOTNOTE_MARKER_PATTERN = /[*¹²³°]/u
export const FOOTNOTE_MARKERS_PATTERN = /[*¹²³°]+/gu
export const FOOTNOTE_MARKERS_BETWEEN_LETTERS_PATTERN = /(?<=\p{L})[*¹²³°]+(?=\p{L})/gu
// A footnote like " *aus …" or " *= aus …"; markers after a separator or colon prefix an ingredient instead.
export const INLINE_FOOTNOTE_START_PATTERN = /(?<![,;:\s])\s+[*¹²³°]+(?=\p{L}|=)/u
export const LINE_FOOTNOTE_START_PATTERN = /\n[*¹²³°]/u
