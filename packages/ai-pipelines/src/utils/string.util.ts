export const cleanJsonString = (rawJson: string): string => {
    return rawJson
        .replace(/^```json\s*/, '')
        .replace(/```$/, '')
        .trim();
};
