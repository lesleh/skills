# robot-wars

robot-wars settles a choice between two options by running a structured debate between AI agents. Two debaters argue assigned sides in turns, and a judge scores each run. In full mode the sides swap for a second run, so a result that depends on speaking order shows up as a draw.

You get a report that names the side whose case held up under attack. It also lists the claims the judges found unsourced or wrong, and a premise that would overturn the result if it turned out wrong. The report gives the judges' view of the arguments, and a well-argued side can still be wrong.

The agent's steps are in [SKILL.md](SKILL.md). The debate itself runs from [robot-wars.workflow.js](robot-wars.workflow.js).

## Run it

Type the motion after the command:

```text
/robot-wars slow pre-commit hooks are not worth their cost when CI runs the same checks
```

Add `quick` at the end for a single run with 8 agents. Full mode, the default, uses 20 agents. Either mode adds one agent for each speech that runs over its word limit, to shorten it.

If you give only the motion, the skill drafts the rest and shows it to you first:

- the motion and what each side proposes
- the context both sides and the judge share
- the agent count
- numbered questions about facts the debate depends on that nobody has settled

It waits for your answers and approval before the debate starts. If you give the motion and the context yourself, it starts straight away.

A full run has a winner only when the same side wins both runs. If the winner changes when the sides swap, the result is a draw.

## Cost and output

Two full runs on 12 November 2026 used 27 and 21 agents, and took 8 and 18 minutes. The agents in each run used about 890,000 and 930,000 tokens in total.

Every agent runs on your session's model, with one exception. If your session runs Fable, the agents run on Opus, which costs half as much for each token. To choose a model yourself, name it when you run the skill.

The skill writes one file, `debate-<motion>.md`. It goes in the plans folder named in your `CLAUDE.md` or other instructions, or `.ai-plans/` in the current repo, or a scratch folder outside a repo. To build the context, the skill reads files in your repo but runs no commands there. The debaters and judges can search the web while they argue and check facts.

## Requirements

You need Claude Code with the Workflow tool, which runs the debate agents.
