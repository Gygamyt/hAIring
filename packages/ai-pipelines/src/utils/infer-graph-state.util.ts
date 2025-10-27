import { Annotation, AnnotationRoot } from '@langchain/langgraph';

/**
 * A TypeScript utility type to infer the plain data object type
 * from a LangGraph Annotation.Root schema definition.
 * * It works by:
 * 1. Checking if T extends AnnotationRoot<infer U>. If so, it extracts the inner schema object U.
 * 2. Mapping over the keys of U ([K in keyof U]).
 * 3. For each key, it checks if the value extends Annotation<infer V>. If so, it extracts the inner data type V.
 * 4. The '?' makes all properties optional, reflecting that graph state is built incrementally.
 */
export type InferGraphState<T extends AnnotationRoot<any>> = T extends AnnotationRoot<infer U>
    ? {
        // @ts-ignore
        -readonly [K in keyof U]?: U[K] extends Annotation<infer V> ? V : never;
    }
    : never;
