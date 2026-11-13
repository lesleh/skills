---
name: robot-wars
description: Settle a two-option decision by debate - two agents argue assigned sides, a judge scores each run, sides swap to cancel order bias.
argument-hint: "<motion> [quick]"
disable-model-invocation: true
---

Run a structured debate on the motion in `$ARGUMENTS`. Two debater agents argue assigned sides in strict turns, and a judge agent scores each run. The workflow script `robot-wars.workflow.js` in this folder owns the turn order, the role prompts and the scoring, so your job is the framing before it and the report after it.

## 1. Frame the motion

Write the motion as one claim a team could adopt, with a PRO side that argues for it and a CON side that argues against it. Name what each side actually proposes, for example PRO "render inside a shadow root", CON "render into the host page's DOM with scoped classes".

Word the motion around the trade-off, such as "not worth its cost", rather than an absolute word such as "pointless". An absolute word lets the debate turn on the word's definition instead of the decision.

The motion must have two viable sides. A factual question ("does X support Y?") or a decision already made leaves the debaters nothing real to argue, so say so and answer it directly instead.

Rule out any third option that would let one side dodge the motion, and record that in the context.

Done when the motion is one sentence and each side has a one-line proposal.

## 2. Write the context

The context is the only material both debaters and the judge share, so it decides the quality of the debate. The judge scores relevance against it. Write it as short bullets:

- the situation: what is being built, for whom, where it runs
- the constraints each side must satisfy
- options ruled out of scope
- any repo files both sides may read, as absolute paths

Take it from the user's message, the conversation and repo files you read. Read files only. A fact that only a command would show, such as a timing or a CI result, becomes a question for the user in step 3.

Keep it neutral: facts and constraints, never arguments for either side.

Done when every constraint the judge needs is written down, and either side would accept the context as fair.

## 3. Settle the premises

If the user gave the motion and context outright, skip this step and run straight away.

Otherwise, find the open premises: facts a side's case needs that the context does not state. A premise nobody settled can decide the debate, and a badly framed motion wastes every agent after it. Sketch each side's strongest case in two or three lines. Then list every fact that case needs and the context leaves open, such as how a process works, how often something happens, or who does what.

Show the user the motion, sides, context and agent count. Put each open premise at the end as a numbered question: a one-line brief, the options, your default, then the question. Add each answer to the context as a fact, and wait for approval before you run.

Done when every premise either side's strongest case needs is in the context as a fact, or the user has chosen to leave it open.

## 4. Run the workflow

Read `robot-wars.workflow.js` in this folder in full, then call Workflow with its contents verbatim as `script`. Workflow accepts a `scriptPath` only inside the working directory or an added directory, so a path into this skill folder fails.

Use `quick` mode when the user passes `quick`, and `full` mode otherwise. Pass these `args`:

| Arg | Required | Default |
|---|---|---|
| `motion` | yes | |
| `context` | yes | |
| `pro`, `con` | no | "for the motion", "against the motion" |
| `mode` | no | `full`: 2 runs with sides swapped, 2 rebuttal rounds, 20 agents. `quick`: 1 run, 1 rebuttal round, 8 agents. A draw skips that run's stress test, so it uses one agent fewer. A speech over its word limit adds one agent to cut it |
| `rebuttals` | no | 2 in full mode, 1 in quick mode |
| `limits` | no | `{opening: 400, rebuttal: 300, closing: 150}` words |
| `criteria` | no | evidence, relevance, rebuttal, practicality, fragility, as `[{key, question}]` |

Swap `criteria` when the decision is not an engineering one. Practicality fits a build decision, not a policy question.

Done when the workflow's completion notice arrives with `overall` and `markdown` in its result.

## 5. Report

Write the returned `markdown` to `debate-<motion-slug>.md` in the folder the user's instructions name for plans, else `.ai-plans/` in the current repo, or the scratchpad outside a repo. Then report:

- the overall result: PRO, CON, draw, or incomplete. In full mode the same side must win both runs. A changed winner is a draw, because order or labels decided it
- each run's winner and the judge's reason, one line each
- the arguments that decided it, across runs
- the surviving arguments for each side, from the file's "Surviving arguments" section. Merge the runs so a point made in both counts once, and give each with the premise it depends on
- every claim a judge flagged as unsourced or wrong. These are often the most useful output: confident errors both debaters made
- every disputed fact a judge checked, and what it found
- the premise a stress test broke, if any, and whether the winning side's conclusion survives its alteration. The workflow returns `fragile: true` when a side won every run and a stress test broke it. Report any line where the judge and the stress test disagree
- in quick mode, that the result is indicative, since one run cannot rule out order bias

Give the result as the judge's view of the arguments, not as settled fact. A debate shows which case held up under attack, and a well-argued side can still be wrong.

Done when the file is written and the report covers every item above that applies.
