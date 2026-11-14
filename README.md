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

Each skill's README says what it does, what it changes without asking, and what it needs:

- [robot-wars](skills/robot-wars/README.md): settles a choice between two options by a debate between agents, scored by a judge
- [review-followup](skills/review-followup/README.md): checks whether a pull request author fixed each comment from your review
- [jira-card-review](skills/jira-card-review/README.md): checks Jira cards against the code and says whether each is ready to pick up
- [jira-to-pr](skills/jira-to-pr/README.md): takes one Jira card to a reviewed pull request with passing checks
- [pr-followthrough](skills/pr-followthrough/README.md): keeps working on your pull request until CI passes, every comment has a reply and a review finds nothing new that needs fixing

## Licence

You can use, copy and change these skills under the [MIT licence](LICENSE).
