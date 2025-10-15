import { z } from 'zod';
import { Annotation } from "@langchain/langgraph";

//todo RAZDROBIT'

const CvDataSchema = z.object({
    first_name: z.string(),
    last_name: z.string(),
    skills: z.array(z.string()),
    experience: z.string(),
});

const RequirementsDataSchema = z.object({
    hard_skills_required: z.array(z.string()),
    soft_skills_required: z.array(z.string()),
});

const FeedbackDataSchema = z.object({
    comments: z.string(),
});

export const PreparationGraphStateSchema = z.object({
    cvText: z.string(),
    requirementsText: z.string(),
    feedbackText: z.string(),
    parsedData: z.any().optional(),
    grade: z.any().optional(),
    finalReport: z.any().optional(),
});

export const PreparationStateAnnotation = Annotation.Root({
    cvText: Annotation<string>(),
    requirementsText: Annotation<string>(),
    feedbackText: Annotation<string>(),
    parsedData: Annotation<any>(),
    grade: Annotation<any>(),
    finalReport: Annotation<any>(),
});

export type PreparationGraphState = z.infer<typeof PreparationGraphStateSchema>;
