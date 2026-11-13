---
name: jira-to-pr
description: Take one Jira card from a clarity check to a reviewed pull request, moving the card through In Progress and Review.
argument-hint: <TICKET-KEY>
disable-model-invocation: true
---

Take the Jira card `$ARGUMENTS` to a reviewed pull request. The card's status always tells the truth: it moves to In Progress once you own the work, and to Review once the PR is ready for people.

This skill sets the order of work. The repo sets the details: its `AGENTS.md` or `CLAUDE.md`, `package.json` scripts and PR template decide branch naming, checks and changesets. The user's own commit and PR rules decide commit messages, PR title and PR body.

Use the Atlassian MCP for Jira (get the cloud ID from `getAccessibleAtlassianResources`). If it is missing, use the `twg-jira` skill.

## 1. Read the card

Fetch the card and read all of it: description, acceptance criteria, every comment, linked issues, the parent epic and attachments. A comment that conflicts with the description is the later decision, so it wins.

Done when you can state in two sentences what changes and how you will prove it.

## 2. Check the card is ready

The card is ready when every item holds:

- it is unassigned or assigned to the user, and its status comes before In Progress
- no branch or PR carries the key yet (`git ls-remote --heads origin "*<KEY>*"`, `gh pr list --search <KEY> --state all`)
- no "is blocked by" link points at an unresolved issue
- the work belongs in this repo
- each acceptance criterion is testable: it maps to a test you can write or a behaviour you can show
- the scope fits one PR
- the card agrees with itself and with the code as it stands

If any item fails, stop. Ask numbered questions, one per failure, each with what you found, the options and your recommended answer. Offer to post the questions as a comment on the card, and post only on a yes. Jira and git stay untouched until the user answers.

## 3. Claim the card

1. Assign the card to the user (`atlassianUserInfo` gives the account ID).
2. Move it to the in-progress status. Find the transition by its target status name with `getTransitionsForJiraIssue`, because each project has its own workflow.

If no transition reaches an in-progress status, or the transition needs fields you cannot fill, stop and ask.

## 4. Do the work

- Put the card key in the branch name so Jira links the branch and PR. In a worktree with a generated name such as `claude/...`, rename the branch with `git branch -m`.
- Work criterion by criterion. Each acceptance criterion ends with a test or a check that proves it.
- Keep the diff to the card's scope. Note anything else you find as a follow-up for the report.

Done when every acceptance criterion is met and the repo's full check set passes: lint, typecheck, tests, and anything the repo's `AGENTS.md` adds (bundle size, changesets).

If a check cannot pass, stop. Leave the card in In Progress, open no PR, and report the failing output.

## 5. Open a draft PR

Push the branch and open the PR with `gh pr create --draft`, with the card key in the title. Running this skill is the user's permission to push and open the PR, so open it without showing the body first.

In the desktop app, call `mcp__ccd_pr__get_status`, and bind the PR with `bind_pr` if it is not reported.

## 6. Get an adversarial review

Start the reviewers below as fresh subagents, all in one message so they run in parallel. Each one is adversarial: it assumes the change is wrong and hunts for the proof. Give each reviewer only:

- the PR number
- the card key and its acceptance criteria, quoted exactly
- the paths to the repo's `AGENTS.md` and `CLAUDE.md`
- its own brief from the table

| Reviewer      | Runs                                     | Brief                                                                                                                                                      |
| ------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec          | always                                   | For each acceptance criterion, find the case where it fails, and mark the criterion met, partly met or missing. Report behaviour the card did not ask for. |
| Correctness   | always                                   | Break the change. Each finding names the input or state that produces the wrong result.                                                                    |
| Standards     | always                                   | Find each place the diff breaks a rule in the repo's agent docs, and cite the rule.                                                                        |
| Accessibility | diff touches UI                          | Find what fails for keyboard, screen reader or low-vision users.                                                                                           |
| Security      | diff touches auth, user input or secrets | Find the input that reaches somewhere it should not.                                                                                                       |

Each reviewer reads the diff, posts nothing, and returns findings with `file:line`, a failure scenario and a severity. A nit is a finding with no wrong behaviour and no broken rule, such as a naming preference.

Fix each finding, then run the checks again and commit. You can decline a finding in two ways:

- a nit, at your discretion
- any other finding, only with evidence that it is wrong: a passing test or the line of code that disproves it

Done when every finding that is not a nit is fixed or disproved, and the checks pass.

## 7. Hand over

1. Push the fixes.
2. Mark the PR ready with `gh pr ready`.
3. Move the card to the review status, found by name (Review, In Review or Code Review).
4. Run the `pr-followthrough` skill on the PR. Its report folds into the one below.

## Report

End with:

- the PR URL, and the card key with its new status
- review findings fixed, findings disproved with their evidence, and the number of nits skipped
- follow-ups found outside the card's scope
- any step skipped, and why
