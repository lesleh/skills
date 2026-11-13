# Skills

Agent skills in the layout the [skills CLI](https://github.com/vercel-labs/skills) installs from.

## Install

Install every skill for your user, rather than only the current project:

```sh
npx skills add lesleh/skills -g
```

Install one skill:

```sh
npx skills add lesleh/skills -g --skill robot-wars
```

## Skills

| Skill | What it does | Needs |
| --- | --- | --- |
| `robot-wars` | Settles a two-option decision by a debate between two agents, scored by a judge | Claude Code with the Workflow tool |
| `review-followup` | Checks whether a pull request author fixed each comment from your review | `gh` |
| `jira-card-review` | Reviews Jira cards against the code and says whether each is ready to pick up | Atlassian MCP, `gh` |
| `jira-to-pr` | Takes one Jira card all the way to a green, reviewed pull request, finishing with `pr-followthrough` when it is installed | Atlassian MCP, `gh` |
| `pr-followthrough` | Takes your open pull request to green: waits for CI and review bots, fixes what they raise and repeats an adversarial review until it finds nothing new | Claude Code, `gh` |
