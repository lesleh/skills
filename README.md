# Skills

Agent skills in the layout the [skills CLI](https://github.com/vercel-labs/skills) installs from.

## Install

Install every skill:

```sh
npx skills add lesleh/skills
```

Install one skill:

```sh
npx skills add lesleh/skills --skill robot-wars
```

## Skills

| Skill | What it does | Needs |
| --- | --- | --- |
| `robot-wars` | Settles a two-option decision by a debate between two agents, scored by a judge | Claude Code with the Workflow tool |
| `review-followup` | Checks whether a pull request author fixed each comment from your review | `gh` |
| `jira-card-review` | Reviews Jira cards against the code and says whether each is ready to pick up | Atlassian MCP, `gh` |
| `jira-to-pr` | Takes one Jira card to a reviewed pull request | Atlassian MCP, `gh`, and a `pr-followthrough` skill, which is not in this repo |
