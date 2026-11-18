# Changes to jira-to-pr

Each entry lists what changed in how the skill behaves, newest first. The `metadata.version` field in [SKILL.md](SKILL.md) holds the date of the newest entry, so you can match your installed copy to an entry here.

## 2026-11-18

- The readiness check uses jira-card-review's three tests: blockers, outcomes and sense. It runs jira-card-review on the card when it is installed, and only after the card passes the checks that it is free to start.
- A card is not ready when a dependency it names has no "is blocked by" link, or when the code already meets one of its acceptance criteria.
- A card that jira-card-review marks fix first goes ahead once you approve its rewrite.
