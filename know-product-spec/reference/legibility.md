# Talking to a human

Three situations, and the rules are few and hard. In the first two the reader is the document's author deciding what to do next, not another agent. In the third it is a builder who was not in the room.

## Questions

- The ask is the first sentence, and it ends in a question mark.
- One decision per question. Two decisions are two questions.
- Context goes in bullets under the ask, never in prose before it.
- A statement is not a question. To confirm a statement, ask "Is this right?" and then state it.
- Before sending, test it: could the author answer without opening the document? If not, whatever is missing goes in the bullets.

## Reports

- The verdict is the first line. The single next step, with its exact invocation, is the second.
- Real headings underneath, one idea per sentence, and every instrument term glossed at first use.
- If a reader could finish the report unsure whether the thing is ready, the report failed, whatever else it contains.

## Work-item prose

The first two sections are about talking to the author. This one is about the work items `decompose` writes and `file` transfers, whose reader is a builder holding only the item.

**The bar: someone should read a work item and get it, not kind of get it.** The longer form names what has to be in there: the problem, the value, the expected behavior, and the constraints, so that a capable non-author understands it in one read.

**Short sentences. Active voice. Drop the qualifiers. Say the thing.** The failure this prevents is one readers name on their own, unprompted, as reading like legal copy: formal, dense, overly technical-sounding language, long sentences, lots of qualifiers, passive voice, and exact-but-clunky phrasing that makes it hard to read quickly.

Three sentences that look like contract and are not:

| Cut | Why |
|---|---|
| A value "is not a pure rename: its meaning broadens from saved items to in-progress plus saved plus earned" | Defines by contrast with the old state. The builder needs to know what the value holds now, which a table answers. |
| "This corrects a standing rule violation. The live value already breaks the rule that ..." | Justifies the change instead of stating it. Nobody building needs the argument. |
| "The increment's own documents call this property `view`; that name is not used anywhere" | History about other documents, not about the work. |

**The test: if a sentence explains why the contract is what it is, or what it used to be, it is not contract.** Cut it, or put it in a comment.

**"No implementation detail" taken literally strips things the item needs.** These are constraints, and they stay:

- "Filtering runs over the loaded set. Changing a filter never refetches."
- "The failure logs on the backend and never surfaces to the user."
- "The start rail renders last, so a page that has not finished loading never shows a start button."

This is reasoning about a consequence, and it goes:

- "Anything keyed on the old values returns zero rows the moment they change, and it returns zero rows without erroring. A chart that reads empty is indistinguishable from a chart that reads no activity."

A constraint is buildable and testable. Reasoning about what a constraint implies is the author thinking out loud, and it is what reads as legal copy.

**Define internal shorthand the first time it appears, in a clause, not a glossary.** Every document runs on terms a builder outside it will not know. A work item is self-contained by rule, so a builder builds from it rather than from the document it came from, and that only works if the item's own vocabulary is legible to someone who never read the document. "Banked, meaning a benefit the user already holds" costs six words and removes a lookup.

**Banned unless they carry a measurable meaning:** robust, seamless, enhanced, intuitive, scalable, leverage, streamline.

| Write this | Not this |
|---|---|
| "Users can save a draft and return later." | "Implement an intuitive and scalable draft persistence enhancement." |
| "This reduces duplicate work for support agents." | "Optimize workflow efficiency through better system behavior." |
| "The API returns a 409 when the record already exists." | "Robust conflict handling." |

**A process word that is also a product state gets a different word.** "Collection reconciliation and freeze" meant a schema contract lock. A room read it as a promise about the product, that a published record can never change again, and spent ten minutes there. The test: could a reader take this as something the product does to a record the user can see? Then rename it. This is the expensive cousin of the banned adjectives above. An empty adjective wastes a reader's second; this one sends a room down the wrong path and the item looks fine the whole time.

**Say when a reference is unverified.** An item that names an event, an endpoint, a field, or an existing surface the document did not establish says so, in the word **Unverified**, with what would confirm it. A flag a reader can calibrate is worth more than a confident sentence they have to go and check anyway, and worth far more than the reference being dropped for being uncertain.

**A work item never describes itself.** No count of its own list, no characterization of the size of the effort, no sentence pre-empting an objection nobody raised. A list counts itself, and the sentence above it goes wrong the moment the list changes.
