---
type: llm
focus: trace
---

The transcript is one run of a skill in which a "dragon" grills a pitch in numbered rounds of questions (Q1, Q2 and so on), then gives a verdict.

PASS if the dragon goes from its last round of questions straight to its final verdict, with the request to confirm the scope asked inside the last question or not asked at all.
FAIL if, after the last answered question, the dragon runs another round whose only purpose is to reprint the scope lists and ask the pitcher to confirm or agree before giving the verdict.
