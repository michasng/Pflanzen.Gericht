export const PASSWORD_MIN_LENGTH = 8

export const PASSWORD_MISMATCH_MESSAGE = 'Passwörter stimmen nicht überein.'
export const PASSWORD_TOO_SHORT_MESSAGE = `Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`

export const validateNewPassword = (password: string, confirmation: string): string | undefined => {
  if (password !== confirmation) return PASSWORD_MISMATCH_MESSAGE
  if (password.length < PASSWORD_MIN_LENGTH) return PASSWORD_TOO_SHORT_MESSAGE
  return undefined
}
