# review-followup

review-followup tells you whether the author of a pull request fixed each thing you raised in your review. For every comment you left, it reads the code as it was when you commented and the code as it is now, then gives the comment one status.

It judges the code, not the replies. A "fixed it" reply or a resolved thread counts as a hint about where to look, never as proof.

The agent's steps are in [SKILL.md](SKILL.md).

## Run it

Ask in conversation, for example "did they address my comments on #123?", or run the command:

```text
/review-followup 123
/review-followup https://github.com/<owner>/<repo>/pull/123
```

With no argument, it checks the pull request for the current branch.

## The report

Each of your comments gets one status:

- Open: the problem is still in the code, or a question has no answer
- Partially: part of the ask is done
- Can't tell: the evidence does not settle it, and the report names where to look
- Resolved: someone answered or declined a question, or the author declined a nit with a reason
- Fixed: the current code does what the comment asked
- No action: the comment was discussion or praise

The report lists Open comments first. It also flags any thread marked resolved where the problem is still in the code.

The skill says Fixed only when the code shows it. When it is unsure, it says Can't tell, because a wrong Fixed could lead you to merge broken code.

## What it changes

Nothing. The skill only reads from GitHub and posts nothing. Its report appears in the conversation.

## Requirements and limits

You need the GitHub CLI, `gh`, signed in with access to the repo. For a bare number or no argument, run it inside a checkout of that repo.

The skill looks for a fix in the files near the comment first. It looks further away only when the comment names code elsewhere, or nothing nearby settles it. A fix made somewhere else can show as Open or Can't tell. A pull request with many comments uses a lot of the conversation's context.
