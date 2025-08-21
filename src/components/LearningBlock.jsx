import React, { useState } from "react";
import { Section, TextField, NumField, TextArea } from "@/shared/components/ui";
import { uid } from "@/shared/lib/constants";
export function LearningBlock({ model, setModel, openModal }) {
  const [draft, setDraft] = useState({ title: '', link: '', durationMins: 0, learned: '', applied: '' });
  const total = (model.learning || []).reduce((s, e) => s + (e.durationMins || 0), 0);
  function addEntry() {
    if (!draft.title || !draft.link || !draft.durationMins) {
      openModal('Missing Information', 'Please fill in the title, link, and duration to add a learning entry.', () => { });
      return;
    }
    const entry = { id: uid(), ...draft };
    setModel(m => ({ ...m, learning: [...m.learning, entry] }));
    setDraft({ title: '', link: '', durationMins: 0, learned: '', applied: '' });
  }
  return (
    <Section
      title="Learning (min 6 hours = 360 mins; proofs required)"
      number="3"
      info="Document your learning activities for the month. You must complete at least 6 hours (360 minutes) of learning. Include courses, certifications, workshops, or skill development. Provide proof links to validate your learning efforts."
    >
      <div className="grid md:grid-cols-4 gap-3">
        <TextField label="Title / Topic" value={draft.title} onChange={v => setDraft(d => ({ ...d, title: v }))} />
        <TextField label="Link (YouTube/Course/Doc)" value={draft.link} onChange={v => setDraft(d => ({ ...d, link: v }))} />
        <NumField label="Duration (mins)" value={draft.durationMins} onChange={v => setDraft(d => ({ ...d, durationMins: v }))} />
        <button className="bg-blue-600 text-white rounded-xl px-3 self-end py-2" onClick={addEntry}>Add</button>
        <TextArea className="md:col-span-2" label="What did you learn (key points)" rows={3} value={draft.learned} onChange={v => setDraft(d => ({ ...d, learned: v }))} />
        <TextArea className="md:col-span-2" label="How did you apply it in work?" rows={3} value={draft.applied} onChange={v => setDraft(d => ({ ...d, applied: v }))} />
      </div>
      <div className="mt-2 text-sm">Total this month: <b>{(total / 60).toFixed(1)} hours</b> {total < 360 && <span className="text-red-600">(below 6h)</span>}</div>
      <ul className="mt-2 space-y-1 text-xs">
        {(model.learning || []).map(item => (
          <li key={item.id} className="border rounded-lg p-2 flex items-center justify-between">
            <div className="truncate"><b>{item.title}</b> • {item.durationMins}m • <a className="underline" href={item.link} target="_blank" rel="noreferrer">link</a></div>
            <button className="text-red-600" onClick={() => setModel(m => ({ ...m, learning: m.learning.filter(x => x.id !== item.id) }))}>Remove</button>
          </li>
        ))}
      </ul>
    </Section>
  );
}
