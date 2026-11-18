# jira-to-pr

jira-to-pr takes one Jira card from a readiness check to a reviewed pull request with passing checks. It moves the card to In Progress when it starts work, and to Review when the pull request is ready for people.

The skill assigns the card, changes its status, pushes and opens a pull request without asking. Run it in a checkout of the repo the card belongs to.

The agent's steps are in [SKILL.md](SKILL.md). Changes to the skill are listed in [CHANGELOG.md](CHANGELOG.md).

## Run it

```text
/jira-to-pr ABC-123
```

The skill works through these stages:

- it checks the card is free to start: assigned to you or nobody, not started, in this repo, and small enough for one pull request
- it checks the card is ready, with the three tests from [jira-card-review](../jira-card-review/README.md), running that skill if you have it
- it assigns the card to you and moves it to In Progress
- it does the work on a branch named after the card, and proves each acceptance criterion with a test or a check
- it runs the repo's checks, such as lint, type checks and tests, and anything the repo's `AGENTS.md` adds
- it opens a draft pull request
- it starts reviewer agents that try to prove the change wrong, then fixes or disproves what they find
- it marks the pull request ready and moves the card to Review
- it follows the pull request through CI and review

For the last stage, it runs the [pr-followthrough](../pr-followthrough/README.md) skill if you have it. Otherwise it waits for the checks, fixes failures this pull request caused, and lists review comments in its report without replying.

The reviewers always cover the card's acceptance criteria, correctness and the repo's own rules. An accessibility reviewer joins when the change touches the interface. A security reviewer joins when it touches authentication, user input or secrets.

## What it changes

Without asking, the skill:

- sets you as the card's assignee and changes its status twice
- creates a branch, commits, and pushes
- opens a draft pull request, without showing you the description first, and later marks it ready

It posts a comment on the card, or rewrites the card's description through jira-card-review, only if you agree.

The skill stops and asks you questions when the card is not ready, and changes nothing in Jira or git until you answer. It also stops when Jira has no move to an in-progress status, or the move needs fields it cannot fill. If a check cannot pass, it leaves the card In Progress and opens no pull request.

## Requirements

You need:

- Claude Code
- the Atlassian MCP server, or the `twg-jira` skill if the server is missing
- the GitHub CLI, `gh`, signed in

The jira-card-review and pr-followthrough skills are optional.
