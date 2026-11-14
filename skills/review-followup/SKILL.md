---
name: review-followup
description: Check whether a PR author fixed each thing I raised in my review. Use when I ask whether my review comments were addressed.
argument-hint: "[PR number or URL]"
metadata:
  version: "2026-11-13"
---

# Review Follow-up

Given a PR I reviewed, answer one question per comment: **did the author fix what I raised?**
Portable: runs as whoever invokes it, against whatever repo `gh` points at. Read-only.

## Hard rules

- **The question is "did the author fix it?"**: an outcome about the code as it stands now,
  not which commit touched which line. Attribution is not the goal.
- **Source of truth is the code, never the words.** A comment body, a reply, a "fixed it!"
  self-claim, a resolved-thread flag: all are _signals_ (intent, where to look), never proof
  of a code fix. Verify code issues against the actual code.
- **Asymmetric bias.** A false `Fixed` is the costly verdict — it tells me to stop looking,
  then I merge broken code. Only say `Fixed` when the current code demonstrably satisfies the
  _specific_ ask. When unsure, `Can't tell` with a pointer. Never round up to `Fixed`.
- **Score every comment, resolved threads included.** A resolved thread is not a fixed issue.
  Flag `isResolved==true` + `Open`/`Partially` as "marked resolved, not fixed".
- **Read-only. Post nothing.** Output goes to the console only.

## Steps

### 1. Resolve identity, repo, PR, head

The PR to check is `$ARGUMENTS`. A URL (`https://github.com/<owner>/<name>/pull/<n>`) gives
the repo and the number. A bare number is a PR in the current repo. If it is empty, use the
current branch's PR (`gh pr view --json number -q .number`).

```bash
ME=$(gh api user -q .login)
REPO=<owner/name>   # from the URL, else: gh repo view --json nameWithOwner -q .nameWithOwner
OWNER=${REPO%/*}; NAME=${REPO#*/}
PR=<number>
HEAD=$(gh api repos/$REPO/pulls/$PR --jq .head.sha)
BASE=$(gh api repos/$REPO/pulls/$PR --jq .base.sha)
```

If no PR can be resolved, stop and say so.

### 2. Gather my comments (three sources, filter to me, `--paginate`)

- **Inline review comments** — keep all mine, replies included:

  ```bash
  gh api --paginate "repos/$REPO/pulls/$PR/comments" \
    --jq '[.[] | select(.user.login=="'"$ME"'")
           | {id, body, path, line, original_line, position, original_commit_id,
              in_reply_to_id, diff_hunk, created_at}]'
  ```

- **Review summary bodies** — `REQUEST_CHANGES`/`COMMENT` with non-empty body:

  ```bash
  gh api --paginate "repos/$REPO/pulls/$PR/reviews" \
    --jq '[.[] | select(.user.login=="'"$ME"'" and (.body|length>0))
           | {id, body, state, commit_id, submitted_at}]'
  ```

- **Conversation (issue) comments** — not line-anchored:

  ```bash
  gh api --paginate "repos/$REPO/issues/$PR/comments" \
    --jq '[.[] | select(.user.login=="'"$ME"'") | {id, body, created_at}]'
  ```

Also pull thread resolution + timeline context (signals only):

```bash
# databaseId -> isResolved, so we can flag "marked resolved but not fixed"
gh api graphql -f query='query($o:String!,$n:String!,$p:Int!){
  repository(owner:$o,name:$n){ pullRequest(number:$p){
    reviewThreads(first:100){ nodes{ isResolved isOutdated
      comments(first:100){ nodes{ databaseId } } } } } } }' \
  -F o=$OWNER -F n=$NAME -F p=$PR
# force-push events, only to explain moved/outdated lines to the user
gh api "repos/$REPO/issues/$PR/timeline" \
  --jq '[.[] | select(.event=="head_ref_force_pushed") | .created_at]'
```

Anchor per comment: inline → `original_commit_id`; review summary → `commit_id`;
conversation → head SHA at `created_at` (from `pulls/$PR/commits`, latest
`committer.date <= created_at`; fallback `$BASE`).

Done when every comment of mine from the three sources has an anchor.

### 3. Build the head-read map per comment (intersect-then-expand)

For each comment, find the files the author touched after it. This is the map, not the verdict:

```bash
gh api "repos/$REPO/compare/$ANCHOR...$HEAD" --jq '{status, files: [.files[].filename]}'
```

**The raw list is not the read set.** `compare` reports _everything_ between the two SHAs,
and any **merge from the base branch or rebase** pads it with hundreds of unrelated files
(lockfiles, other components), whatever its `status`. Padding only ever widens the read, never
flips a verdict, because the verdict comes from the two code snapshots, not the diff.

Build the read set by **intersect-then-expand**:

1. **Always read** the comment's own `path`.
2. **Add same-directory / same-component files** from the touched list (same dir as `path`,
   or its component folder). Master churn is almost never in the comment's own directory, so
   this filter neutralises merge/rebase padding for free.
3. **Expand beyond the component only on cause** — the issue names a symbol/prop/hook whose
   definition or callers live elsewhere, or nothing in the local set resolves it. Chase those
   specific files, don't re-add the whole list.

Note in the report when the map was padded (many touched files, few relevant) and soften
confidence for any verdict that _would_ depend on a file outside the read set. Dedupe/cache
`compare` by anchor.

Done when every comment has a read set.

### 4. Read the two snapshots and judge each comment

For each comment:

1. **Type** — `issue` | `question` | `nit` | `discussion`/`praise`.
2. **Original code** — the code as it was when I commented:

   ```bash
   gh api "repos/$REPO/contents/$FILE?ref=$ANCHOR" --jq '.content' | base64 -d   # read around original_line
   ```

   Works even on a force-pushed-away commit. If it 404s, fall back to the comment's
   `diff_hunk` (always present). This tells you exactly what the comment was about — resolves
   bare "this is wrong" deixis.

3. **Head code** — read the head-read set (step 3) at `$HEAD` (`contents?ref=$HEAD` or the
   local checkout). Look for the problem itself, even if the code moved or was renamed:
   match on meaning, not line numbers or text. File gone at head ⇒ code removed ⇒ concern
   likely moot (confirm).
4. **Replies** — for `question`/`nit`, read the thread (comments with `in_reply_to_id`
   pointing at mine) to see if it was answered/declined.
5. **Resolution test by type:**
   - `issue` → **Fixed** iff head code demonstrably satisfies the specific ask (verify in
     code, don't trust a "fixed" reply); else **Open**.
   - `question` → **Fixed** (accepted + changed, verify in code) OR **Resolved (answered/
     declined)** if a substantive reply (author _or_ any participant) answers/rejects it;
     unanswered + no code change → **Open**.
   - `nit` → **Fixed**, or **Resolved (declined)** if declined with a reason; silently dropped
     → **Open (nit)**, low severity.
   - `discussion`/`praise` → **No action**.

Status set: `Fixed` | `Resolved (declined/answered)` | `Partially` | `Open` | `Can't tell`.
Keep `Fixed` and `Resolved (declined)` distinct — a decline is where I may want to re-engage.

Done when every comment of mine has exactly one status.

### 5. Report (console only)

- **Summary line**: counts per status, plus any "marked resolved but not fixed" callouts.
- **Per comment**: type · status · `path:line` · the comment (quoted) · evidence (the head
  code that resolves/fails it, cited by line, or the resolving reply) · one-line rationale ·
  confidence · caveat (diverged-compare / outdated / conversation-anchored / cross-file).
- Order: `Open` first (what still needs my attention), then `Partially`, `Can't tell`,
  `Resolved (declined)`, `Fixed`, `No action`.
- Post nothing. Offer next steps (re-review, reply to a decline) but don't act unprompted.

## Cost

Per comment ≈ 2 `contents` reads + 1 `compare`, plus shared GraphQL/timeline. Cache
`contents` by `(path, ref)` and `compare` by anchor — comments clustering in one file/commit
collapse to one fetch. Mind the secondary rate limit; no per-comment search loops.

## Known limits (state them, don't hide them)

- A fix that lands outside the intersect-then-expand read set → possible false `Open`
  (survivable) — and a local "fix" whose real cause is untouched → possible false `Fixed`
  (held only by the asymmetric bias, not eliminated).
- The step-3 directory filter trades completeness for tractability: a genuine cross-directory
  fix needs the expand step to fire. If confidence hinges on a file outside the read set, say
  `Can't tell` and name the file, rather than guessing.
- Big PRs (many comments) can bloat context; chunk if needed.
- LLM verdicts aren't deterministic; lean on cited evidence + confidence.
