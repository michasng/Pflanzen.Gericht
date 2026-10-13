import readline from 'node:readline/promises'

export const waitForEnterKey = async (promptMessage: string): Promise<void> => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  await rl.question(promptMessage)
  rl.close()
}
