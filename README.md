# Skills

Agent skills in the layout the [skills CLI](https://github.com/vercel-labs/skills) installs from.

## Install

Install every skill for your user, rather than only the current project:

```sh
npx skills add lesleh/skills -g
```

Install one skill:

```sh
npx skills add lesleh/skills -g --skill robot-wars
```

## Skills

Each skill's README says what it does, what it changes without asking, and what it needs:

- [robot-wars](skills/robot-wars/README.md): settles a choice between two options by a debate between agents, scored by a judge
- [review-followup](skills/review-followup/README.md): checks whether a pull request author fixed each comment from your review
- [jira-card-review](skills/jira-card-review/README.md): checks Jira cards against the code and says whether each is ready to pick up
- [jira-to-pr](skills/jira-to-pr/README.md): takes one Jira card to a reviewed pull request with passing checks
- [pr-followthrough](skills/pr-followthrough/README.md): keeps working on your pull request until CI passes, every comment has a reply and a review finds nothing new that needs fixing
- [dragons-den](skills/dragons-den/README.md): has you pitch a rough idea to a busy dragon who grills it down to a fixed scope, then says whether it is worth your time

## Evals

The `evals/` folder holds regression cases for the skills. Each case runs a skill once, from start to finish, with `claude plugin eval`. Nobody answers during a run: wherever the skill would wait for you, it takes the answer it wants to hear, or its default, and carries on.

Run every case, 3 times each:

```sh
claude plugin eval . --ablation none --scaffold --allow-tools Write --judge-model sonnet --no-publish
```

Run one case once, while you work on it:

```sh
claude plugin eval . --case worth-doing --runs 1 --ablation none --scaffold --allow-tools Write --judge-model sonnet --no-publish
```

What the flags do:

- `--ablation none` skips the comparison run without the plugin, which tells you nothing when a case starts with a slash command
- `--scaffold` runs each case's `scaffold.sh`, which builds a small fixture repo for the skill to search
- `--allow-tools Write` lets the skill write its output files
- `--judge-model sonnet` grades the `llm` graders with Sonnet, because the default Haiku judge failed correct runs

The first run asks you to trust the folder. The `.claude-plugin/plugin.json` file exists only so that `claude plugin eval` can load the skills as a plugin.

To add a case, copy an existing case folder under `evals/<skill>/`, then change the prompt and the graders. Keep the `append_system_prompt` block, which tells the run to answer for you. Use `regex` graders where you can. In testing, an `llm` grader over the whole transcript gave a wrong verdict.

## Licence

You can use, copy and change these skills under the [MIT licence](LICENSE).
