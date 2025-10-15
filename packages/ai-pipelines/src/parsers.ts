import { JsonOutputParser } from '@langchain/core/output_parsers';

export interface ParsedData {
    candidateName: string;
    keySkills: string[];
}

export const dataParser = new JsonOutputParser<ParsedData>();
