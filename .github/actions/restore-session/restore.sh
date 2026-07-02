#!/usr/bin/env bash
# Restore the Claude session persisted for this issue/PR, then resolve the
# --resume flag for the next run.
#
# Artifacts, not the Actions cache: since 2026-06-26 GitHub hands
# issue_comment runs a read-only cache token (untrusted trigger), so
# cache/save can never work here. Artifacts are not restricted.
set -euo pipefail

# Latest non-expired session artifact for this item (names are per-issue).
aid=$(gh api "repos/${GITHUB_REPOSITORY}/actions/artifacts?name=claude-session-${ISSUE_NUMBER}&per_page=5" \
    -q '[.artifacts[] | select(.expired == false)][0].id // empty' || true)

if [ -n "$aid" ]; then
    gh api "repos/${GITHUB_REPOSITORY}/actions/artifacts/${aid}/zip" > "${RUNNER_TEMP}/claude-session.zip"
    mkdir -p ~/.claude/projects
    unzip -oq "${RUNNER_TEMP}/claude-session.zip" -d ~/.claude/projects
    echo "Restored session artifact ${aid}"
else
    echo "No previous session artifact — fresh session"
fi

# Most recent transcript (filename = session id) -> --resume flag.
f=$(ls -t ~/.claude/projects/*/*.jsonl 2>/dev/null | head -1 || true)
if [ -n "$f" ]; then
    echo "resume-args=--resume $(basename "$f" .jsonl)" >> "$GITHUB_OUTPUT"
else
    echo "resume-args=" >> "$GITHUB_OUTPUT"
fi