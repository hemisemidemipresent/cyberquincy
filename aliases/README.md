## Alias Definitions
- **AliasRepository**: The data structure that reads in all alias files when QuincyBot is launched. At runtime, it provides helpful methods for organizing and accessing aliases. 
- **Canonical form**: The standardized value in an _Alias Set_ (defined below). All command arguments are translated to canonical form - if the argument was an alias to begin with - before even reaching command execution.
  - _Example_: "#ouch" is the canonical form of aliases "o" and "couch".
- **Alias Group**: An Object containing the keys `canonical`, `aliases`, and `sourcefile` plus their corresponding values. The AliasRepository is just an array of Alias Groups.
- **Alias Set**: A list of aliases (typically the canonical form + the corresponding alias list. Think of it like a flat list of synonyms)
- **Alias Member**: Either a canonical form or one of its alias members. A group of synonymous Alias Members is an Alias Set (defined directly above).
  - _Example_: Users type in alias members as arguments but these are transformed into their canonical forms before being received by the command they were called with.
