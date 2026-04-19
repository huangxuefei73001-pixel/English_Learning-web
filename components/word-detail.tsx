"use client";

import { useRef, useState } from "react";

import type { VocabularyWord } from "@/data/mock";
import { Button, Card, FieldLabel, LinkButton, Pill, SectionHeading } from "@/components/ui";

type WordDetailProps = {
  word: VocabularyWord;
};

export function WordDetail({ word }: WordDetailProps) {
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("Ready to save to your vocabulary list.");

  function handleSave() {
    setSaved(true);
    setStatus("Saved locally. Connect this to your vocabulary backend later.");
  }

  function focusNote() {
    noteRef.current?.focus();
    setStatus("Start writing a personal cue, example, or translation note.");
  }

  return (
    <main className="space-y-4 md:space-y-5">
      <header className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <Card className="space-y-5 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="deep">Word result</Pill>
            <Pill tone="line">{word.partOfSpeech}</Pill>
            {word.usageLabels.map((label) => (
              <Pill key={label} tone="soft" className="capitalize">
                {label}
              </Pill>
            ))}
          </div>

          <SectionHeading
            eyebrow="Dictionary card"
            title={word.title}
            description={word.summary}
          />

          <div className="rounded-[28px] border border-line bg-bg p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                  Phonetics
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-line bg-white px-4 py-2 text-sm text-text">
                    UK {word.phonetics.uk}
                  </span>
                  <span className="rounded-full border border-line bg-white px-4 py-2 text-sm text-text">
                    US {word.phonetics.us}
                  </span>
                </div>
              </div>

              <Button className="sm:self-start">Play pronunciation</Button>
            </div>

            <div className="mt-5 grid gap-3">
              <FieldLabel label="Chinese core meaning" value={word.chineseMeaning} />
              <FieldLabel label="Simple English definition" value={word.englishDefinition} />
            </div>
          </div>
        </Card>

        <Card className="space-y-5 p-5 sm:p-7">
          <SectionHeading
            eyebrow="Actions"
            title="Save, annotate, and keep moving"
            description="No heavy system here. Just a clean place to collect the words you care about."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Button onClick={handleSave} className="w-full">
              {saved ? "Saved" : "Save to vocabulary list"}
            </Button>
            <Button tone="secondary" onClick={focusNote} className="w-full">
              Add personal note
            </Button>
          </div>

          <div className="rounded-[24px] border border-line bg-accent p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              Status
            </p>
            <p className="mt-2 text-sm leading-7 text-text">{status}</p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                Personal note
              </span>
              <textarea
                ref={noteRef}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a memory cue, translation, or your own example."
                className="mt-3 min-h-40 w-full rounded-[24px] border border-line bg-bg px-4 py-4 text-sm leading-7 text-text outline-none transition placeholder:text-muted/70 focus:border-primary focus:bg-white"
              />
            </label>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {note.trim().length ? "Draft note ready." : "Notes stay local for now."}
              </p>
              <Button
                tone="secondary"
                onClick={() => setStatus("Personal note drafted. Hook this to storage later.")}
              >
                Store note
              </Button>
            </div>
          </div>
        </Card>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="space-y-4 p-5 sm:p-7">
          <SectionHeading
            eyebrow="Collocations"
            title="Common collocations"
            description="Learning the word in chunks makes it easier to use naturally."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {word.collocations.map((item) => (
              <div key={item} className="rounded-[24px] border border-line bg-bg p-4">
                <p className="text-sm font-semibold text-text">{item}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5 sm:p-7">
          <SectionHeading
            eyebrow="Examples"
            title="Example sentences"
            description="A few real-looking contexts help the meaning stick."
          />

          <div className="space-y-3">
            {word.examples.map((example) => (
              <article key={`${word.slug}-${example.sentence}`} className="rounded-[24px] border border-line bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <Pill tone="line" className="capitalize">
                    {example.label}
                  </Pill>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    use case
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-text">{example.sentence}</p>
              </article>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="space-y-4 p-5 sm:p-7">
          <SectionHeading
            eyebrow="Similar words"
            title="What to compare it with"
            description="These are the words people usually mix up with this entry."
          />

          <div className="space-y-3">
            {word.similarWords.map((item) => (
              <div
                key={item.slug}
                className="rounded-[24px] border border-line bg-bg p-4"
              >
                <p className="text-sm font-semibold text-text">{item.word}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{item.note}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5 sm:p-7">
          <SectionHeading
            eyebrow="Memory aids"
            title="Etymology, roots, and mnemonic"
            description="A few anchors that make the word easier to recall later."
          />

          <div className="space-y-3">
            <FieldLabel label="Etymology" value={word.memoryAids.etymology} />
            <FieldLabel label="Roots / parts" value={word.memoryAids.roots} />
            <FieldLabel label="Mnemonic tip" value={word.memoryAids.mnemonic} />
          </div>
        </Card>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <LinkButton href="/" tone="secondary">
          Back to search
        </LinkButton>
        <LinkButton href="/library">Open my vocabulary</LinkButton>
      </section>
    </main>
  );
}
