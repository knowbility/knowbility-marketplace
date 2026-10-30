# Writing text into a tracker field

For the two skills that put text into a project tracker: `file`, which creates
descriptions, and `groom`, which edits them. These are rules about the tracker's
own text handling, not about language. The language rules are in
`legibility.md`.

## Some characters are markup even inside a code span

Several trackers read `{` as macro syntax and `[` as link syntax, and they do it
inside inline code spans as well as in prose. A description carrying an inline
code span with braces comes back with the paragraph split at the brace and a
fragment stranded outside it. Square brackets come back wrapped in an error
span.

**The echoed text is always correct, which is what makes this dangerous.** The
write succeeds, the response looks right, and reading the stored source back
looks right too. Only the rendered output shows the damage.

What survives, measured against one tracker rather than assumed:

| Construct | Result |
|---|---|
| Braces inside a fenced code block | safe |
| Braces inside an inline code span | breaks: the paragraph splits |
| Braces in plain prose | safe |
| Square brackets inside an inline code span | breaks: renders inside an error span |
| Angle brackets anywhere | safe |
| An escaped pipe inside a table cell | breaks, and silently |

## The rules

- **Never put a literal `{` or `[` into a description outside a fenced code
  block.** Write a concrete example rather than a template, and use angle
  brackets for placeholders.
- **Put literal strings in fenced code blocks.** Copy and field lists a builder
  pastes verbatim belong there anyway, and the fence is also what makes braces
  safe. This is the fix for a template that genuinely needs its placeholders.
- **Never put an alternation inside a table cell.** An escaped pipe does not
  render as a literal pipe: the tracker splits the cell there, so one row of a
  four-column table gains extra cells and every column after it stops lining up.
  Move the values into prose above the table as a comma-separated list, or give
  each value its own row. Escaping it harder does not work.
- **Verify against rendered output, never the echo.** Read the field back asking
  for its rendered form and look for an error class or a paragraph that ends
  mid-sentence. Reading the stored source proves nothing, because the stored
  source is correct in every one of these failures.

## Why fixing the text is not fixing the rule

A work item damaged this way once carried a repair note telling the next person
to wrap tracker-syntax characters in a code span. That is the remedy that does
not work, and the same item broke the same way again. The note had been written
after the first occurrence by someone who had just fixed it. Correcting a
damaged description is not the same as recording what actually survives, which
is why the measured table above lives here rather than on any one item.

---

*Authored from a live filing and grooming run against a real tracker, where the
failure reached the contract twenty-one work items were built against and was
found only by reading the rendered page.*
