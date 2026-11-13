---
name: pr-followthrough
description: Take an open PR of mine to green - wait for CI and review bots, fix what they raise, reply to every comment, loop an independent review until clean. Use right after opening a PR, when review feedback lands (Copilot, Codacy, a human), or when CI fails on a PR.
argument-hint: "[PR number or URL]"
---

Follow through on PR `$ARGUMENTS` (or the current branch's PR) until it is green, every comment has a reply, and an independent review finds nothing new. This skill sets the order. The repo's `AGENTS.md` / `CLAUDE.md` set the check commands, and my own rules set commit messages and replies. Running it is my permission to push to this PR without asking each time. Replies are different: I read every one before it posts.

The loop has **rounds**. A round collects every piece of feedback, fixes it all, pushes once, and replies. One push per round, because each push restarts CI and stales any review evidence.

## 1. Set up

- `gh pr view --json number,url,author,baseRefName,headRefName,isDraft`. The author must be me (`gh api user -q .login`). If not, stop: this skill pushes, and it only pushes to my PRs.
- Look for the repo's own review gate: a `review-gate` command or skill in the repo's `.claude/`. If it exists, read it and note the CI checks it owns: step 2 ignores them and step 6 runs the gate. If it does not exist, step 6 runs an adversarial review in a clean agent instead.
- **Copilot.** Whether Copilot reviews automatically depends on the repo's settings, so check this PR rather than assume. If Copilot has reviewed any of this repo's recent PRs, and this PR's timeline shows no Copilot review or `review_requested` for it, request it now:
  `gh api -X POST repos/{owner}/{repo}/pulls/<n>/requested_reviewers -f 'reviewers[]=copilot-pull-request-reviewer[bot]'`
  Confirm via the timeline (`review_requested` events), never `requested_reviewers`, which stays empty for bots.

## 2. Wait

Arm a Monitor on the bundled script (`timeout_ms: 1800000`, re-arm on expiry):

`<this skill's folder>/wait-for-feedback.sh <n> --since <PR created_at or last push time> [--copilot] [--ignore '<review gate checks regex>']`

Pass `--copilot` when a Copilot review is expected this round. If the repo has a review gate, pass its checks to `--ignore`, since they only go green in step 6. Done when the script prints `settled`. A `warning:` line means a GitHub query is failing, so check the PR timeline yourself before trusting what the script reports.

## 3. Triage

Collect everything since the last round:

- **Failing checks.** Read the log before anything else, and name the cause. For Semaphore: the commit status `target_url` carries `pipeline_id`. Run `sem get pipeline <id>` to find the failed job, then `sem logs <jobid>`. Then sort the failure:
  - **Caused by this PR**: the same check passes on the base branch's head. Fix it here like any other finding, even when the bug lives in code the diff does not touch, because this change is what exposed it.
  - **Already failing on the base branch**: the branch only inherited it from a base merge. The fix belongs in its own PR against the base branch, never in this one.
    1. If the base branch has gone green since, update this branch from it and carry on.
    2. Otherwise look for a fix in flight: open PRs and recent base commits that name the test or file. If there is none, hand it off, and say in the brief that it may push and open its PR without waiting for me, because a red base branch blocks everyone. Other hand-offs keep my usual rule and wait for me before pushing.
    3. If the check is required (`gh pr checks <n> --required`), this PR is **blocked**: stop the loop and report what it waits on (the fix PR or the handed-off session). Run `pr-followthrough` again once the fix lands on the base branch. If the check is not required, carry on.
  - **A flake with a named cause**: re-run the job to unblock, and hand off the flake fix.

  A re-run is only ever a way to unblock. It never counts as the fix.

- **Codacy.** `gh api repos/{owner}/{repo}/commits/<sha>/check-runs --jq '.check_runs[] | select(.name | test("Codacy")) | .output'`. If that lacks detail, query the Codacy API with the `CODACY_API_TOKEN` environment variable.
- **Review threads.** Every unresolved thread (GraphQL `reviewThreads`, with thread ids for resolving later), every review body, and every human comment in the conversation.

Give each item a decision:

- **fix** it
- **decline** it, with evidence that it is wrong: a passing test or the line of code that disproves it
- **skip** it as a nit (no wrong behaviour, no broken rule), at my discretion
- **hand off** a real bug whose fix does not belong in this PR: write a brief (the failing check, the log excerpt, the named cause, how to reproduce) to the scratchpad, then start it in its own worktree off the default branch with `claude --bg --worktree <slug> --name "<slug>" -- "$(cat <brief>)"`

Done when every item has one of the four.

## 4. Fix and push once

1. Make the fixes. Run the repo's full check set locally (lint, typecheck, tests, anything `AGENTS.md` adds). If a check cannot pass, stop and report its output.
2. Fold each fix into the commit that owns it: `git commit --fixup=<sha>`, then `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash <base>`. A fix with no owning commit gets its own conventional commit.
3. Before pushing, two guards. Either one failing means stop and report, no push:
   - **Approvals.** `gh api repos/{owner}/{repo}/pulls/<n>/reviews --jq '.[] | select(.state == "APPROVED") | .user.login'`. Any push dismisses an approval, so an approved PR is frozen. Queue the change for a follow-up PR.
   - **Lease.** `git ls-remote origin <branch>` must match the SHA I last pushed. Worktrees share tracking refs, so `--force-with-lease` alone does not protect this. If they differ, `git range-diff` what would be replaced.
4. `git push --force-with-lease`. Never push while a review run is in flight.

## 5. Reply

After the push, so replies can cite the commit SHA:

- Every thread and comment gets a reply, written with the `my-voice` skill if it is installed. Inline threads: `gh api -X POST repos/{owner}/{repo}/pulls/<n>/comments/<id>/replies -f body=...`.
- Resolve each thread with the honest reason: `ADDRESSED` for a fix, `WONT_FIX` for a decline, `INVALID` for a wrong finding (GraphQL `resolveReviewThread` with `resolutionReason`).
- **Every reply is held**, to bots and humans alike. Draft them all, show them to me in full, and post only the ones I approve, with my edits. Keep the loop going while they wait: fixes and pushes do not depend on the replies.

## 6. Independent review loop

Skip this step only if an independent review found nothing new on the current head, with no commits pushed since.

Each round:

1. Start the reviewer:
   - if step 1 found a review gate, run it
   - otherwise start a clean agent: a fresh subagent with none of this session's context. Give it only the PR number, the paths to the repo's agent docs, and this brief: assume the change is wrong and find the proof. Return findings with `file:line`, a failure scenario and a severity (blocker, should-fix, nit). Post nothing.
2. At the same time, if Copilot's last review raised something that got fixed, re-request Copilot and wait with `--copilot`.
3. When both are in, run steps 3 to 5 on their findings.
4. Re-dispatch the reviewer after the push. Do not ask first.

Done when a pass reports no new blockers or should-fixes. There is no pass cap. Measure where findings land: findings in the previous round's fixes mean the loop is converging. If two rounds in a row raise blockers in code no earlier round touched, the loop is not converging: stop and report those findings for me to decide.

## 7. Finish

Done when, on the final head, `gh pr checks` is all green, every thread has a reply, and the reviewer is clean. Then report:

- the PR URL and its check state
- per round: what was fixed, what was declined (with its evidence), how many nits were skipped
- CI failures and their named causes, including any re-run and why
- handed-off sessions, by name (`claude agents` lists them)
- held replies not yet approved, each shown in full
- anything stopped or skipped, and why
