// Completion types returned by the btd6index.win fetch-* endpoints, with the zod schemas that check responses at runtime.
// Endpoints share some fields but not all of them (e.g. only 2tc/2mp/fttc have `og`),
// so each endpoint gets its own schema built from the pieces it actually has.
//
// Only fields the bot reads are checked, so the API adding or changing other fields doesn't break anything.
// Objects are loose: unchecked fields are kept at runtime but left out of the types, so using a new field
// means adding it to its schema first. Fields the API sends that are deliberately unchecked:
//   - every endpoint: `tsv`
//   - 2tc, 2mp, fttc map details: `abbreviation`, `difficulty`, `haslos`, `haswater`, `length`, `lengthnotes`,
//     `miscnotes`, `numentrances`, `numexits`, `numobjects`, `removalcost`, `removalcostnotes`
//   - 2tc: `upgrade1`, `upgrade2`; 2mp: `upgrade`; ltc: `completiontype`, `notes`; lcc/lcd: `notes`
import { z } from 'zod';

/** Fields every index completion has */
const completionBaseFields = {
    map: z.string(),
    person: z.string(),
    link: z.string().nullable(),
    // Only checked for truthiness when italicizing pending completions
    pending: z.unknown(),
    /** e.g. `49.3` or `36.X`; the API sends both null and "" when unknown */
    version: z.string().nullable(),
    /** e.g. `2025-07-18`; the API sends both null and "" when unknown */
    date: z.string().nullable(),
    filekey: z.string(),
};

export const CompletionBaseSchema = z.looseObject(completionBaseFields);
export type CompletionBase = z.infer<typeof CompletionBaseSchema>;

/** fetch-2tc */
export const TwoTCCompletionSchema = z.looseObject({
    ...completionBaseFields,
    tower1: z.string(),
    tower2: z.string(),
    og: z.boolean(),
});
export type TwoTCCompletion = z.infer<typeof TwoTCCompletionSchema>;

/** fetch-2mp */
export const TwoMPCompletionSchema = z.looseObject({
    ...completionBaseFields,
    entity: z.string(),
    og: z.boolean(),
});
export type TwoMPCompletion = z.infer<typeof TwoMPCompletionSchema>;

/** fetch-fttc */
export const FTTCCompletionSchema = z.looseObject({
    ...completionBaseFields,
    towerset: z.array(z.string()),
    og: z.boolean(),
});
export type FTTCCompletion = z.infer<typeof FTTCCompletionSchema>;

/** fetch-ltc */
export const LTCCompletionSchema = z.looseObject({
    ...completionBaseFields,
    towerset: z.array(z.string()),
    /** Parallel to `towerset`, e.g. `5-2-0` or `Lvl-20` */
    upgradeset: z.array(z.string()),
});
export type LTCCompletion = z.infer<typeof LTCCompletionSchema>;

/** fetch-lcc and fetch-lcd */
export const LowestCostCompletionSchema = z.looseObject({
    ...completionBaseFields,
    money: z.number(),
});
export type LowestCostCompletion = z.infer<typeof LowestCostCompletionSchema>;

/** fetch-2mp-og-info: details of the OG completion of a 2MP entity */
export const TwoMPOGInfoSchema = z.looseObject({
    result: z.looseObject({
        upgrade: z.string(),
        version: z.string().nullable(),
        date: z.string().nullable(),
    }),
});
export type TwoMPOGInfo = z.infer<typeof TwoMPOGInfoSchema>;

/** Response of the endpoints paginated with `count`/`offset` search params (2tc, 2mp, fttc) */
export function indexPageResponseSchema<T extends z.ZodType<CompletionBase>>(completionSchema: T) {
    return z.looseObject({
        results: z.array(completionSchema),
        /** Total number of matching completions across all pages */
        count: z.number(),
        /** Whether there are completions after this page */
        more: z.boolean(),
    });
}
export type IndexPageResponse<T extends CompletionBase> = { results: T[]; count: number; more: boolean };

/** Response of the endpoints that return every match at once (ltc, lcc, lcd) */
export function indexResultsResponseSchema<T extends z.ZodType<CompletionBase>>(completionSchema: T) {
    return z.looseObject({
        results: z.array(completionSchema),
    });
}
