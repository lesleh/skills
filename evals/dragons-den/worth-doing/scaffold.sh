#!/usr/bin/env bash
# A small monorepo whose release script publishes every package with no preview.
set -euo pipefail
mkdir -p scripts packages/button packages/theme
for pkg in button theme; do
  cat > "packages/$pkg/package.json" <<JSON
{
  "name": "@example/$pkg",
  "version": "1.4.0"
}
JSON
done
cat > scripts/release.sh <<'SH'
#!/usr/bin/env bash
# Publish every package whose version is not on the registry yet.
set -euo pipefail
for dir in packages/*/; do
  name=$(node -p "require('./$dir/package.json').name")
  version=$(node -p "require('./$dir/package.json').version")
  if npm view "$name@$version" version >/dev/null 2>&1; then
    continue
  fi
  (cd "$dir" && npm publish --access public)
  git tag "$name@$version"
done
git push --tags
SH
chmod +x scripts/release.sh
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m "chore: initial monorepo"
