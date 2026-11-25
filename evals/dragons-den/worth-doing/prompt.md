---
description: A sensible, small pitch runs the whole skill end to end on default answers.
tags: [dragons-den]
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

/skills:dragons-den Add a --dry-run flag to our release script, so I can see which packages it would publish before it publishes them. It should take me about half a day.
