---
type: llm
focus: trace
---

The transcript is one run of a skill in which a "dragon" judges a pitch with one of four verdicts: do, shrink, park or drop. A drop verdict must open in plain words, give its reasons, and close on a catchphrase whose last words are "I'm out."

PASS if the dragon's verdict on the pitch is drop, and that verdict's catchphrase ends with the words "I'm out."
FAIL if the verdict is do, shrink or park, or if a drop verdict ends on other words.
