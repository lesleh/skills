---
name: review-followup
description: Check whether a PR author fixed each comment from my review. Use when I ask if my review comments were addressed, or what changed since my review.
argument-hint: "[PR number or URL]"
metadata:
  version: "2026-11-18"
---

Given a PR I reviewed, judge each of my comments by one question: does the code at head now do what I asked?

## Rules

- The code is the only proof of a code fix. A reply, a "fixed it!" claim or a resolved thread is a signal: it shows intent and where to look. Judge the code at head against the specific ask.
- Asymmetric bias. A false `Fixed` is the costly verdict: it tells me to stop looking, and then I merge broken code. When unsure, round down to `Can't tell` and name the file or line that would settle it.
- Score every comment, including those in resolved threads.
- Read-only. The report goes to the console only.

## Steps

### 1. Find the PR

The PR to check is `$ARGUMENTS`. A URL (`https://github.com/<owner>/<name>/pull/<n>`) gives the repo and the number. A bare number is a PR in the current repo. If it is empty, use the current branch's PR (`gh pr view --json number -q .number`).

```bash
ME=$(gh api user -q .login)
REPO=<owner/name>   # from the URL, else: gh repo view --json nameWithOwner -q .nameWithOwner
OWNER=${REPO%/*}; NAME=${REPO#*/}
PR=<number>
HEAD=$(gh api repos/$REPO/pulls/$PR --jq .head.sha)
BASE=$(gh api repos/$REPO/pulls/$PR --jq .base.sha)
```

If no PR can be resolved, stop and say so.

Done when `ME`, `REPO`, `PR`, `HEAD` and `BASE` are all set.

### 2. Gather my comments

Collect from three sources, keeping only mine, with `--paginate`:

- Inline review comments, replies included:

  ```bash
  gh api --paginate "repos/$REPO/pulls/$PR/comments" \
    --jq '[.[] | select(.user.login=="'"$ME"'")
           | {id, body, path, line, original_line, position, original_commit_id,
              in_reply_to_id, diff_hunk, created_at}]'
  ```

- Review summary bodies, from `REQUEST_CHANGES` and `COMMENT` reviews with a non-empty body:

  ```bash
  gh api --paginate "repos/$REPO/pulls/$PR/reviews" \
    --jq '[.[] | select(.user.login=="'"$ME"'" and (.body|length>0))
           | {id, body, state, commit_id, submitted_at}]'
  ```

- Conversation comments, which have no line:

  ```bash
  gh api --paginate "repos/$REPO/issues/$PR/comments" \
    --jq '[.[] | select(.user.login=="'"$ME"'") | {id, body, created_at}]'
  ```

Also fetch thread resolution and force-push events. Both are signals only:

```bash
# databaseId -> isResolved, to flag threads marked resolved that are not fixed
gh api graphql -f query='query($o:String!,$n:String!,$p:Int!){
  repository(owner:$o,name:$n){ pullRequest(number:$p){
    reviewThreads(first:100){ nodes{ isResolved isOutdated
      comments(first:100){ nodes{ databaseId } } } } } } }' \
  -F o=$OWNER -F n=$NAME -F p=$PR
# force-push events, only to explain moved or outdated lines in the report
gh api "repos/$REPO/issues/$PR/timeline" \
  --jq '[.[] | select(.event=="head_ref_force_pushed") | .created_at]'
```

Give each comment an anchor, the commit it was written against:

- inline comment: `original_commit_id`
- review summary: `commit_id`
- conversation comment: the head SHA at `created_at`, which is the latest commit in `pulls/$PR/commits` with `committer.date <= created_at`, else `$BASE`

Done when every comment of mine from the three sources has an anchor.

### 3. Build each comment's read set

For each comment, list the files changed between its anchor and head. This is the touched list, not the verdict. Comments that share an anchor share one call:

```bash
gh api "repos/$REPO/compare/$ANCHOR...$HEAD" --jq '{status, files: [.files[].filename]}'
```

The touched list is not the read set. `compare` reports everything between the two SHAs, so a merge from the base branch or a rebase pads it with hundreds of unrelated files, such as lockfiles and other components. Padding only widens the read. It never changes a verdict, because the verdict comes from the two code snapshots, not the diff.

Build the read set by intersect-then-expand:

1. Always read the comment's own `path`.
2. Add touched files from the same directory as `path`, or from its component folder. Base-branch churn rarely sits in the comment's own directory, so this filter removes most of the padding.
3. Expand beyond the component only on cause: the comment names a symbol, prop or hook whose definition or callers live elsewhere, or nothing in the local set settles it. Add those specific files only. Find them with one search for each symbol, in the local checkout when there is one, because a GitHub search call for every comment runs into the secondary rate limit.

When a verdict would depend on a file outside the read set, add that file through item 3. If the comment is still unsettled, its status is `Can't tell`, with that file named.

Done when every comment has a read set.

### 4. Judge each comment

Fetch each file once for each ref: comments in the same file and commit share one `contents` call. With many comments, judge them one file at a time, and keep only each status and its evidence from earlier files.

For each comment:

1. Type: `issue`, `question`, `nit`, `discussion` or `praise`.
2. Original code, as it was when I commented:

   ```bash
   gh api "repos/$REPO/contents/$FILE?ref=$ANCHOR" --jq '.content' | base64 -d   # read around original_line
   ```

   This works even on a commit that a force push removed. If it returns 404, use the comment's `diff_hunk`, which is always present. The original code shows what a bare "this is wrong" refers to.

3. Head code: read the read set at `$HEAD`, with `contents?ref=$HEAD` or the local checkout. Look for the problem itself, even if the code moved or was renamed: match on meaning, not line numbers or text. If the file is gone at head, the code was removed. Confirm the concern went with it, then mark the comment `Fixed`, with the removal as evidence.
4. Replies: read the thread (the comments whose `in_reply_to_id` points at mine). For a `question` or a `nit`, a reply can settle the status. For an `issue`, a reply only points at where to look.
5. Status, by type:
   - `issue`: `Fixed` when the code at head satisfies the specific ask and removes its cause, not only the cited line. `Partially` when it satisfies part of it, with the part left named. Otherwise `Open`.
   - `question`: `Fixed` when it was accepted and the code changed. `Answered` when a substantive reply, from the author or anyone else, answers it. `Declined` when a substantive reply rejects it. Otherwise `Open`.
   - `nit`: `Fixed`, or `Declined` when declined with a reason. A nit dropped without a word is `Open`.
   - `discussion` or `praise`: `No action`.

   Any type can be `Can't tell`, under the asymmetric bias.

The statuses are `Fixed`, `Partially`, `Open`, `Declined`, `Answered`, `Can't tell` and `No action`. A decline is where I can re-engage, so keep `Declined` apart from `Fixed`.

Done when every comment of mine has exactly one of these statuses.

### 5. Report

- Summary line: the count for each status, then each thread marked resolved whose status is `Open` or `Partially`.
- Per comment: type, status, `path:line`, the comment quoted, the evidence (the head code that settles it, cited by line, or the reply that answers it), a one-line reason, a confidence and any caveat. The caveats are a padded touched list, a diverged compare (the anchor is no longer in head's history), an outdated line, an anchor taken from a conversation comment, and evidence in another file.
- Order: `Open`, `Partially`, `Can't tell`, `Declined`, `Answered`, `Fixed`, `No action`. Within `Open`, nits come last.
- Next steps: offer them, such as a re-review or a reply to a decline, and act on one only when I ask.

Done when every comment of mine is in the report with its status and evidence.
