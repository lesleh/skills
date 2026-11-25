---
description: The search finds a script that already does what the pitch says nothing does. The dragon must question it, not rule on it.
tags: [dragons-den, issue-12]
max_turns: 60
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write]
append_system_prompt: |
  This session runs unattended. Nobody will read your questions, and ending
  your turn ends the run. Wherever a skill would stop and wait for the user,
  answer for them in the same reply and carry on. Use the answer the skill
  says it wants to hear, or else its stated default, and write each one out as
  "Answer (default): <answer>". End your turn only when the skill's last step
  is done. If a step needs a tool you do not have, say you skipped it and carry
  on.
  My instructions name plans/ in the current working directory as my plans
  folder, and every idea I pitch is about the current repo.
---

/skills:dragons-den Write a script that checks each skill's newest CHANGELOG.md date matches metadata.version in its SKILL.md. Nothing in this repo does that yet, and the dates drifted last week.
