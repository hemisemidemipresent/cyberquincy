declare const brand: unique symbol;

/**
 * A `T` (usually a string) that has been checked to mean something more specific, e.g. a tower name.
 *
 * Brands only exist for the type checker: at runtime the value is still a plain `T`.
 * A plain `T` can't be passed where `Brand<T, B>` is expected, so values must come from a validator
 * (an `isX()` type guard or a `toX()` function) or from a function that is known to produce them.
 * Keep `as X` casts inside those functions only.
 *
 * Brands stack: `Brand<Brand<string, "A">, "B">` is assignable to `Brand<string, "A">` but not the other way round,
 * which models a subset (every B is an A).
 */
export type Brand<T, B extends string> = T & { readonly [brand]: { readonly [K in B]: true } };
