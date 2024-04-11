## Alias Definitions

-   **AliasRepository**: The data structure that reads in all alias files when Cyber Quincy is launched. At runtime, it provides helpful methods for organizing and accessing aliases.
-   **Canonical form**: The standardized value in an _Alias Set_ (defined below). All command arguments are translated to canonical form - if the argument was an alias to begin with - before even reaching command execution.
    -   _Example_: "#ouch" is the canonical form of aliases "o" and "couch".
-   **Alias Group**: An Object containing the keys `canonical`, `aliases`, and `sourcefile` plus their corresponding values. The AliasRepository is just an array of Alias Groups.
-   **Alias Set**: A list of aliases (typically the canonical form + the corresponding alias list. Think of it like a flat list of synonyms)
-   **Alias Member**: Either a canonical form or one of its alias members. A group of synonymous Alias Members is an Alias Set (defined directly above).
    -   _Example_: Users type in alias members as arguments but these are transformed into their canonical forms before being received by the command they were called with.

## In Simple Terms

rml has some respectable name-coining skills

The "stack" of a command is:
Args -> converted to standardized args -> sent to `./commands`

-   **AliasRepository** A File containing a bunch of list of functions and methods
-   **Cannonical form** Standardized form

    > _Example_: "#ouch" is the canonical form of aliases "o" and "couch".

-   **Alias group**:

    example:

    > note: this isn't the full code

```js
const aliasGroup = {
    canonical: canonical,
    aliases: nextAliases[canonical],
    sourcefile: filePath,
};
```

the `nextAliases` above is a **json file** for example, here is the difficulty alias json:

```json
{
    "easy": ["ez", "eaz", "ezgame", "eazy", "eas"],
    "medium": ["moderate", "med", "medi", "mid"],
    "hard": ["difficult", "hrd"]
}
```

`canonical` is the "standardized" form, so the (aliasGroup.)`aliases` is the array.
for example, if `canonical` is `"easy"`, `aliases` will be `["ez", "eaz", "ezgame", "eazy", "eas"]`

-   **Alias Set**: the **Alias Group**'s `aliases` and cannonical combined in one array

-   **Alias member** - a member of **Alias Set** array

(yeah its not that complicated lol)
