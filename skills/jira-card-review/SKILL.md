---
name: jira-card-review
description: Review Jira cards against the code and say whether each one is ready to pick up. Read-only until I approve an edit.
argument-hint: <KEY ...> | <EPIC-KEY> | <JQL>
disable-model-invocation: true
---

Review the Jira cards in `$ARGUMENTS` and give each one a verdict: can someone pick it up today and know what done looks like?

A card is ready when it passes three tests: its blockers are defined, its outcomes are defined, and it makes sense against the code as it stands. A card says what and why. How is the implementer's choice, so judge a card only on those three tests. A card with no design link, no named files and no implementation steps can still be ready.

Jira, git and the local checkouts stay read-only until step 6.

## 1. Collect the cards

- One or more keys: those cards.
- An epic or feature key: its children.
- JQL: the cards it returns.

Leave out cards that are Done. Read the whole set in one call.

Done when you have the list of keys. Open the report with the number of cards.

With more than 3 cards, give each card to its own subagent, all started in one message. Each subagent gets the card key and the path to this file, runs steps 2 to 4, and returns its step 5 entry. Then you write the step 5 report.

## 2. Read the card

Read the description, the acceptance criteria, every comment, the links, the parent, the reporter and the assignee. A comment that conflicts with the description is the later decision, so it wins.

Fetch the status of every card this one names, linked or only mentioned in the text. A card described without a key ("a separate SDK card") is one to find by search. For each named card that is not Done, read its description too, so you know what it will provide.

Done when you can state in two sentences what changes and how someone proves it, or you can name the sentence that stops you.

## 3. Find the repo

Use the first source that answers:

1. the card names the repo
2. the merged PRs of the parent's other children, searched across the organisation (`gh search prs <SIBLING-KEY> --owner <org> --merged`)
3. the identifiers and paths on the card, searched for in the local checkouts beside this repo

For each path the card cites, check that it exists in that repo. A path that only exists in another repo is a finding, and so is a card that leaves the repo for the reader to guess.

Done when you have the repo and the evidence for it, or a finding that the card's repo is unknown.

## 4. Check the card against the code

A card goes stale when earlier cards ship part of its scope. Read the code, its tests and its stories, and give each acceptance item one mark:

- open: the code does not do this yet
- met: the code already does this, with `file:line`
- part met: say which part is left
- unclear: the item names no behaviour to look for

Reading is enough for a mark. Say so when a mark rests on behaviour you read but did not run.

Then check every statement the card makes about how the code behaves today, wherever it sits on the card: the reason, a How section, a number, a name. Record each one the code contradicts. The card is free to leave the how out, but what it does say must be true.

For a dependency from another repo, the version this repo pins is the truth. Read that version, and name the version you read. When the card needs behaviour that the pinned version does not have, check whether that behaviour is merged upstream. Merged and unreleased is a note for the report, because a release needs no card. A fault is behaviour that is not merged and has no linked card.

Done when every acceptance item has a mark and every met or part met mark has a `file:line`.

## 5. Judge and report

Put each finding under one of the three tests.

| Test | Passes when | Typical faults |
| --- | --- | --- |
| Blockers | every dependency is a Jira issue link ("is blocked by") to a card that is Done, and every piece of work the card needs has a card | a dependency with no key, a dependency named in the text with no issue link, a dependency the code shows and the card leaves out, a linked card that is not Done, a blocker link the card no longer needs, needed work that no card covers, a question for another team with nobody named to answer it |
| Outcomes | each acceptance item is a result someone can observe, and is still open | an item marked met, an item marked unclear ("unit test coverage"), an item two readers would check differently, a stated behaviour with no acceptance item |
| Sense | every statement about the code is true today, the card agrees with itself, and the repo is named | a stale reason, a path from another repo, a number that differs from the code |

Check the issue links first, because they matter most. The team picks its next card from the links: Ready column, no open blockers, then priority. A missing link lets a blocked card look free, and a stale link hides a free card. Check that every card the description names is linked, with the right direction and type, and the description's own summary of its links agrees with them.

The team that owns the card's Jira project owns the card and every decision on it, so a missing owner is no fault. Report an open decision only when it changes what gets built, or when it needs an answer from another team.

Give the card one verdict. When two apply, the earlier one in this list wins:

- blocked: a dependency is not Done, or a decision that changes what gets built is still open
- fix first: every fault can be fixed from evidence you already hold, so a rewrite makes it ready
- ready: all three tests pass

Report each card as:

1. key and title, repo with its evidence, verdict
2. a table of the acceptance items with their marks and evidence
3. the faults grouped by test, each with its evidence
4. for a fix first card, the rewritten description
5. for a blocked card, the question, and who can answer it (the reporter, or the owner of the card it waits on). When part of the scope can start today, say which part, and suggest the split.

With more than one card, open with a table of key, title, repo and verdict, with blocked cards first, then fix first, then ready.

## 6. Edit the card on a yes

Ask which fix first cards to update. Edit those cards only.

The rewrite keeps the author's headings and voice, and changes the least it can:

- name the repo in the first line
- make the reason true today
- list the scope that earlier cards already shipped, so nobody builds it twice
- name every dependency by key and status, as a summary of the issue links
- keep only open acceptance items, each one an observable result
- cut implementation steps down to a pointer at the reference
- end with one line giving the date and the reason for the update

When the code and the card disagree on a value, the code wins unless the user says otherwise.

Jira's issue links are the record of how cards connect, and the description only summarises them. For each dependency, add an "is blocked by" link to the card when it is missing (find the link type name with `getIssueLinkTypes`). Use "relates to" for a card that is connected but does not block.

Send the description as ADF when it holds checkboxes. Markdown turns a task list into plain bullets.

Read the card back after the edit. Done when the description matches what you sent, the checkboxes are still checkboxes, and every dependency shows in the card's issue links.
