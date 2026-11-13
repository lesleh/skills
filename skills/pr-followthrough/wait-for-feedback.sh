#!/usr/bin/env bash
# Stream PR feedback as it lands: settled checks, new reviews, new human comments.
# Exits with a final "settled" line once every non-ignored check has finished and,
# with --copilot, a Copilot review newer than --since has arrived (or 20 min passed).
# Usage: wait-for-feedback.sh <pr> [--since <ISO8601>] [--copilot] [--ignore <check regex>]
set -u

pr=$1; shift
since=$(date -u +%Y-%m-%dT%H:%M:%SZ)
want_copilot=false
ignore='^$'
while [ $# -gt 0 ]; do
  case $1 in
    --since) since=$2; shift 2 ;;
    --copilot) want_copilot=true; shift ;;
    --ignore) ignore=$2; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
me=$(gh api user -q .login)
seen=""
settled_at=""
reviews='[]'
comments='[]'
reviews_ok=false
err=$(mktemp)
trap 'rm -f "$err"' EXIT

emit_new() {
  local current=$1
  comm -13 <(printf '%s\n' "$seen" | sort) <(printf '%s\n' "$current" | sort) | grep -v '^$'
  seen=$(printf '%s\n%s\n' "$seen" "$current" | sort -u)
}

# Prints the merged JSON array from `gh api --paginate`, or fails if gh errors or returns
# anything else (an error body, a network failure), so the caller can keep its last good copy.
fetch_array() {
  local out
  out=$(gh api "$1" --paginate 2>"$err") || return 1
  jq -se 'all(type == "array")' <<<"$out" >/dev/null 2>&1 || return 1
  jq -c -s 'add // []' <<<"$out"
}

while true; do
  checks=$(gh pr checks "$pr" --json name,bucket 2>/dev/null || true)
  if new=$(fetch_array "repos/$repo/pulls/$pr/reviews"); then
    reviews=$new; reviews_ok=true
  else
    emit_new "warning: reviews query failed: $(head -c 200 "$err" | tr '\n' ' ')"
  fi
  if new=$(fetch_array "repos/$repo/issues/$pr/comments?since=$since"); then
    comments=$new
  else
    emit_new "warning: comments query failed: $(head -c 200 "$err" | tr '\n' ' ')"
  fi

  events=$(
    jq -r --arg ig "$ignore" \
      '.[] | select(.name | test($ig) | not) | select(.bucket != "pending") | "check \(.bucket): \(.name)"' \
      <<<"${checks:-[]}"
    jq -r --arg s "$since" \
      '.[] | select(.submitted_at > $s) | "review \(.state) by \(.user.login) (id \(.id))"' <<<"$reviews"
    jq -r --arg me "$me" \
      '.[] | select(.user.type == "User" and .user.login != $me) | "comment by \(.user.login) (id \(.id))"' <<<"$comments"
  )
  emit_new "$events"

  checks_done=$(jq -r --arg ig "$ignore" \
    '[.[] | select(.name | test($ig) | not)] | length > 0 and all(.bucket != "pending")' <<<"${checks:-[]}")
  copilot_done=true
  if $want_copilot; then
    copilot_done=$(jq -r --arg s "$since" \
      'any(.[]; .user.login == "copilot-pull-request-reviewer[bot]" and .submitted_at > $s)' <<<"$reviews")
  fi

  if [ "$checks_done" = true ]; then
    [ -n "$settled_at" ] || settled_at=$(date +%s)
    if [ "$copilot_done" = true ]; then
      echo "settled"; exit 0
    elif [ $(( $(date +%s) - settled_at )) -ge 1200 ]; then
      if $reviews_ok; then
        echo "settled (no Copilot review 20 min after checks finished)"
      else
        echo "settled (reviews could not be fetched, so a Copilot review is unconfirmed: check the PR timeline)"
      fi
      exit 0
    fi
  fi
  sleep 30
done
