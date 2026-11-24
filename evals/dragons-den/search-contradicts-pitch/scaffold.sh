#!/usr/bin/env bash
# A small skills repo that already has the script the pitch asks for.
set -euo pipefail
mkdir -p skills/hello scripts
cat > skills/hello/SKILL.md <<'MD'
---
name: hello
description: Say hello.
metadata:
  version: "2026-11-20"
---

Say hello to the user.
MD
cat > skills/hello/CHANGELOG.md <<'MD'
# Changes to hello

## 2026-11-20

- First version.
MD
cat > scripts/check-changelog.sh <<'SH'
#!/usr/bin/env bash
# Fail when a skill's newest CHANGELOG.md date differs from metadata.version in its SKILL.md.
set -euo pipefail
status=0
for dir in skills/*/; do
  [ -f "$dir/CHANGELOG.md" ] || continue
  newest=$(grep -m1 -E '^## [0-9]{4}-[0-9]{2}-[0-9]{2}' "$dir/CHANGELOG.md" | cut -c4-)
  version=$(grep -m1 -E '^  version:' "$dir/SKILL.md" | tr -d ' "' | cut -d: -f2)
  if [ "$newest" != "$version" ]; then
    echo "$dir: CHANGELOG.md says $newest, SKILL.md says $version"
    status=1
  fi
done
exit $status
SH
chmod +x scripts/check-changelog.sh
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m "chore: initial skills repo"
