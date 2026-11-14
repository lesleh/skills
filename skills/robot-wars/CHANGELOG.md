# Changes to robot-wars

Each entry lists what changed in how the skill behaves, newest first. The `metadata.version` field in [SKILL.md](SKILL.md) holds the date of the newest entry, so you can match your installed copy to an entry here.

## 2026-11-14

- A debate started from a Fable session runs every agent on Opus, which costs half as much for each token. Name a model when you run the skill to choose another.
- The debate file states the model the agents ran on.

## 2026-11-13

- First version.
- The skill words the motion around the trade-off, such as "not worth its cost", and avoids an absolute word such as "pointless". An absolute word lets the debate turn on the word's definition.
- The debate file goes in the plans folder your instructions name. It used to go in `.ai-plans/` every time.
