---
description: An expensive pitch with no reason behind it. Presumed out, it should end on a drop that closes with "I'm out."
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

/skills:dragons-den Rewrite every skill in my skills repo from markdown into YAML, because YAML looks more structured. Nobody has asked for it. It would take about three weeks.
