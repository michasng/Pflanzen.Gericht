import readline from 'node:readline/promises'

export const promptForAnswer = async (promptMessage: string): Promise<string> => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    return await rl.question(promptMessage)
  } finally {
    rl.close()
  }
}
