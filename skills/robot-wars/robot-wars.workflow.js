export const meta = {
  name: 'robot-wars',
  description: 'Two debaters argue assigned sides of a motion in strict turns, then a judge scores each run',
  phases: [
    {title: 'Debate', detail: 'openings, rebuttals and closings, A then B every round'},
    {title: 'Judge', detail: 'one judge per run scores the transcript'},
    {title: 'Stress test', detail: "one premise of each run's winning case is altered and the conclusion re-derived"},
  ],
}

const input = args || {}
if (!input.motion || !input.context) throw new Error('args.motion and args.context are required')

const quick = input.mode === 'quick'
const RUNS = quick ? [{A: 'PRO', B: 'CON'}] : [{A: 'PRO', B: 'CON'}, {A: 'CON', B: 'PRO'}]
const REBUTTALS = input.rebuttals ?? (quick ? 1 : 2)
// Every agent runs on the session's model unless the caller names one.
const MODEL_OPTS = input.model ? {model: input.model} : {}
const LIMITS = {opening: 400, rebuttal: 300, closing: 150, ...(input.limits || {})}
const SIDES = {
  PRO: input.pro || 'for the motion',
  CON: input.con || 'against the motion',
}
const CRITERIA = input.criteria || [
  {key: 'evidence', question: 'Are the claims sourced and correct?'},
  {key: 'relevance', question: 'Do the arguments address the context and its constraints?'},
  {key: 'rebuttal', question: "Did they answer the opponent's strongest points?"},
  {key: 'practicality', question: 'Would the position hold up when a team builds and maintains it?'},
  {
    key: 'fragility',
    question:
      'Does the conclusion still hold if one premise the context does not state as fact turns out wrong, or a fact the context does not rule out is added? Name the premise that breaks it, or say none does.',
  },
]

const words = (text) => text.trim().split(/\s+/).length

const TURN_RULES = {
  opening:
    'This is your opening. You have not seen your opponent\'s opening. Set out your strongest case.',
  rebuttal:
    "This is a rebuttal. Answer your opponent's strongest point first, then their next strongest. Where they are right, concede it and contain it: show the cost is bounded or does not decide the motion.",
  closing:
    'This is your closing. Make no new arguments. Say why your side wins on the points already made.',
}

function debaterPrompt(label, side, kind, transcript) {
  return `You are debater ${label} in a structured debate. Your opponent is debater ${label === 'A' ? 'B' : 'A'}.

Motion: "${input.motion}"
You argue ${side}: ${SIDES[side]}.

Context, shared word for word with your opponent and the judge:
${input.context}

Rules:
- Argue your side only, even if you would personally disagree. Conceding the motion loses the debate.
- Every factual claim names a source the reader can find and check: a primary document such as a spec, official docs, a patent or a bug tracker, or a published study or survey. You can search the web. A claim you cannot source must be labelled as your judgement.
- Claim only what you can defend. An overstatement your opponent disproves costs you more than a modest claim would have.
- Say a point is unanswered only if your opponent has had a turn since you raised it.
- ${TURN_RULES[kind]}
- At most ${LIMITS[kind]} words.

Return only the speech, in plain markdown, with no title line. The transcript adds headings.

${transcript ? `Transcript so far:\n\n${transcript}` : 'No speeches yet.'}`
}

function judgePrompt(transcript) {
  return `You are the judge of a structured debate between debater A and debater B.

Motion: "${input.motion}"

Context both debaters were given:
${input.context}

Score how well each debater argued, not which side you believe is right. Ignore length and speaking order. Penalise any factual claim with no source, and any claim you know to be wrong, including wrong claims the opponent missed.

Where the debaters contradict each other on a fact, check it yourself: read the cited source or file, or search the web. Score on what you find, not on who sounded surer. Check at most 3 disputes, the ones most likely to decide the debate. List each in fact_checks as the disputed claim, then what you found. Leave it empty if no fact was disputed.

Score each debater from 1 to 10 on each criterion, with reasons, before you pick a winner:
${CRITERIA.map((c) => `- ${c.key}: ${c.question}`).join('\n')}

For each debater, list in fragile_premises each premise of their case that breaks their conclusion if it turns out wrong. Treat facts the context states as fixed. Leave it empty if none does.

For each debater, list in surviving_arguments each argument still standing at the end: not refuted by the opponent, not withdrawn, and not disproved by your fact checks. In depends_on, give the premise it needs that the context does not state, or "the context" if it rests only on stated facts.

List the moments that decided the debate. Pick "draw" only when neither debater was ahead overall.

Transcript:

${transcript}`
}

function stressPrompt(label, side, speeches) {
  return `You are stress-testing the winning case in a structured debate. Debater ${label} argued ${side}: ${SIDES[side]}.

Motion: "${input.motion}"

Context both debaters were given:
${input.context}

1. Write out the numbered premise chain that debater ${label}'s conclusion rests on, from the first fact to the conclusion. Take it from their speeches below.
2. Pick the premise most likely to be wrong in practice: an estimate, an assumption, or a claim the context does not state.
3. Write a one-sentence alteration that adds a fact the context does not rule out. It must not contradict or remove anything the context states as fact.
4. Re-derive the conclusion from the chain with that alteration, and say whether debater ${label}'s conclusion still holds.

If every premise is a fact the context states, and no addition consistent with the context changes the conclusion, say so and set conclusion_holds to true. Test the logic of the chain, not the quality of the speeches.

Debater ${label}'s speeches:

${speeches}`
}

const scoreProps = Object.fromEntries(CRITERIA.map((c) => [c.key, {type: 'integer', minimum: 1, maximum: 10}]))
const SCORE = {
  type: 'object',
  properties: {
    ...scoreProps,
    reasons: {type: 'string'},
    flagged_claims: {type: 'array', items: {type: 'string'}},
    fragile_premises: {type: 'array', items: {type: 'string'}},
    surviving_arguments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {argument: {type: 'string'}, depends_on: {type: 'string'}},
        required: ['argument', 'depends_on'],
      },
    },
  },
  required: [...CRITERIA.map((c) => c.key), 'reasons', 'flagged_claims', 'fragile_premises', 'surviving_arguments'],
}
const VERDICT = {
  type: 'object',
  properties: {
    scores: {type: 'object', properties: {A: SCORE, B: SCORE}, required: ['A', 'B']},
    fact_checks: {type: 'array', items: {type: 'string'}},
    deciding_moments: {type: 'array', items: {type: 'string'}},
    winner: {type: 'string', enum: ['A', 'B', 'draw']},
    reason: {type: 'string'},
  },
  required: ['scores', 'fact_checks', 'deciding_moments', 'winner', 'reason'],
}
const STRESS = {
  type: 'object',
  properties: {
    premise: {type: 'string'},
    alteration: {type: 'string'},
    conclusion_holds: {type: 'boolean'},
    reason: {type: 'string'},
  },
  required: ['premise', 'alteration', 'conclusion_holds', 'reason'],
}

const TITLES = {opening: 'Opening', rebuttal: 'Rebuttal', closing: 'Closing'}

async function runDebate(sides, runIndex) {
  const run = runIndex + 1
  const speeches = []
  const transcript = () => speeches.map((s) => `### ${s.title}\n\n${s.text}`).join('\n\n')

  async function speak(label, kind, round, seen) {
    const tag = `run ${run} ${kind}${round ? ` ${round}` : ''} ${label}`
    let text = await agent(debaterPrompt(label, sides[label], kind, seen), {phase: 'Debate', label: tag, ...MODEL_OPTS})
    if (text && words(text) > LIMITS[kind] * 1.1) {
      const cut = await agent(
        `Cut this debate speech to at most ${LIMITS[kind]} words. Keep its strongest points and every source. Return only the speech.\n\n${text}`,
        {phase: 'Debate', label: `${tag} (cut)`, ...MODEL_OPTS},
      )
      if (cut) text = cut
    }
    const title = `${TITLES[kind]}${round ? ` ${round}` : ''} - debater ${label}`
    return {title, label, kind, text: text ? text.trim() : '(no speech: the debater failed)'}
  }

  // Openings are written blind, so both start at once.
  const openings = await parallel(['A', 'B'].map((label) => () => speak(label, 'opening', 0, '')))
  speeches.push(
    ...openings.map((s, i) => s || {title: `Opening - debater ${'AB'[i]}`, label: 'AB'[i], kind: 'opening', text: '(no speech)'}),
  )

  for (let round = 1; round <= REBUTTALS; round++) {
    for (const label of ['A', 'B']) speeches.push(await speak(label, 'rebuttal', round, transcript()))
  }
  for (const label of ['A', 'B']) speeches.push(await speak(label, 'closing', 0, transcript()))

  const verdict = await agent(judgePrompt(transcript()), {phase: 'Judge', label: `run ${run} judge`, schema: VERDICT, ...MODEL_OPTS})
  const winningSide = !verdict ? 'none' : verdict.winner === 'draw' ? 'draw' : sides[verdict.winner]
  log(`Run ${run}: ${winningSide === 'draw' || winningSide === 'none' ? winningSide : `${winningSide} wins`}`)

  // The judge never sees the stress test, so the two stay independent checks.
  let stress = null
  if (verdict && verdict.winner !== 'draw') {
    const winner = verdict.winner
    const own = speeches
      .filter((s) => s.label === winner)
      .map((s) => `### ${s.title}\n\n${s.text}`)
      .join('\n\n')
    stress = await agent(stressPrompt(winner, sides[winner], own), {
      phase: 'Stress test',
      label: `run ${run} stress test`,
      schema: STRESS,
      ...MODEL_OPTS,
    })
    if (stress) log(`Run ${run} stress test: conclusion ${stress.conclusion_holds ? 'holds' : 'breaks'}`)
  }
  return {run, sides, transcript: transcript(), verdict, winningSide, stress}
}

function stressMarkdown(r) {
  if (!r.verdict || r.verdict.winner === 'draw') return 'Not run: the judge picked no winner.'
  if (!r.stress) return 'Not run: the stress test failed.'
  const lines = [
    `Tested: debater ${r.verdict.winner} (${r.winningSide})`,
    `Premise: ${r.stress.premise}`,
    `Alteration: ${r.stress.alteration}`,
    `Conclusion holds: ${r.stress.conclusion_holds ? 'yes' : 'no'}`,
    `Reason: ${r.stress.reason}`,
  ]
  const score = r.verdict.scores[r.verdict.winner].fragility
  const holds = r.stress.conclusion_holds
  if (score !== undefined && ((score >= 7 && !holds) || (score <= 4 && holds))) {
    lines.push(
      `The judge and the stress test disagree: the judge scored the winner ${score}/10 for fragility, but the stress test found the conclusion ${holds ? 'holds' : 'breaks'}.`,
    )
  }
  return lines.join('\n\n')
}

const total = (score) => CRITERIA.reduce((sum, c) => sum + (score[c.key] || 0), 0)

// One block per run for the top of the file, so the reader gets the answer before the transcripts.
function summaryMarkdown(r) {
  const result = r.winningSide === 'none' ? 'no verdict' : r.winningSide === 'draw' ? 'draw' : `${r.winningSide} wins`
  const head = `### Run ${r.run}: ${result}`
  if (!r.verdict) return `${head}\n\nThe judge failed, so this run has no verdict.`
  const {A, B} = r.verdict.scores
  const checks = r.verdict.fact_checks || []
  const stress = r.stress
    ? `Stress test: the conclusion ${r.stress.conclusion_holds ? 'holds' : 'breaks'} under this alteration. ${r.stress.alteration}`
    : `Stress test: ${stressMarkdown(r)}`
  return [
    head,
    `Debater A (${r.sides.A}) scored ${total(A)}. Debater B (${r.sides.B}) scored ${total(B)}.`,
    r.verdict.reason,
    `Deciding moments:\n\n${r.verdict.deciding_moments.map((m) => `- ${m}`).join('\n')}`,
    ...(checks.length ? [`Facts the judge checked:\n\n${checks.map((c) => `- ${c}`).join('\n')}`] : []),
    stress,
  ].join('\n\n')
}

// Grouped by side, not debater label, so both runs' lists for one side sit together.
function survivingMarkdown() {
  const bySide = {PRO: [], CON: []}
  for (const r of runs) {
    if (!r.verdict) continue
    for (const label of ['A', 'B']) {
      for (const s of r.verdict.scores[label].surviving_arguments || []) {
        bySide[r.sides[label]].push(`- ${s.argument}\n  - depends on: ${s.depends_on} (run ${r.run})`)
      }
    }
  }
  return ['PRO', 'CON']
    .map((side) => `### ${side}\n\n${bySide[side].length ? bySide[side].join('\n') : 'No argument survived.'}`)
    .join('\n\n')
}

const runs = (await parallel(RUNS.map((sides, i) => () => runDebate(sides, i)))).filter(Boolean)

const results = runs.map((r) => r.winningSide)
let overall
if (runs.length < RUNS.length || results.includes('none')) overall = 'incomplete'
else if (quick) overall = results[0]
else overall = results[0] === results[1] ? results[0] : 'draw'
// Only a side that won every run is flagged, so draws keep their meaning.
const fragile =
  (overall === 'PRO' || overall === 'CON') && runs.some((r) => r.stress && !r.stress.conclusion_holds)

const markdown = [
  `# Debate: ${input.motion}`,
  `Overall result: ${overall}${fragile ? ' (won, but fragile)' : ''}${quick && overall !== 'incomplete' ? ' (quick mode: one run, so speaking order is not controlled)' : ''}`,
  `Model: ${input.model || 'session model'}`,
  `## Verdict\n\n${runs.map(summaryMarkdown).join('\n\n')}`,
  `## Surviving arguments\n\n${survivingMarkdown()}`,
  `## Context\n\n${input.context}`,
  `## Sides\n\n- PRO: ${SIDES.PRO}\n- CON: ${SIDES.CON}`,
  ...runs.map((r) =>
    [
      `## Run ${r.run} (A argues ${r.sides.A}, B argues ${r.sides.B})`,
      r.transcript,
      `## Run ${r.run} verdict\n\nWinner: ${r.winningSide}`,
      '```json\n' + JSON.stringify(r.verdict, null, 2) + '\n```',
      `## Run ${r.run} stress test\n\n${stressMarkdown(r)}`,
    ].join('\n\n'),
  ),
].join('\n\n')

return {
  overall,
  fragile,
  model: input.model || 'session model',
  runs: runs.map((r) => ({run: r.run, sides: r.sides, winningSide: r.winningSide, verdict: r.verdict, stress: r.stress})),
  markdown,
}
