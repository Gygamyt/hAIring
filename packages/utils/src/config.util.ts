import { ZodSchema } from 'zod';

/**
 * A utility to parse and validate environment variables with user-friendly error handling.
 * @param schema The Zod schema to validate against.
 * @param env The environment object (e.g., process.env).
 * @returns A validated and typed configuration object.
 * @throws An error with a human-readable message if validation fails.
 */
export function validateAndParseEnv<T extends ZodSchema>(
    schema: T,
    env: Record<string, any>,
) {
    const result = schema.safeParse(env);

    if (!result.success) {
        const errorMessages = result.error.errors.map((e) => {
            const path = e.path.join('.');
            return `  - Validation failed for '${path}': ${e.message}`;
        });

        throw new Error(
            `Environment configuration is invalid:\n${errorMessages.join('\n')}`,
        );
    }

    return result.data;
}
