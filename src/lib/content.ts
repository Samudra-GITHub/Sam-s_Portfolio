/** A field is a placeholder until the author replaces the [PLACEHOLDER_*] text. */
export const isPlaceholder = (value?: string | null): boolean => !value || /PLACEHOLDER/i.test(value);

/** Returns the value only when it is real content, otherwise undefined. */
export const real = (value?: string | null): string | undefined => (isPlaceholder(value) ? undefined : (value as string));
