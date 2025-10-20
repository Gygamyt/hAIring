import { z, ZodError } from "zod";
import { cleanJsonString } from "./string.util";

/**
 * Formats a ZodError (or any error) into a "pretty" string for the LLM.
 * @param error - The error caught during parsing.
 * @returns A human-readable and LLM-readable error message.
 */
export const formatZodError = (error: any): string => {
    if (error instanceof ZodError) {
        const issues = error.issues.map(issue =>
            `Validation Error for field '${issue.path.join('.')}': ${issue.message}. Received: '${(issue as any).received}'`
        );
        return `Zod Validation Failed:\n- ${issues.join('\n- ')}`;
    }
    if (error instanceof SyntaxError) {
        return `JSON Parsing Failed: ${error.message}. The JSON is malformed.`;
    }
    return `An unknown error occurred: ${error.message}`;
};

export const validateAndParse = <T extends z.ZodTypeAny>(
    rawJson: string | null,
    schema: T,
): { data: z.infer<T> | null; error: string | null } => {
    if (!rawJson) {
        return { data: null, error: "No raw JSON string to validate." };
    }
    try {
        const cleanedJson = cleanJsonString(rawJson);
        const parsedJson = JSON.parse(cleanedJson);
        const data = schema.parse(parsedJson);
        return { data, error: null };
    } catch (error) {
        const formattedError = formatZodError(error);
        return { data: null, error: formattedError };
    }
};
