# pr-followthrough

pr-followthrough keeps working on your pull request until CI passes, every comment has a reply and an independent review finds nothing new that needs fixing. It works in rounds. Each round collects every failing check and comment, fixes or declines each one, pushes once and drafts replies.

The skill pushes to your pull request without asking each time. It refuses to run on a pull request you did not open.

The agent's steps are in [SKILL.md](SKILL.md). The script [wait-for-feedback.sh](wait-for-feedback.sh) watches the pull request between rounds.

## Run it

```text
/pr-followthrough
/pr-followthrough 123
```

With no argument, it works on the pull request for the current branch. Claude Code can also start it by itself after you open a pull request, when review feedback arrives, or when CI fails.

## What it changes without asking

- it folds each fix into the commit it belongs to, so it rewrites the branch, then pushes with `git push --force-with-lease`
- it requests a Copilot review when Copilot reviews other pull requests in the repo but has not reviewed this one
- it re-runs a failed CI job when the failure is flaky and its cause is known
- it resolves each review thread, with a reason
- it starts a background Claude Code session, in its own worktree, for a bug that does not belong in this pull request

A background session that fixes a failure already on the base branch can push and open its own pull request without waiting for you. A red base branch blocks everyone, so that session does not wait.

The skill drafts a reply to every comment, but posts only the replies you approve. It stops before pushing if the pull request is already approved, because a push would dismiss the approval. It also stops if the branch on GitHub has changed since its last push.

## When it stops

The skill finishes when the checks pass, every thread has a reply and the reviewer finds no new blockers or should-fix problems. It stops early and reports when:

- a required check also fails on the base branch
- a check cannot pass locally
- two rounds in a row find blockers in code that no earlier round touched

There is no limit on the number of rounds otherwise.

For the independent review, the skill uses the repo's own `review-gate` command if `.claude/` has one. Otherwise it starts a fresh agent with none of the session's context, and asks it to prove the change wrong.

## Requirements

You need:

- Claude Code, which provides the Monitor tool and `claude --bg` for background sessions
- the GitHub CLI, `gh`, signed in
- `bash` and `jq`, for the watching script

These are optional, and each one adds a feature:

- the Semaphore CLI, `sem`, to read Semaphore build logs
- a `CODACY_API_TOKEN` environment variable, for Codacy results in detail
- the `my-voice` skill, to write replies in your voice
