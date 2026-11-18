# Changes to review-followup

Each entry lists what changed in how the skill behaves, newest first. The `metadata.version` field in [SKILL.md](SKILL.md) holds the date of the newest entry, so you can match your installed copy to an entry here.

## 2026-11-18

- A declined comment shows as Declined, and an answered question shows as Answered. Both used to show as Resolved.
- A comment the code fixes in part shows as Partially, and the report names the part left.
- A nit dropped without a reply shows as Open, after the other Open comments. It used to show as "Open (nit)".
- When a verdict depends on a file the skill did not read, it reads that file. If that does not settle it, the status is Can't tell and the report names the file.
- An issue counts as Fixed only when the change removes its cause, not only the line the comment points at.
- A comment on code that was removed counts as Fixed, with the removal as evidence.
- The skill reads replies to issue comments too, as pointers to where a fix might be.
- The agent also starts the skill when you ask what changed on a pull request since your review.
