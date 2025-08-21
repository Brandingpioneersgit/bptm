import React, { useState } from "react";
import { NumField } from "@/shared/components/ui";
import { toDDMMYYYY, isDriveUrl, uid } from "@/shared/lib/constants";
import { useModal } from "@/shared/components/ModalContext";

export function ClientReportStatus({ client, prevClient, onChange }) {
  const rel = client.relationship || { roadmapSentDate: '', reportSentDate: '', meetings: [], appreciations: [], escalations: [], clientSatisfaction: 0, paymentReceived: false, paymentDate: '' };
  const prevRel = prevClient.relationship || {};
  const [meetDraft, setMeetDraft] = useState({ date: '', summary: '', notesLink: '' });
  const [appDraft, setAppDraft] = useState({ url: '', remark: '' });
  const [escDraft, setEscDraft] = useState({ url: '', remark: '' });
  const openModal = useModal();

  function addMeeting() { if (!meetDraft.date || !meetDraft.summary) return; if (meetDraft.notesLink && !isDriveUrl(meetDraft.notesLink)) { openModal('Invalid Link', 'Notes link must be a Google Drive/Docs URL.'); return; } onChange({ ...client, relationship: { ...rel, meetings: [...(rel.meetings || []), { id: uid(), ...meetDraft }] } }); setMeetDraft({ date: '', summary: '', notesLink: '' }); }
  function addAppreciation() { if (appDraft.url && !isDriveUrl(appDraft.url)) { openModal('Invalid Link', 'Use Google Drive link for proof.'); return; } const item = { id: uid(), url: appDraft.url || '', remark: appDraft.remark || '' }; onChange({ ...client, relationship: { ...rel, appreciations: [...(rel.appreciations || []), item] } }); setAppDraft({ url: '', remark: '' }); }
  function addEscalation() { if (escDraft.url && !isDriveUrl(escDraft.url)) { openModal('Invalid Link', 'Use Google Drive link for proof.'); return; } const item = { id: uid(), url: escDraft.url || '', why: escDraft.remark || '' }; onChange({ ...client, relationship: { ...rel, escalations: [...(rel.escalations || []), item] } }); setEscDraft({ url: '', remark: '' }); }

  return (
    <div className="mt-4 border-t pt-3">
      <div className="font-medium mb-2">Client Report Status</div>
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm">Roadmap Sent Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.roadmapSentDate || ''} onChange={e => onChange({ ...client, relationship: { ...rel, roadmapSentDate: e.target.value } })} autoComplete="off" />
          {prevRel.roadmapSentDate && <div className="text-xs text-gray-500 mt-1">Prev: {toDDMMYYYY(prevRel.roadmapSentDate)}</div>}
        </div>
        <div>
          <label className="text-sm">Report Sent Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.reportSentDate || ''} onChange={e => onChange({ ...client, relationship: { ...rel, reportSentDate: e.target.value } })} autoComplete="off" />
          {prevRel.reportSentDate && <div className="text-xs text-gray-500 mt-1">Prev: {toDDMMYYYY(prevRel.reportSentDate)}</div>}
        </div>
        <div>
          <label className="text-sm">Client Satisfaction (1–10)</label>
          <input type="number" min={1} max={10} className="w-full border rounded-xl p-2" value={rel.clientSatisfaction || 0} onChange={e => onChange({ ...client, relationship: { ...rel, clientSatisfaction: Number(e.target.value || 0) } })} autoComplete="off" />
          {prevRel.clientSatisfaction > 0 && <div className="text-xs text-gray-500 mt-1">Prev: {prevRel.clientSatisfaction}</div>}
        </div>
        <div className="md:col-span-1 flex items-end gap-2">
          <label className="text-sm mr-2">Payment Received?</label>
          <input type="checkbox" checked={!!rel.paymentReceived} onChange={e => onChange({ ...client, relationship: { ...rel, paymentReceived: e.target.checked } })} autoComplete="off" />
        </div>
        <div>
          <label className="text-sm">Payment Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.paymentDate || ''} onChange={e => onChange({ ...client, relationship: { ...rel, paymentDate: e.target.value } })} autoComplete="off" />
          {prevRel.paymentDate && <div className="text-xs text-gray-500 mt-1">Prev: {toDDMMYYYY(prevRel.paymentDate)}</div>}
        </div>

        <div className="col-span-4">
          <NumField label="Client Interactions (messages/mails)" value={client.clientInteractions || 0} onChange={v => onChange({ ...client, clientInteractions: v })} />
          {prevClient.clientInteractions > 0 && <div className="text-xs text-gray-500 mt-1">Prev: {prevClient.clientInteractions}</div>}
        </div>

        <div className="md:col-span-4">
          <div className="font-medium">Meetings</div>
          <div className="grid md:grid-cols-4 gap-3 mt-1">
            <div>
              <label className="text-sm">Date</label>
              <input type="date" className="border rounded-xl p-2 w-full" value={meetDraft.date} onChange={e => setMeetDraft(d => ({ ...d, date: e.target.value }))} autoComplete="off" />
            </div>
            <input className="border rounded-xl p-2" placeholder="Summary of discussion" value={meetDraft.summary} onChange={e => setMeetDraft(d => ({ ...d, summary: e.target.value }))} autoComplete="off" />
            <input className="border rounded-xl p-2" placeholder="Notes link (Drive/Doc)" value={meetDraft.notesLink} onChange={e => setMeetDraft(d => ({ ...d, notesLink: e.target.value }))} autoComplete="off" />
            <button className="rounded-xl bg-blue-600 text-white px-3" onClick={addMeeting}>Add Meeting</button>
          </div>
          <ul className="text-xs mt-2 space-y-1">
            {(rel.meetings || []).map(m => (
              <li key={m.id} className="border rounded-lg p-2 flex items-center justify-between">
                <div>{toDDMMYYYY(m.date)} • {m.summary} {m.notesLink && (<a className="underline ml-2" href={m.notesLink} target="_blank" rel="noreferrer">notes</a>)}</div>
                <button className="text-red-600" onClick={() => onChange({ ...client, relationship: { ...rel, meetings: (rel.meetings || []).filter(x => x.id !== m.id) } })}>Remove</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <div className="font-medium">Appreciations</div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive/WhatsApp in Drive) – optional" value={appDraft.url} onChange={e => setAppDraft(d => ({ ...d, url: e.target.value }))} autoComplete="off" />
            <input className="border rounded-xl p-2" placeholder="Remark (client/channel)" value={appDraft.remark} onChange={e => setAppDraft(d => ({ ...d, remark: e.target.value }))} autoComplete="off" />
            <button className="col-span-3 rounded-xl bg-emerald-600 text-white px-3 py-2" onClick={addAppreciation}>+ Add Appreciation</button>
          </div>
          <ul className="text-xs mt-2 space-y-1">
            {(rel.appreciations || []).map(a => (
              <li key={a.id} className="border rounded-lg p-2 flex items-center justify-between">
                <div className="truncate">{a.remark || '—'} {a.url && (<a className="underline ml-2" href={a.url} target="_blank" rel="noreferrer">proof</a>)}</div>
                <button className="text-red-600" onClick={() => onChange({ ...client, relationship: { ...rel, appreciations: (rel.appreciations || []).filter(x => x.id !== a.id) } })}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <div className="font-medium">Escalations</div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive) – optional" value={escDraft.url} onChange={e => setEscDraft(d => ({ ...d, url: e.target.value }))} autoComplete="off" />
            <input className="border rounded-xl p-2" placeholder="Why did this happen?" value={escDraft.remark} onChange={e => setEscDraft(d => ({ ...d, remark: e.target.value }))} autoComplete="off" />
            <button className="col-span-3 rounded-xl bg-red-600 text-white px-3 py-2" onClick={addEscalation}>+ Add Escalation</button>
          </div>
          <ul className="text-xs mt-2 space-y-1">
            {(rel.escalations || []).map(a => (
              <li key={a.id} className="border rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="truncate">{a.why || '—'} {a.url && (<a className="underline ml-2" href={a.url} target="_blank" rel="noreferrer">proof</a>)}</div>
                  <button className="text-red-600" onClick={() => onChange({ ...client, relationship: { ...rel, escalations: (rel.escalations || []).filter(x => x.id !== a.id) } })}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
