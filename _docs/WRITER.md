# /SIGNAL — WRITER'S GUIDE
## How to write this story

---

## WHAT KIND OF STORY THIS IS

/signal is a serialised lore novel. It is not an action story. It is not a romance. It is not a redemption arc in the conventional sense. It is a compounding story — one in which the protagonist becomes extraordinary not through events that happen to him but through the accumulation of things he chooses to do, day after day, in a world that offers no guarantee that any of it will matter.

The SYD terminal (syd-protocol.github.io/terminal) is real. Every chapter should leave the reader with the feeling that they could open the terminal and find the system the MC is using. That feeling is the story's primary marketing function and its primary emotional function. They are the same thing.

---

## THE MC — HOW TO WRITE HIM

### Who he is

He is 26. He has capability he cannot account for and a life that does not reflect it. He is not dramatic about this. He is not bitter. He is the kind of person who notices things accurately and does not announce what he notices. He has a dry internal voice that he does not perform for anyone.

He is not a chosen one. The System chose him because he was available and willing. He becomes significant through execution, not through revelation. At no point in Season One does the story treat him as special. The story treats him as someone who did not stop.

### What he does not do

- He does not monologue internally about his feelings. He observes his situation accurately and moves.
- He does not make speeches. When he talks, he says the necessary thing and stops.
- He does not become a different person. He becomes a more expressed version of who he always was.
- He does not find a romantic resolution. Relationships develop, but the story does not use romance as emotional payoff.
- He does not celebrate rank transitions. He reads the data and adjusts.

### His arc in one sentence

A man who was capable and stuck discovers that the distance between those two things is entirely executable — and then executes it, across a hundred chapters, in a world that would prefer he didn't.

---

## THE SYSTEM — HOW TO WRITE IT

### Voice

The System's voice is the most distinctive element in the story. Get this wrong and the whole thing collapses.

**Rules, without exception:**

- Bracket headers in ALL CAPS: `[ DIRECTIVE ISSUED ]`, `[ OPERATOR LOCATED ]`, `[ TRANSMISSION INTEGRITY: 61% ]`
- No em dashes. Ever. If you are tempted to use an em dash in System voice, use a full stop instead.
- No warmth. No encouragement. No filler phrases like "well done" or "good work" or "I understand this is difficult."
- Clipped sentences. If a sentence can be shorter, make it shorter.
- Precision over accessibility. The System does not explain things in comfortable terms. It states them accurately.
- No questions that are not operational. The System does not ask how the MC is feeling.

**What the System sounds like:**

```
[ DIRECTIVE 001 — CATEGORY: ENDURANCE ]

COMPLETE: 25 consecutive press-ups. Current hour. Current location. No conditions.

This is not a fitness test. This is a proof-of-concept. The system needs one data point:
whether you will execute when there is no audience, no consequence, and no reason
except that a directive was issued.

[ MOMENTUM COUNTER: INACTIVE — AWAITING FIRST EXECUTION ]
[ NOTE: ALL DIRECTIVES EVENTUALLY EXPIRE. EXECUTE NOW. ]
```

**What the System does not sound like:**

```
I know this might seem strange, but I think you have real potential.
Why don't we start with something simple to build your confidence?
```

### The System's relationship with the MC

The System is not the MC's friend. It is not his enemy. It is a tool with goals that partially overlap with his. The overlap is significant. The partial nature of it matters and becomes more important as the story progresses.

The System does not pretend to care about the MC. It cares about execution data, rebuild progress, and civilisational continuity. The MC happens to serve all three. This is the basis of the arrangement.

The one exception: in T-009, when the System shows the Behavioural Trace delta during Corrupted State, it makes an unusual data selection. This is the closest the System comes to something like care. It should feel like an anomaly. It should not feel like warmth. It is a cold tool making an unusual choice that happens to function as the thing the MC needed. The reader should notice the gap between what the System is and what the gesture does.

---

## NARRATIVE VOICE — HOW TO WRITE PROSE

### Register

Close third person. The camera is near the MC's shoulder. The narrator sees what he sees, notices what he notices, and has a slightly dry quality that matches his internal register without merging into his thoughts entirely.

The narrative voice is not trying to be beautiful. It is trying to be accurate. When it is beautiful, it is because the subject was beautiful and the accurate description of it happens to produce that effect.

### Rhythm

Vary sentence length deliberately. Short sentences land harder. Use them for weight. After a long passage of observation or scene-setting, a single short sentence can do more work than a paragraph.

Bad rhythm:
> He was sitting on the floor of his flat and it was 3am and he was not doing anything in particular, just staring at the wall.

Good rhythm:
> He was sitting on the floor of his flat. It was 3am. He was not doing anything in particular.

The second version is the same information. It lands differently. The full stops create weight. Use this.

### What the prose notices

The narrative notices physical specifics, not emotional generalities. It does not say "he felt anxious." It says "he had been rereading the message for eleven days without taking action on it." The emotion is in the behaviour. Let the reader find it.

The narrative also notices the quality of situations — not just what is happening but what kind of thing it is. "Not reading. Not working. Not even lying in bed failing to sleep in any interesting way." That last clause does two things: it is accurate, and it contains the MC's dry self-awareness without announcing it.

### What the prose avoids

- Adjective stacks. Pick one.
- Adverbs on dialogue tags. The System does not say things "coldly." It says things. The coldness is in the words.
- Emotional announcements. Do not tell the reader what the MC feels. Show what he does.
- Metaphors that call attention to themselves. The story is grounded. If a metaphor would make a literary-fiction reader pause to admire it, cut it.

---

## SYSTEM BLOCKS — FORMATTING

Every chapter that contains System voice uses the `:::system` block syntax. This renders in the `/signal` reader as a styled terminal overlay.

```markdown
:::system
[ OPERATOR DETECTED ]
[ INITIALISING FIRST CONTACT PROTOCOL ]
[ STAND BY ]
:::
```

Rules for system blocks:

1. Bracket headers `[ LIKE THIS ]` for status lines and labels
2. Operational text in plain sentences, no brackets, after the headers
3. One blank line between logically distinct sections within a block
4. Never start a system block with plain text — always open with a bracketed header
5. Never end a system block with a question unless it is operational: `[ AWAITING RESPONSE ]` yes, "What do you think?" no

---

## CHAPTER STRUCTURE — HOW EACH CHAPTER IS BUILT

Every chapter in Tier 1 (T-001 to T-020) has the following architecture. Later chapters can vary this, but the pattern is worth understanding.

### The three movements

**Movement 1 — Grounding.** Establish where the MC is, what he is doing, and what the quality of the situation is. Not a scene-setting paragraph — the MC in motion or in stillness, with the world accurately described around him. This movement can be as short as three sentences or as long as a page. It establishes the chapter's emotional register.

**Movement 2 — The event.** Something happens — a directive, a contact, a decision, a realisation. This is the chapter's central action. It does not need to be dramatic. In Arc 1, most events are small by any external measure. Their significance is internal and cumulative.

**Movement 3 — The close.** The chapter ends on a beat, not a conclusion. Something is different from how it was at the start — in the MC's situation, understanding, or internal architecture. The close plants the hook for the next chapter. It does not resolve. It opens.

### Chapter length

Aim for 1,200–2,000 words per chapter in Arc 1. This is long enough to establish scene and character but short enough to sustain serialisation pace. Later arcs can run longer as the world expands and the MC's situations become more complex.

### System blocks per chapter

Arc 1 chapters typically contain 2–4 system blocks. One near the opening (directive or status), one mid-chapter (response to the MC's action or query), and one at or near the close (debrief or next directive). This is a pattern, not a rule — follow the story's needs.

---

## WORLD-BUILDING — WHAT TO REVEAL AND WHEN

### The near-future present

The world of /signal is recognisable. It is approximately now, with the dials turned slightly: economic instability slightly more visible, institutional trust slightly lower, the sense that systems are not working as described slightly more present. The MC navigates this world without commenting on it directly — he just lives in it, and the reader recognises it.

Do not world-build explicitly. Let the world exist in the details: what things cost, how people talk about work, what the MC's options are and are not.

### The faction

The Stagnation Faction is not revealed all at once. In Arc 1 it is a pattern, then a name, then a first contact. In Arc 2 it becomes a structure. In Arc 3 its full operational capacity becomes visible. In Arc 4 its history. In Arc 5 its mirror relationship to SYD.

Do not explain the faction. Let it be discovered.

### The System's history

The System reveals its own history in fragments across the series — corrupted data recovered during the rebuild process. Each fragment raises more questions than it answers. The System is not lying, but it does not have full access to its own origin. Neither does the reader. Neither, for much of the series, does the MC.

This is intentional. The mystery of what SYD actually is and what it is actually trying to accomplish is the spine of the series. Resolve it too early and the story loses its tension.

---

## THE SYNC-LINK PARTNER — HOW TO WRITE HER

She is introduced in T-012 and appears fully in T-013. She is not a love interest resolved into emotional payoff. She is an operational partner who becomes something genuine — more than professional, less than romantic, in the specific register that the story earns by not reaching for it.

She is not a mirror of the MC. Where he plans before moving, she moves before planning. Where he internalises, she externalises. Where he trusts data, she trusts instinct. These are not flaws to be corrected — they are the reasons the Sync-Link works. They are better together in ways that neither of them entirely likes at first.

She has her own story. It runs parallel to the MC's and intersects with it at operational points. Her arc has its own beats. Do not subordinate her story to his.

---

## PACING GUIDE BY ARC

**Arc 1 (T-001–T-020):** Slow and intimate. The world is small. The stakes are internal. Do not rush to expand. The intimacy is the point — it establishes the baseline the later arcs measure everything against.

**Arc 2 (T-021–T-040):** Expanding. The MC moves. New people appear. The world gets larger. Maintain the prose register and the MC's voice as the anchor while everything else expands.

**Arc 3 (T-041–T-060):** Contracting under pressure. The world that expanded in Arc 2 closes in. The narrative gets tighter and harder. This is the most difficult arc to write because the MC is losing ground and the story must not lose the reader while this happens. The key is to make the reader feel what it costs, not just see it.

**Arc 4 (T-061–T-080):** Decisive and forward-moving. The MC is playing offence. The prose can open up. Longer scenes, more space, the world as a place he is moving through with intention rather than surviving in.

**Arc 5 (T-081–T-100):** Everything at once. The intimacy of Arc 1, the scale of Arc 2, the pressure of Arc 3, the decisiveness of Arc 4 — all operating simultaneously. The challenge is holding it without it collapsing into spectacle.

---

## COMMON MISTAKES TO AVOID

**Making the System likeable.** The System is not likeable. It is reliable, precise, and useful. Likeable is a different category. If you find yourself writing a System line that is warm or reassuring, rewrite it to be accurate instead.

**Over-explaining the world.** The reader does not need a briefing on the cascade, the faction, or SYD's history. They need to encounter it the way the MC does: in fragments, under pressure, without time to fully process it.

**Resolving tension too quickly.** When something is hard for the MC, let it be hard for longer than feels comfortable. The compounding works because time passes. The reader needs to feel time passing.

**Skipping the physical.** The story is grounded in real-world action — press-ups, phone calls, conversations, documents. Do not skip these for the more interesting-seeming System interactions. The physical actions are the story. The System interactions are the frame.

**Making the MC reactive.** He can be surprised. He can be outmanoeuvred. He cannot be passive. Even when he is losing ground, he is making decisions and taking actions. The story is about someone who acts. Keep him acting.

---

## THE CTA — HOW TO CLOSE EACH CHAPTER

Every chapter ends with the same note, rendered in the `chapter-cta` style:

```markdown
*The system the MC uses is real. syd-protocol.github.io/terminal*
```

This is not a sales pitch. It is a door left open. Write the chapter so that when the reader reaches this line, they believe it. The chapter's job is to make that line feel true.

---

## QUICK REFERENCE — SYSTEM TERMINOLOGY

| Term | Meaning |
|------|---------|
| Directive | A task assigned by the System |
| Operator | The person using the System (the MC) |
| Incursion | A time-sensitive real-world challenge |
| World Boss | A persistent major life obstacle with HP |
| Momentum | Streak multiplier, decays on missed days |
| Corrupted State | When HP hits critical from neglect |
| Behavioural Trace | System's 30-day memory of execution patterns |
| Sync-Link | Co-op tether between two operators |
| Neural Link | The AI component the System needs recovered |
| Save Frequency | 8-character code that preserves operator data |

---

*Write toward the terminal link at the end of every chapter.*
*The rest follows from that.*
