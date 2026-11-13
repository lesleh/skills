# jira-card-review

jira-card-review checks Jira cards against the code and says whether someone could pick each one up today. A card is ready when it passes three tests: its blockers are defined, its outcomes are defined, and it makes sense against the code as it stands. The skill judges what a card asks for and why, never how to build it.

The agent's steps are in [SKILL.md](SKILL.md).

## Run it

Pass card keys, an epic key, or a JQL query:

```text
/jira-card-review ABC-123 ABC-124
/jira-card-review ABC-100
/jira-card-review project = ABC AND sprint in openSprints()
```

For an epic, it reviews the epic's child cards. It skips cards that are Done, and gives each card its own agent when there are more than 3.

## The report

Each card gets one verdict:

- blocked: a card it depends on is not Done, or an open decision changes what gets built
- fix first: every fault can be fixed from evidence the skill already has
- ready: all three tests pass

For each card, the report gives the repo it belongs to and the evidence for that. It marks each acceptance item as open, met, part met or unclear, with the file and line for a met item. It groups the faults under blockers, outcomes and sense.

A fix first card comes with a rewritten description. A blocked card comes with the question, who can answer it, and a suggested split when part of the work can start now.

With several cards, the report opens with a summary table, blocked cards first.

## What it changes

Nothing, until you approve. After the report, the skill asks which fix first cards to update. For those cards only, it:

- rewrites the description, keeping its headings and voice
- adds missing links between cards: "is blocked by" for a dependency, "relates to" for a connected card that does not block
- reads the card back to check the edit

## Requirements

You need:

- the Atlassian MCP server
- the GitHub CLI, `gh`, signed in, to search merged pull requests across your organisation
- local checkouts of related repos next to the current one, so the skill can find the repo a card belongs to
