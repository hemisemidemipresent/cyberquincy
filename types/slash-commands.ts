/** Result of reading a slash command's options: an error message for the user, or the validated input */
export type ReadInputResult<Input> = { error: string; input?: never } | { error?: never; input: Input };
