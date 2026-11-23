# dragons-den

```text
              __    __
              \ \__/ /____
         _____/ /  \/     `--.__
        /  ___/    (@)         `-._
       |  /   ^^^^              o  >  ~ ~ ~
       |  \__   ^^^^     __.------'  ~ ~
        \    `---.______/   ~ ~
         \__________\
```

> "And for that reason, I'm out."

dragons-den has you pitch a rough idea to a dragon: very rich, very busy and unconvinced that your idea deserves anyone's time, yours included. The dragon grills the idea until its scope is fixed, then says whether it is worth doing. It is for catching an idea that is not worth the time before you have spent the time on it.

The dragon is modelled on the investors in [Dragons' Den](https://www.bbc.co.uk/programmes/b006vq92), the BBC show where entrepreneurs pitch for money and mostly leave without it.

The agent's steps are in [SKILL.md](SKILL.md). Changes to the skill are listed in [CHANGELOG.md](CHANGELOG.md).

## Run it

Run the command with the idea, or a link to the card or ticket that holds it:

```text
/dragons-den a dashboard that shows which skills I actually use
/dragons-den https://trello.com/c/<card>
```

The skill runs only when you type the command. The agent does not start it on its own.

## What it sounds like

A made-up pitch, shortened. The first round:

```text
> /dragons-den a dashboard that shows which skills I actually use

I'm not seeing it yet. You want a dashboard. I had my people look: your
session logs already record every skill you run, and one search counts them.

In:     a dashboard of skill usage (new)
Out:    (nothing yet)
Later:  (nothing yet)

Q1 - The ask: How much of your time is this? A web dashboard with charts is
a week. A script that prints a table is an hour.
What I'd want to hear: An hour. Nobody needs charts for a list of twelve names.

Q2 - The cost of never: If you never build it, what goes wrong?
What I'd want to hear: Nothing. You stay curious, which is free.

Q3 - The smallest version: Would a one-off count of last month's logs tell you
whether a dashboard is worth building?
What I'd want to hear: Yes, and it will probably tell you it isn't.
```

You answer: a week, nothing goes wrong, and the dashboard is the smallest version. The verdict:

```text
That's a no from me.

A week of your time to satisfy curiosity, when the answer is one search away.
You told me nothing breaks without it, and you turned down the hour-long
version. That isn't a product, it's a hobby with a deadline.

And for that reason, I'm out.

Scope doc: ~/.claude/scoping/2026-11-23-skill-usage-dashboard.md
```

## How it works

The first round is the pitch. The dragon asks for the ask (how much of your time the idea costs), what happens if it never gets done and what the smallest useful version is, and searches for something that already does it. The idea starts at drop, and your answers have to argue it up.

After the pitch the dragon makes a first call. If it is park or drop, that is the verdict: the dragon is out, and you get the scope doc. You can still overrule it and ask to be grilled. Otherwise it grills you in rounds of up to three questions, hardest first. Each comes with the answer the dragon wants to hear, which you can accept with "yes".

Every round shows the scope so far, in three lists, just before its questions:

- In: what gets built
- Out: what is excluded, and why
- Later: what is deferred, and what would bring it back

At the end you get a final verdict:

- do: worth it as scoped ("I'm in.")
- shrink: worth it smaller, with the items to cut named ("I'll put my time in, but only if X goes.")
- park: worth it, not now ("Come back when you've got Y.")
- drop: not worth it ("And for that reason, I'm out.")

The verdict opens in plain words, the reasons follow, and the catchphrase closes it. A drop always ends on "I'm out." If the final verdict is softer than the first call, the dragon names the answer that changed its mind. You can overrule it.

The dragon stays in character for the whole session and mocks the idea, not you. The facts in its questions stay exact, and the scope lists are written plainly, so the act never gets in the way of answering.

## What it changes

- Writes a short scope doc in plain prose: in the plans folder your instructions name when the idea is about the current repo, otherwise in `~/.claude/scoping/`. An earlier doc for the same idea is left as it is; the new one links to it.
- Files each Later item in your personal todo list or your team's tracker, as your instructions name them. It shows you the whole batch first and files only what you confirm.

## Requirements and limits

Filing Later items needs a tool that can create cards or tickets in your todo list and tracker, and instructions that say which ones to use. Without them, the Later items stay in the scope doc.

The verdict rests on rough cost estimates (hours, days or weeks) and on your answers. It is a judgement to argue with, not a measurement.
