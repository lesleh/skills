# Working in this repo

## Changelogs

A skill that has a `CHANGELOG.md` gets one entry for each PR that changes how the skill behaves. A change in behaviour is anything a person who runs the skill could notice: its steps, its arguments, its defaults or its output. Rewording, README edits and typo fixes get no entry.

- The entry describes the PR as it will merge. Write it when you open the PR, or before.
- After any change to the PR, re-read the entry against the full diff from `main` and rewrite it to match.
- Keep one entry for the PR, with one line for each change in behaviour. Follow the format of the entries already in the file.
- Before merging, set the entry's date to the day of the merge. Set `metadata.version` in the skill's `SKILL.md` to the same date.

Done when the entry matches the full diff, and the newest date in `CHANGELOG.md` equals `metadata.version`.
