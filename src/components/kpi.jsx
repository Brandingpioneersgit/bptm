import React, { useState, useEffect, useMemo } from "react";
import { NumField, ProofField, TextArea, MultiSelect, PrevValue, TinyLinks, Section, ComparativeField } from "./ui";
import { monthLabel, isDriveUrl, isGensparkUrl, uid, round1 } from "./constants";
import { useModal } from "./AppShell";
import { useSupabase } from "./SupabaseProvider";
import { ClientReportStatus } from "./ClientReportStatus";

// Internal KPIs component for HR, Accounts, Sales, Blended departments
function InternalKPIs({ model, prevModel, setModel, monthPrev, monthThis }) {
  const department = model.employee?.department || "";
  const prevSubmission = prevModel || {};
  
  const updateField = (key, value) => {
    setModel(prev => ({
      ...prev,
      meta: {
        ...prev.meta,
        internalKpis: {
          ...prev.meta?.internalKpis,
          [key]: value
        }
      }
    }));
  };

  const currentKpis = model.meta?.internalKpis || {};
  const prevKpis = prevSubmission.meta?.internalKpis || {};

  if (department === "HR" || department === "Blended (HR + Sales)") {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">HR Performance Metrics</h3>
        
        <ComparativeField
          label="New Hires Processed"
          currentValue={currentKpis.newHires || 0}
          previousValue={prevKpis.newHires || 0}
          onChange={(v) => updateField('newHires', v)}
          monthPrev={monthLabel(monthPrev)}
          monthThis={monthLabel(monthThis)}
        />

        <ComparativeField
          label="Employee Issues Resolved"
          currentValue={currentKpis.issuesResolved || 0}
          previousValue={prevKpis.issuesResolved || 0}
          onChange={(v) => updateField('issuesResolved', v)}
          monthPrev={monthLabel(monthPrev)}
          monthThis={monthLabel(monthThis)}
        />

        <ComparativeField
          label="Training Sessions Conducted"
          currentValue={currentKpis.trainingSessions || 0}
          previousValue={prevKpis.trainingSessions || 0}
          onChange={(v) => updateField('trainingSessions', v)}
          monthPrev={monthLabel(monthPrev)}
          monthThis={monthLabel(monthThis)}
        />

        <TextArea
          label="Key HR Achievements This Month"
          value={currentKpis.achievements || ""}
          onChange={(v) => updateField('achievements', v)}
          rows={3}
          placeholder="Describe major HR accomplishments, policy implementations, employee satisfaction improvements, etc."
        />
      </div>
    );
  }

  if (department === "Accounts") {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Accounts Performance Metrics</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <NumField
            label="Invoices Processed"
            value={currentKpis.invoicesProcessed || 0}
            onChange={(v) => updateField('invoicesProcessed', v)}
          />
          <div className="text-sm text-gray-600 mt-6">
            Previous: {prevKpis.invoicesProcessed || 0}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <NumField
            label="Payments Collected (₹)"
            value={currentKpis.paymentsCollected || 0}
            onChange={(v) => updateField('paymentsCollected', v)}
          />
          <div className="text-sm text-gray-600 mt-6">
            Previous: ₹{prevKpis.paymentsCollected || 0}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <NumField
            label="Outstanding Amount (₹)"
            value={currentKpis.outstandingAmount || 0}
            onChange={(v) => updateField('outstandingAmount', v)}
          />
          <div className="text-sm text-gray-600 mt-6">
            Previous: ₹{prevKpis.outstandingAmount || 0}
          </div>
        </div>

        <TextArea
          label="Key Accounts Achievements This Month"
          value={currentKpis.achievements || ""}
          onChange={(v) => updateField('achievements', v)}
          rows={3}
          placeholder="Describe major accounting accomplishments, process improvements, cost savings, etc."
        />
      </div>
    );
  }

  if (department === "Sales") {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Performance Metrics</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <NumField
            label="New Leads Generated"
            value={currentKpis.newLeads || 0}
            onChange={(v) => updateField('newLeads', v)}
          />
          <div className="text-sm text-gray-600 mt-6">
            Previous: {prevKpis.newLeads || 0}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <NumField
            label="Deals Closed"
            value={currentKpis.dealsSecured || 0}
            onChange={(v) => updateField('dealsSecured', v)}
          />
          <div className="text-sm text-gray-600 mt-6">
            Previous: {prevKpis.dealsSecured || 0}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <NumField
            label="Revenue Generated (₹)"
            value={currentKpis.revenueGenerated || 0}
            onChange={(v) => updateField('revenueGenerated', v)}
          />
          <div className="text-sm text-gray-600 mt-6">
            Previous: ₹{prevKpis.revenueGenerated || 0}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <NumField
            label="Client Meetings Held"
            value={currentKpis.clientMeetings || 0}
            onChange={(v) => updateField('clientMeetings', v)}
          />
          <div className="text-sm text-gray-600 mt-6">
            Previous: {prevKpis.clientMeetings || 0}
          </div>
        </div>

        <TextArea
          label="Key Sales Achievements This Month"
          value={currentKpis.achievements || ""}
          onChange={(v) => updateField('achievements', v)}
          rows={3}
          placeholder="Describe major sales accomplishments, new client acquisitions, revenue milestones, etc."
        />
      </div>
    );
  }

  return (
    <div className="text-center py-8 text-gray-500">
      <p>Internal KPIs for {department} department</p>
      <TextArea
        label="Department Achievements This Month"
        value={currentKpis.achievements || ""}
        onChange={(v) => updateField('achievements', v)}
        rows={4}
        placeholder="Describe your key accomplishments and contributions this month..."
      />
    </div>
  );
}

function ScopePrompt({ client, service, title }) {
  if (!client.services || !client.services.includes(service) || !client.service_scopes || !client.service_scopes[service]) {
    return null;
  }

  const scope = client.service_scopes[service];
  const completion = calculateScopeCompletion(client, service);
  const isComplete = completion !== null && completion >= 100;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-blue-800">{title} Scope Tracker</h4>
        {completion !== null && (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            completion >= 100 ? 'bg-green-100 text-green-800' :
            completion >= 75 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {completion}% Complete
          </span>
        )}
      </div>
      <div className="text-sm text-blue-700 space-y-1">
        <p className={`flex items-center ${isComplete ? 'text-green-700' : 'text-red-700'}`}>
          📋 <strong className="ml-1">Target:</strong> {scope.deliverables} {service.toLowerCase()} deliverables this month
          <span className="ml-1">{isComplete ? '✅' : '⚠️'}</span>
        </p>
        {scope.description && <p>📝 <strong>Scope:</strong> {scope.description}</p>}
        <p className={`flex items-center ${isComplete ? 'text-green-700' : 'text-red-700'}`}>
          ⏰ <strong className="ml-1">Frequency:</strong> {scope.frequency}
          <span className="ml-1">{isComplete ? '✅' : '⚠️'}</span>
        </p>
      </div>
    </div>
  );
}

function KPIsWeb({ client, prevClient, onChange, monthPrev, monthThis, isNewClient }) {
  const delta = (a, b) => (a || 0) - (b || 0);
  return (
    <div>
      <ScopePrompt client={client} service="Website Maintenance" title="Website Maintenance" />
      <ScopePrompt client={client} service="AI" title="AI" />
      <div className="grid md:grid-cols-4 gap-3 mt-3">
      {isNewClient ? (
        <NumField label={`# Pages (${monthLabel(monthPrev)})`} value={client.web_pagesPrev || 0} onChange={v => onChange({ ...client, web_pagesPrev: v })} />
      ) : (
        <PrevValue label={`# Pages (${monthLabel(monthPrev)})`} value={prevClient.web_pagesThis || 0} />
      )}
      <NumField label={`# Pages (${monthLabel(monthThis)})`} value={client.web_pagesThis || 0} onChange={v => onChange({ ...client, web_pagesThis: v })} />
      {isNewClient ? (
        <NumField label={`On-time % (${monthLabel(monthPrev)})`} value={client.web_onTimePrev || 0} onChange={v => onChange({ ...client, web_onTimePrev: v })} />
      ) : (
        <PrevValue label={`On-time % (${monthLabel(monthPrev)})`} value={prevClient.web_onTimeThis || 0} />
      )}
      <NumField label={`On-time % (${monthLabel(monthThis)})`} value={client.web_onTimeThis || 0} onChange={v => onChange({ ...client, web_onTimeThis: v })} />
      {isNewClient ? (
        <NumField label={`Bugs Fixed (${monthLabel(monthPrev)})`} value={client.web_bugsPrev || 0} onChange={v => onChange({ ...client, web_bugsPrev: v })} />
      ) : (
        <PrevValue label={`Bugs Fixed (${monthLabel(monthPrev)})`} value={prevClient.web_bugsThis || 0} />
      )}
      <NumField label={`Bugs Fixed (${monthLabel(monthThis)})`} value={client.web_bugsThis || 0} onChange={v => onChange({ ...client, web_bugsThis: v })} />
      <NumField label="# SaaS tools upsold (this)" value={client.web_saasUpsells || 0} onChange={v => onChange({ ...client, web_saasUpsells: v })} />
      <ProofField label="SaaS proof / invoice / deck" value={client.web_saasProof} onChange={(v) => onChange({ ...client, web_saasProof: v })} />
      <ProofField label="CRO/Design review proof" value={client.web_proof} onChange={(v) => onChange({ ...client, web_proof: v })} />

      <NumField label="Client Satisfaction (1-10)" value={client.web_clientSatisfaction || 0} onChange={v => onChange({ ...client, web_clientSatisfaction: v })} />
      <NumField label="Code Quality Score (1-10)" value={client.web_codeQuality || 0} onChange={v => onChange({ ...client, web_codeQuality: v })} />
      <NumField label="Website Speed Score (1-100)" value={client.web_speedScore || 0} onChange={v => onChange({ ...client, web_speedScore: v })} />
      <NumField label="Security Audits Completed" value={client.web_securityAudits || 0} onChange={v => onChange({ ...client, web_securityAudits: v })} />

      <div className="md:col-span-4 text-xs text-gray-600">MoM Pages Δ: {delta(client.web_pagesThis, isNewClient ? client.web_pagesPrev : prevClient.web_pagesThis)} • On-time Δ: {round1((client.web_onTimeThis || 0) - (isNewClient ? client.web_onTimePrev : prevClient.web_onTimeThis || 0))} • Bugs Δ: {delta(client.web_bugsThis, isNewClient ? client.web_bugsPrev : prevClient.web_bugsThis)}</div>
      </div>
    </div>
  );
}

function KPIsWebHead({ client, prevClient, onChange }) {
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <NumField label={`# Pages Delivered`} value={client.web_pagesThis || 0} onChange={v => onChange({ ...client, web_pagesThis: v })} />
      <NumField label={`On-time % Delivered`} value={client.web_onTimeThis || 0} onChange={v => onChange({ ...client, web_onTimeThis: v })} />
      <NumField label="# SaaS tools upsold (this)" value={client.web_saasUpsells || 0} onChange={v => onChange({ ...client, web_saasUpsells: v })} />
      <ProofField label="Upsell proof / invoice" value={client.web_saasProof} onChange={v => onChange({ ...client, web_saasProof: v })} />
    </div>
  );
}

function calculateScopeCompletion(client, service) {
  if (!client.service_scopes || !client.service_scopes[service]) return null;
  
  const scope = client.service_scopes[service];
  const deliverables = scope.deliverables || 0;
  
  switch (service) {
    case 'Social Media':
      const totalPosts = (client.sm_graphicsPhotoshop || 0) + (client.sm_graphicsCanva || 0) + 
                        (client.sm_graphicsAi || 0) + (client.sm_shortVideos || 0) + (client.sm_longVideos || 0);
      return deliverables > 0 ? Math.min(100, Math.round((totalPosts / deliverables) * 100)) : 0;
    case 'SEO':
    case 'GBP SEO':
      const keywordsWorked = client.seo_keywordsWorked ? client.seo_keywordsWorked.length : 0;
      const top3Keywords = client.seo_top3 ? client.seo_top3.length : 0;
      const totalSeoWork = keywordsWorked + top3Keywords + (client.seo_technicalIssues || 0);
      return deliverables > 0 ? Math.min(100, Math.round((totalSeoWork / deliverables) * 100)) : 0;
    case 'Google Ads':
    case 'Meta Ads':
      const adsCreated = client.ads_newAds || 0;
      return deliverables > 0 ? Math.min(100, Math.round((adsCreated / deliverables) * 100)) : 0;
    case 'Website Maintenance':
      const webPages = (client.web_pagesThis || 0);
      const webTasks = webPages + (client.web_saasUpsells || 0);
      return deliverables > 0 ? Math.min(100, Math.round((webTasks / deliverables) * 100)) : 0;
    case 'AI':
      return 0;
    default:
      return 0;
  }
}

function ClientScopePreview({ client, department }) {
  const deptServices = {
    'Web': ['Website Maintenance', 'AI'],
    'Web Head': ['Website Maintenance', 'AI'],
    'Social Media': ['Social Media'],
    'Ads': ['Google Ads', 'Meta Ads'],
    'SEO': ['SEO', 'GBP SEO'],
    'Operations Head': ['Website Maintenance', 'AI', 'Social Media', 'Google Ads', 'Meta Ads', 'SEO', 'GBP SEO']
  };
  const services = deptServices[department] || [];
  const scopes = services
    .map(service => ({ service, scope: client.service_scopes?.[service] }))
    .filter(s => s.scope);
  if (!client.scope_of_work && scopes.length === 0) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
      {client.scope_of_work && (
        <p className="text-sm mb-2"><strong>Scope of Work:</strong> {client.scope_of_work}</p>
      )}
      {scopes.map(({ service, scope }) => {
        const completion = calculateScopeCompletion(client, service);
        const incomplete = completion !== null && completion < 100;
        return (
          <div key={service} className={`text-sm flex items-center justify-between mb-1 ${incomplete ? 'text-red-700' : 'text-green-700'}`}>
            <span>{service}: {scope.deliverables} required ({scope.frequency})</span>
            <span>{incomplete ? '⚠️' : '✅'}</span>
          </div>
        );
      })}
    </div>
  );
}

function KPIsSocial({ client, prevClient, employeeRole, onChange, monthPrev, monthThis, isNewClient }) {
  const folDelta = (client.sm_followersThis || 0) - (isNewClient ? (client.sm_followersPrev || 0) : (prevClient.sm_followersThis || 0));
  const reachDelta = (client.sm_reachThis || 0) - (isNewClient ? (client.sm_reachPrev || 0) : (prevClient.sm_reachThis || 0));
  const erDelta = (client.sm_erThis || 0) - (isNewClient ? (client.sm_erPrev || 0) : (prevClient.sm_erThis || 0));
  const isDesigner = employeeRole?.includes('Graphic Designer');
  return (
    <div>
      <ScopePrompt client={client} service="Social Media" title="Social Media" />
      <div className="grid md:grid-cols-4 gap-3 mt-3">
      {!isDesigner && (
        <>
          {isNewClient ? (
            <NumField label={`Followers (${monthLabel(monthPrev)})`} value={client.sm_followersPrev || 0} onChange={v => onChange({ ...client, sm_followersPrev: v })} />
          ) : (
            <PrevValue label={`Followers (${monthLabel(monthPrev)})`} value={prevClient.sm_followersThis || 0} />
          )}
          <NumField label={`Followers (${monthLabel(monthThis)})`} value={client.sm_followersThis || 0} onChange={v => onChange({ ...client, sm_followersThis: v })} />
          {isNewClient ? (
            <NumField label={`Reach (${monthLabel(monthPrev)})`} value={client.sm_reachPrev || 0} onChange={v => onChange({ ...client, sm_reachPrev: v })} />
          ) : (
            <PrevValue label={`Reach (${monthLabel(monthPrev)})`} value={prevClient.sm_reachThis || 0} />
          )}
          <NumField label={`Reach (${monthLabel(monthThis)})`} value={client.sm_reachThis || 0} onChange={v => onChange({ ...client, sm_reachThis: v })} />
          {isNewClient ? (
            <NumField label={`Engagement Rate % (${monthLabel(monthPrev)})`} value={client.sm_erPrev || 0} onChange={v => onChange({ ...client, sm_erPrev: v })} />
          ) : (
            <PrevValue label={`Engagement Rate % (${monthLabel(monthPrev)})`} value={prevClient.sm_erThis || 0} />
          )}
          <NumField label={`Engagement Rate % (${monthLabel(monthThis)})`} value={client.sm_erThis || 0} onChange={v => onChange({ ...client, sm_erThis: v })} />
          <NumField label="# Campaigns (this)" value={client.sm_campaignsThis || 0} onChange={v => onChange({ ...client, sm_campaignsThis: v })} />
          <p className="md:col-span-4 text-xs text-gray-600">MoM Δ — Followers: {folDelta} • Reach: {reachDelta} • ER: {round1(erDelta)}</p>
          <TextField label="Best Performing Post (title/desc)" value={client.sm_bestPostTitle || ""} onChange={v => onChange({ ...client, sm_bestPostTitle: v })} />
          <ProofField label="Best Post proof (post URL / insights)" value={client.sm_bestPostProof} onChange={v => onChange({ ...client, sm_bestPostProof: v })} />
          <TextArea label="Distribution Achievements (what you did)" rows={3} value={client.sm_distributionNotes || ""} onChange={v => onChange({ ...client, sm_distributionNotes: v })} className="md:col-span-2" />
          <ProofField label="Campaign proof (deck / screenshots)" value={client.sm_campaignProof} onChange={v => onChange({ ...client, sm_campaignProof: v })} />
        </>
      )}
      {isDesigner && (
        <>
          <h4 className="font-semibold text-sm col-span-4 mt-2">Graphic Designer KPIs</h4>
          <NumField label="Graphics (Photoshop)" value={client.sm_graphicsPhotoshop || 0} onChange={v => onChange({ ...client, sm_graphicsPhotoshop: v })} />
          <NumField label="Graphics (Canva)" value={client.sm_graphicsCanva || 0} onChange={v => onChange({ ...client, sm_graphicsCanva: v })} />
          <NumField label="Graphics (AI)" value={client.sm_graphicsAi || 0} onChange={v => onChange({ ...client, sm_graphicsAi: v })} />
          <NumField label="Short Videos" value={client.sm_shortVideos || 0} onChange={v => onChange({ ...client, sm_shortVideos: v })} />
          <NumField label="Long Videos" value={client.sm_longVideos || 0} onChange={v => onChange({ ...client, sm_longVideos: v })} />
          <NumField label="Quality Score (1-10)" value={client.sm_qualityScore || 0} onChange={v => onChange({ ...client, sm_qualityScore: v })} />

          <NumField label="Brand Consistency Score (1-10)" value={client.sm_brandConsistency || 0} onChange={v => onChange({ ...client, sm_brandConsistency: v })} />
          <NumField label="Client Revisions Required" value={client.sm_revisions || 0} onChange={v => onChange({ ...client, sm_revisions: v })} />
          <NumField label="Templates Created" value={client.sm_templatesCreated || 0} onChange={v => onChange({ ...client, sm_templatesCreated: v })} />
        </>
      )}

      <div className="md:col-span-4 bg-purple-50 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-purple-800 mb-3">📈 Additional Social Media Metrics</h4>
        <div className="grid md:grid-cols-4 gap-3">
          <NumField label="Story Views" value={client.sm_storyViews || 0} onChange={v => onChange({ ...client, sm_storyViews: v })} />
          <NumField label="Saves/Shares" value={client.sm_savesShares || 0} onChange={v => onChange({ ...client, sm_savesShares: v })} />
          <NumField label="Comments Responded %" value={client.sm_responseRate || 0} onChange={v => onChange({ ...client, sm_responseRate: v })} />
          <NumField label="Hashtag Performance Score (1-10)" value={client.sm_hashtagScore || 0} onChange={v => onChange({ ...client, sm_hashtagScore: v })} />
        </div>
      </div>
      </div>
    </div>
  );
}

function KPIsAds({ client, prevClient, onChange, monthPrev, monthThis, isNewClient }) {
  const cplDelta = (client.ads_cplThis || 0) - (isNewClient ? (client.ads_cplPrev || 0) : (prevClient.ads_cplThis || 0));
  const ctrDelta = (client.ads_ctrThis || 0) - (isNewClient ? (client.ads_ctrPrev || 0) : (prevClient.ads_ctrThis || 0));
  const leadsDelta = (client.ads_leadsThis || 0) - (isNewClient ? (client.ads_leadsPrev || 0) : (prevClient.ads_leadsThis || 0));
  return (
    <div>
      <ScopePrompt client={client} service="Google Ads" title="Google Ads" />
      <ScopePrompt client={client} service="Meta Ads" title="Meta Ads" />
      <div className="grid md:grid-cols-4 gap-3 mt-3">
      <NumField label="# New Ads Created (this)" value={client.ads_newAds || 0} onChange={v => onChange({ ...client, ads_newAds: v })} />
      {isNewClient ? (
        <NumField label={`CTR % (${monthLabel(monthPrev)})`} value={client.ads_ctrPrev || 0} onChange={v => onChange({ ...client, ads_ctrPrev: v })} />
      ) : (
        <PrevValue label={`CTR % (${monthLabel(monthPrev)})`} value={prevClient.ads_ctrThis || 0} />
      )}
      <NumField label={`CTR % (${monthLabel(monthThis)})`} value={client.ads_ctrThis || 0} onChange={v => onChange({ ...client, ads_ctrThis: v })} />
      {isNewClient ? (
        <NumField label={`CPL (${monthLabel(monthPrev)})`} value={client.ads_cplPrev || 0} onChange={v => onChange({ ...client, ads_cplPrev: v })} />
      ) : (
        <PrevValue label={`CPL (${monthLabel(monthPrev)})`} value={prevClient.ads_cplThis || 0} />
      )}
      <NumField label={`CPL (${monthLabel(monthThis)})`} value={client.ads_cplThis || 0} onChange={v => onChange({ ...client, ads_cplThis: v })} />
      {isNewClient ? (
        <NumField label={`Leads (${monthLabel(monthPrev)})`} value={client.ads_leadsPrev || 0} onChange={v => onChange({ ...client, ads_leadsPrev: v })} />
      ) : (
        <PrevValue label={`Leads (${monthLabel(monthPrev)})`} value={prevClient.ads_leadsThis || 0} />
      )}
      <NumField label={`Leads (${monthLabel(monthThis)})`} value={client.ads_leadsThis || 0} onChange={v => onChange({ ...client, ads_leadsThis: v })} />
      <TextField label="Best Performing Ad (name/desc)" value={client.ads_bestAdTitle || ""} onChange={v => onChange({ ...client, ads_bestAdTitle: v })} />
      <ProofField label="Best Ad proof (screenshot/insights)" value={client.ads_bestAdProof} onChange={v => onChange({ ...client, ads_bestAdProof: v })} />
      <TextArea label="Landing Page URL" value={client.ads_landingPageUrl || ""} onChange={v => onChange({ ...client, ads_landingPageUrl: v })} />
      <TextArea label="Landing Page Improvements" value={client.ads_landingPageImprovements || ""} onChange={v => onChange({ ...client, ads_landingPageImprovements: v })} />
      <p className="md:col-span-4 text-xs text-gray-600">MoM Δ — CTR: {round1(ctrDelta)}pp • CPL: {round1(cplDelta)} (↓ is better) • Leads: {leadsDelta}</p>

      <div className="md:col-span-4 bg-orange-50 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-orange-800 mb-3">📊 Advanced Ads Metrics</h4>
        <div className="grid md:grid-cols-4 gap-3">
          <NumField label="ROAS (Return on Ad Spend)" value={client.ads_roas || 0} onChange={v => onChange({ ...client, ads_roas: v })} />
          <NumField label="Conversion Rate %" value={client.ads_conversionRate || 0} onChange={v => onChange({ ...client, ads_conversionRate: v })} />
          <NumField label="Quality Score (1-10)" value={client.ads_qualityScore || 0} onChange={v => onChange({ ...client, ads_qualityScore: v })} />
          <NumField label="Impression Share %" value={client.ads_impressionShare || 0} onChange={v => onChange({ ...client, ads_impressionShare: v })} />
          <NumField label="Ad Spend ($)" value={client.ads_spend || 0} onChange={v => onChange({ ...client, ads_spend: v })} />
          <NumField label="Campaigns Optimized" value={client.ads_campaignsOptimized || 0} onChange={v => onChange({ ...client, ads_campaignsOptimized: v })} />
          <NumField label="A/B Tests Conducted" value={client.ads_abTests || 0} onChange={v => onChange({ ...client, ads_abTests: v })} />
          <NumField label="Negative Keywords Added" value={client.ads_negativeKeywords || 0} onChange={v => onChange({ ...client, ads_negativeKeywords: v })} />
        </div>
      </div>
      </div>
    </div>
  );
}

function KPIsSEO({ client, prevClient, onChange, monthPrev, monthThis, openModal, closeModal, isNewClient }) {
  const [kw, setKw] = useState(client.seo_keywordsWorked || []);
  const [top3, setTop3] = useState(client.seo_top3 || []);
  useEffect(() => { onChange({ ...client, seo_keywordsWorked: kw }); }, [kw]);
  useEffect(() => { onChange({ ...client, seo_top3: top3 }); }, [top3]);

  const addKw = () => {
    let newKw = { keyword: '', location: '', searchVolume: 0, rankPrev: 0, rankNow: 0, proof: '' };
    const getKeyword = (currentVal = '') => {
      openModal('Add Keyword', 'Enter the keyword.', (keyword) => {
        if (!keyword) { closeModal(); return; }
        newKw.keyword = keyword;
        getLocation(newKw.location);
      }, closeModal, 'Keyword', currentVal);
    };

    const getLocation = (currentVal = '') => {
      openModal('Add Location', 'Enter location (city/region) for the keyword.', (location) => {
        newKw.location = location;
        getSearchVolume(newKw.searchVolume);
      }, closeModal, 'Keyword Location', currentVal);
    };

    const getSearchVolume = (currentVal = '') => {
      openModal('Search Volume', 'Enter the search volume.', (volume) => {
        newKw.searchVolume = Number(volume || 0);
        getRankPrev(newKw.rankPrev);
      }, closeModal, 'Search Volume', currentVal);
    };

    const getRankPrev = (currentVal = '') => {
      openModal('Previous Rank', `Enter the previous rank (${monthLabel(monthPrev)}).`, (rank) => {
        newKw.rankPrev = Number(rank || 0);
        getRankNow(newKw.rankNow);
      }, closeModal, 'Previous Rank', currentVal);
    };

    const getRankNow = (currentVal = '') => {
      openModal('Current Rank', `Enter the current rank (${monthLabel(monthThis)}).`, (rank) => {
        newKw.rankNow = Number(rank || 0);
        getProof(newKw.proof);
      }, closeModal, 'Current Rank', currentVal);
    };

    const getProof = (currentVal = '') => {
      openModal('Proof URL', 'Enter the proof URL (Drive / SERP screenshot).', (proof) => {
        newKw.proof = proof;
        setKw(list => [...list, newKw]);
        closeModal();
      }, closeModal, 'Proof URL', currentVal);
    };

    getKeyword();
  };
  const addTop3 = () => {
    let newTop3 = { keyword: '', searchVolume: 0, proof: '' };
    const getKeyword = (currentVal = '') => {
      openModal('Add Top 3 Keyword', 'Enter the keyword.', (keyword) => {
        if (!keyword) { closeModal(); return; }
        newTop3.keyword = keyword;
        getSearchVolume(newTop3.searchVolume);
      }, closeModal, 'Top 3 Keyword', currentVal);
    };

    const getSearchVolume = (currentVal = '') => {
      openModal('Search Volume', 'Enter the search volume.', (volume) => {
        newTop3.searchVolume = Number(volume || 0);
        getProof(newTop3.proof);
      }, closeModal, 'Search Volume', currentVal);
    };

    const getProof = (currentVal = '') => {
      openModal('Proof URL', 'Enter the proof URL (Drive/SERP).', (proof) => {
        newTop3.proof = proof;
        setTop3(list => [...list, newTop3]);
        closeModal();
      }, closeModal, 'Proof URL', currentVal);
    };

    getKeyword();
  };
  const trafDelta = (client.seo_trafficThis || 0) - (isNewClient ? (client.seo_trafficPrev || 0) : (prevClient.seo_trafficThis || 0));
  const llmDelta = (client.seo_llmTrafficThis || 0) - (isNewClient ? (client.seo_llmTrafficPrev || 0) : (prevClient.seo_llmTrafficThis || 0));
  const leadsDelta = (client.seo_leadsThis || 0) - (isNewClient ? (client.seo_leadsPrev || 0) : (prevClient.seo_leadsThis || 0));
  const localCallsDelta = (client.seo_localCallsThis || 0) - (isNewClient ? (client.seo_localCallsPrev || 0) : (prevClient.seo_localCallsThis || 0));
  return (
    <div>
      <ScopePrompt client={client} service="SEO" title="SEO" />
      <ScopePrompt client={client} service="GBP SEO" title="GBP SEO" />
      <div className="grid md:grid-cols-4 gap-3 mt-3">
      {isNewClient ? (
        <NumField label={`Organic Traffic (${monthLabel(monthPrev)})`} value={client.seo_trafficPrev || 0} onChange={v => onChange({ ...client, seo_trafficPrev: v })} />
      ) : (
        <PrevValue label={`Organic Traffic (${monthLabel(monthPrev)})`} value={prevClient.seo_trafficThis || 0} />
      )}
      <NumField label={`Organic Traffic (${monthLabel(monthThis)})`} value={client.seo_trafficThis || 0} onChange={v => onChange({ ...client, seo_trafficThis: v })} />
      {isNewClient ? (
        <NumField label={`LLM/AI Overview Traffic (${monthLabel(monthPrev)})`} value={client.seo_llmTrafficPrev || 0} onChange={v => onChange({ ...client, seo_llmTrafficPrev: v })} />
      ) : (
        <PrevValue label={`LLM/AI Overview Traffic (${monthLabel(monthPrev)})`} value={prevClient.seo_llmTrafficThis || 0} />
      )}
      <NumField label={`LLM/AI Overview Traffic (${monthLabel(monthThis)})`} value={client.seo_llmTrafficThis || 0} onChange={v => onChange({ ...client, seo_llmTrafficThis: v })} />
      {isNewClient ? (
        <NumField label={`Leads from SEO (${monthLabel(monthPrev)})`} value={client.seo_leadsPrev || 0} onChange={v => onChange({ ...client, seo_leadsPrev: v })} />
      ) : (
        <PrevValue label={`Leads from SEO (${monthLabel(monthPrev)})`} value={prevClient.seo_leadsThis || 0} />
      )}
      <NumField label={`Leads from SEO (${monthLabel(monthThis)})`} value={client.seo_leadsThis || 0} onChange={v => onChange({ ...client, seo_leadsThis: v })} />
      <NumField label="# Keywords Improved (this)" value={client.seo_kwImprovedThis || 0} onChange={v => onChange({ ...client, seo_kwImprovedThis: v })} />
      <NumField label="# AI Overviews / LLM (this)" value={client.seo_aiOverviewThis || 0} onChange={v => onChange({ ...client, seo_aiOverviewThis: v })} />
      {isNewClient ? (
        <NumField label={`Local SEO Calls (${monthLabel(monthPrev)})`} value={client.seo_localCallsPrev || 0} onChange={v => onChange({ ...client, seo_localCallsPrev: v })} />
      ) : (
        <PrevValue label={`Local SEO Calls (${monthLabel(monthPrev)})`} value={prevClient.seo_localCallsThis || 0} />
      )}
      <NumField label={`Local SEO Calls (${monthLabel(monthThis)})`} value={client.seo_localCallsThis || 0} onChange={v => onChange({ ...client, seo_localCallsThis: v })} />
      <ProofField label="Traffic/GA4 proof" value={client.seo_trafficProof} onChange={(v) => onChange({ ...client, seo_trafficProof: v })} />
      <ProofField label="AI Overview proof" value={client.seo_aiOverviewProof} onChange={(v) => onChange({ ...client, seo_aiOverviewProof: v })} />
      <div className="md:col-span-4 text-xs text-gray-600">MoM Δ — Organic: {trafDelta} {isNewClient ? '' : prevClient.seo_trafficThis ? '(' + round1((trafDelta / prevClient.seo_trafficThis) * 100) + '%)' : ''} • LLM: {llmDelta} • SEO Leads: {leadsDelta} • Local Calls: {localCallsDelta}</div>

      <div className="md:col-span-4">
        <div className="flex items-center justify-between">
          <label className="text-sm">Keywords Worked (with Location & Volume)</label>
          <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg" onClick={addKw}>+ Add Keyword</button>
        </div>
        <div className="mt-2 space-y-1">
          {kw.map((k, i) => (
            <div key={i} className="text-xs flex items-center justify-between border rounded-lg p-2 gap-2">
              <div className="truncate"><b>{k.keyword}</b> • {k.location || '—'} • SV {k.searchVolume} • Rank {k.rankPrev || "-"}→{k.rankNow || "-"} • <a className="underline" href={k.proof || '#'} target="_blank" rel="noreferrer">proof</a></div>
              <button className="text-red-600" onClick={() => setKw(list => list.filter((_, idx) => idx !== i))}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-4">
        <div className="flex items-center justify-between">
          <label className="text-sm">Keywords Ranking in Top 3 (with Volume)</label>
          <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg" onClick={addTop3}>+ Add Top-3 Keyword</button>
        </div>
        <div className="mt-2 space-y-1">
          {top3.map((k, i) => (
            <div key={i} className="text-xs flex items-center justify-between border rounded-lg p-2 gap-2">
              <div className="truncate"><b>{k.keyword}</b> • SV {k.searchVolume} • <a className="underline" href={k.proof || '#'} target="_blank" rel="noreferrer">proof</a></div>
              <button className="text-red-600" onClick={() => setTop3(list => list.filter((_, idx) => idx !== i))}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-4 bg-green-50 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-green-800 mb-3">🔍 Advanced SEO Metrics</h4>
        <div className="grid md:grid-cols-4 gap-3">
          <NumField label="Core Web Vitals Score (1-100)" value={client.seo_coreWebVitals || 0} onChange={v => onChange({ ...client, seo_coreWebVitals: v })} />
          <NumField label="Backlinks Acquired" value={client.seo_backlinks || 0} onChange={v => onChange({ ...client, seo_backlinks: v })} />
          <NumField label="Technical Issues Fixed" value={client.seo_technicalFixes || 0} onChange={v => onChange({ ...client, seo_technicalFixes: v })} />
          <NumField label="Content Pieces Published" value={client.seo_contentPublished || 0} onChange={v => onChange({ ...client, seo_contentPublished: v })} />
          <NumField label="Local Citations Built" value={client.seo_localCitations || 0} onChange={v => onChange({ ...client, seo_localCitations: v })} />
          <NumField label="Schema Markup Implemented" value={client.seo_schemaMarkup || 0} onChange={v => onChange({ ...client, seo_schemaMarkup: v })} />
          <NumField label="Page Speed Score (1-100)" value={client.seo_pageSpeed || 0} onChange={v => onChange({ ...client, seo_pageSpeed: v })} />
          <NumField label="Mobile Usability Score (1-100)" value={client.seo_mobileUsability || 0} onChange={v => onChange({ ...client, seo_mobileUsability: v })} />
        </div>
      </div>
      </div>
    </div>
  );
}

function KPIsOperationsHead({ client, onChange }) {
  const scopeOptions = ["Social Media", "SEO", "Ads"];
  const statusOptions = ["Active", "Upgraded", "Left", "Reduced"];
  const [appDraft, setAppDraft] = useState({ url: '', remark: '' });
  const [escDraft, setEscDraft] = useState({ url: '', remark: '' });
  const openModal = useModal();

  const addAppreciation = () => {
    if (appDraft.url && !isDriveUrl(appDraft.url)) {
      openModal('Invalid Link', 'Use Google Drive link for proof.');
      return;
    }
    const item = { id: uid(), url: appDraft.url || '', remark: appDraft.remark || '' };
    const newApps = [...(client.op_appreciations || []), item];
    onChange({ ...client, op_appreciations: newApps });
    setAppDraft({ url: '', remark: '' });
  };

  const addEscalation = () => {
    if (escDraft.url && !isDriveUrl(escDraft.url)) {
      openModal('Invalid Link', 'Use Google Drive link for proof.');
      return;
    }
    const item = { id: uid(), url: escDraft.url || '', why: escDraft.remark || '' };
    const newEscs = [...(client.op_escalations || []), item];
    onChange({ ...client, op_escalations: newEscs });
    setEscDraft({ url: '', remark: '' });
  };

  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <TextField label="Client Name" value={client.name} onChange={v => onChange({ ...client, name: v })} />
      <MultiSelect
        options={scopeOptions}
        selected={client.op_clientScope || []}
        onChange={v => onChange({ ...client, op_clientScope: v })}
        placeholder="Select Scope"
      />
      <NumField label="Client Satisfaction (1-10)" value={client.op_satisfactionScore || 0} onChange={v => onChange({ ...client, op_satisfactionScore: v })} />
      <div>
        <label className="text-sm">Client Payment Date</label>
        <input type="date" className="w-full border rounded-xl p-2" value={client.op_paymentDate || ''} onChange={e => onChange({ ...client, op_paymentDate: e.target.value })} autoComplete="off" />
      </div>

      <div className="col-span-4">
        <label className="text-sm">Team Finished Scope?</label>
        <input type="checkbox" checked={client.op_teamFinishedScope || false} onChange={e => onChange({ ...client, op_teamFinishedScope: e.target.checked })} autoComplete="off" />
      </div>

      <div className="col-span-2">
        <label className="text-sm">Client Status</label>
        <select className="w-full border rounded-xl p-2" value={client.op_clientStatus || 'Active'} onChange={e => onChange({ ...client, op_clientStatus: e.target.value })}>
          {statusOptions.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {(client.op_clientStatus === 'Upgraded' || client.op_clientStatus === 'Left' || client.op_clientStatus === 'Reduced') && (
        <TextArea label="Reason for status change" value={client.op_clientStatusReason || ''} onChange={v => onChange({ ...client, op_clientStatusReason: v })} rows={2} className="col-span-2" />
      )}

      <TextArea label="Who Performed Well/Poorly" value={client.op_performanceRemarks || ''} onChange={v => onChange({ ...client, op_performanceRemarks: v })} rows={3} className="col-span-2" />
      <TextArea label="Things to do differently next month" value={client.op_comingMonthActions || ''} onChange={v => onChange({ ...client, op_comingMonthActions: v })} rows={3} className="col-span-2" />

      <div className="md:col-span-2">
        <div className="font-medium">Appreciations</div>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive/WhatsApp in Drive) – optional" value={appDraft.url} onChange={e => setAppDraft(d => ({ ...d, url: e.target.value }))} autoComplete="off" />
          <input className="border rounded-xl p-2" placeholder="Remark (client/channel)" value={appDraft.remark} onChange={e => setAppDraft(d => ({ ...d, remark: e.target.value }))} autoComplete="off" />
          <button className="col-span-3 rounded-xl bg-emerald-600 text-white px-3 py-2" onClick={addAppreciation}>+ Add Appreciation</button>
        </div>
      </div>
      <div className="md:col-span-2">
        <div className="font-medium">Escalations</div>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive) – optional" value={escDraft.url} onChange={e => setEscDraft(d => ({ ...d, url: e.target.value }))} autoComplete="off" />
          <input className="border rounded-xl p-2" placeholder="Why did this happen?" value={escDraft.remark} onChange={e => setEscDraft(d => ({ ...d, remark: e.target.value }))} autoComplete="off" />
          <button className="col-span-3 rounded-xl bg-red-600 text-white px-3 py-2" onClick={addEscalation}>+ Add Escalation</button>
        </div>
      </div>
    </div>
  );
}

export function DeptClientsBlock({ currentSubmission, previousSubmission, setModel, monthPrev, monthThis, openModal, closeModal }) {
  const isInternal = ["HR", "Accounts", "Sales", "Blended (HR + Sales)"].includes(currentSubmission.employee.department);
  const isWebHead = currentSubmission.employee.department === "Web Head";
  const isOpsHead = currentSubmission.employee.department === "Operations Head";

  return (
    <Section
      title="KPIs, Reports & Client Report Status"
      number="2"
      info="Enter your key performance indicators based on your department. Include client work, deliverables, and performance metrics. Upload proof links (Google Drive URLs) to validate your achievements. This section is crucial for performance evaluation."
    >
      {(isInternal && !isOpsHead && !isWebHead) ? (
        <InternalKPIs model={currentSubmission} prevModel={previousSubmission} setModel={setModel} monthPrev={monthPrev} monthThis={monthThis} />
      ) : (
        <ClientTable currentSubmission={currentSubmission} previousSubmission={previousSubmission} setModel={setModel} monthPrev={monthPrev} monthThis={monthThis} openModal={openModal} closeModal={closeModal} />
      )}
    </Section>
  );
}

function ClientTable({ currentSubmission, previousSubmission, setModel, monthPrev, monthThis, openModal, closeModal }) {
  const supabase = useSupabase();
  const [draftRow, setDraftRow] = useState({ name: "", scopeOfWork: "", url: "" });
  const [masterClients, setMasterClients] = useState([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  
  const serviceOptions = ['SEO', 'GBP SEO', 'Website Maintenance', 'Social Media', 'Google Ads', 'Meta Ads', 'AI'];
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    client_type: 'Standard',
    team: 'Web',
    scope_of_work: '',
    services: [],
    service_scopes: {}
  });
  const isOpsHead = currentSubmission.employee.department === "Operations Head";
  const isWebHead = currentSubmission.employee.department === "Web Head";
  const isGraphicDesigner = currentSubmission.employee.role?.includes("Graphic Designer");
  const hasClientStatusSection = ["SEO", "Social Media", "Ads", "Operations Head"].includes(currentSubmission.employee.department);

  function pushDraft() {
    console.log('🔍 pushDraft called with:', draftRow);
    
    if (!draftRow.name.trim()) {
      console.log('❌ No client name provided');
      return;
    }
    
    if (draftRow.url && !isDriveUrl(draftRow.url) && !isGensparkUrl(draftRow.url)) {
      console.log('❌ Invalid URL:', draftRow.url);
      openModal('Invalid Link', 'Please paste a Google Drive, Google Docs, or Genspark URL.', closeModal);
      return;
    }
    const base = { id: uid(), name: draftRow.name.trim(), reports: [], relationship: { roadmapSentDate: '', reportSentDate: '', meetings: [], appreciations: [], escalations: [], clientSatisfaction: 0, paymentReceived: false, paymentDate: '' } };
    const withReport = (draftRow.url)
      ? { ...base, reports: [{ id: uid(), label: draftRow.scopeOfWork.trim() || 'Report', url: draftRow.url.trim() }] }
      : base;

    if (isOpsHead) {
      withReport.op_clientScope = [];
      withReport.op_paymentDate = '';
      withReport.op_teamFinishedScope = false;
      withReport.op_satisfactionScore = 0;
      withReport.op_appreciations = [];
      withReport.op_escalations = [];
      withReport.op_clientStatus = 'Active';
      withReport.op_performanceRemarks = '';
      withReport.op_comingMonthActions = '';
    }

    if (isWebHead) {
      withReport.web_saasUpsells = 0;
      withReport.web_saasProof = "";
      withReport.web_pagesThis = 0;
      withReport.web_onTimeThis = 0;
    }

    console.log('✅ Adding client:', withReport);
    console.log('📄 Current clients before update:', currentSubmission.clients);
    
    setModel(m => {
      const updated = { ...m, clients: [...m.clients, withReport] };
      console.log('📄 Updated model with new client:', updated.clients);
      return updated;
    });
    
    setDraftRow({ name: "", scopeOfWork: "", url: "" });
    console.log('✅ Draft row cleared');
  }

  const prevClients = previousSubmission?.clients || [];
  
  useEffect(() => {
    const fetchMasterClients = async () => {
      if (!supabase) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('status', 'Active')
          .order('name');
        
        if (error) throw error;
        setMasterClients(data || []);
      } catch (error) {
        console.error('Error fetching master clients:', error);
      }
    };
    
    fetchMasterClients();
  }, [supabase]);

  const currentTeam = currentSubmission.employee.department === "Social Media" ? "Marketing" : "Web";
  
  const clientNames = useMemo(() => {
    const names = new Set();
    
    masterClients
      .filter(client => client.team === currentTeam)
      .forEach(client => names.add(client.name));
    
    prevClients.forEach(client => names.add(client.name));
    
    return [...names].sort();
  }, [masterClients, prevClients, currentTeam]);

  const addClientFromDropdown = (clientName) => {
    const prevClient = prevClients.find(c => c.name === clientName);
    if (prevClient) {
      const newClient = { ...prevClient, id: uid(), reports: [] };
      setModel(m => ({ ...m, clients: [...m.clients, newClient] }));
      return;
    }
    
    const masterClient = masterClients.find(c => c.name === clientName);
    const newClient = masterClient 
      ? { 
          id: uid(), 
          name: masterClient.name, 
          reports: [], 
          relationship: {},
          client_type: masterClient.client_type,
          team: masterClient.team,
          scope_of_work: masterClient.scope_of_work,
          services: masterClient.services || [],
          service_scopes: masterClient.service_scopes || {}
        }
      : { 
          id: uid(), 
          name: clientName, 
          reports: [], 
          relationship: {},
          services: [],
          service_scopes: {}
        };
    
    setModel(m => ({ ...m, clients: [...m.clients, newClient] }));
  };

  const handleServiceChange = (selectedServices) => {
    setNewClientForm(prev => ({ ...prev, services: selectedServices }));
    const newServiceScopes = { ...prev.service_scopes };
    Object.keys(newServiceScopes).forEach(service => {
      if (!selectedServices.includes(service)) {
        delete newServiceScopes[service];
      }
    });
    setNewClientForm(prev => ({ ...prev, service_scopes: newServiceScopes }));
  };

  const handleServiceScopeChange = (service, field, value) => {
    setNewClientForm(prev => ({
      ...prev,
      service_scopes: {
        ...prev.service_scopes,
        [service]: {
          ...prev.service_scopes[service],
          [field]: value
        }
      }
    }));
  };

  const handleCreateNewClient = async (e) => {
    e.preventDefault();
    if (!supabase || !newClientForm.name.trim()) return;

    try {
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([{
          name: newClientForm.name.trim(),
          client_type: newClientForm.client_type,
          team: newClientForm.team,
          scope_of_work: newClientForm.scope_of_work,
          services: newClientForm.services,
          service_scopes: newClientForm.service_scopes,
          status: 'Active'
        }])
        .select()
        .single();

      if (error) throw error;

      const formClient = {
        id: uid(),
        name: newClient.name,
        reports: [],
        relationship: {},
        client_type: newClient.client_type,
        team: newClient.team,
        scope_of_work: newClient.scope_of_work,
        services: newClient.services,
        service_scopes: newClient.service_scopes
      };

      setModel(m => ({ ...m, clients: [...m.clients, formClient] }));
      
      setMasterClients(prev => [...prev, newClient]);
      
      setNewClientForm({
        name: '',
        client_type: 'Standard',
        team: currentTeam,
        scope_of_work: '',
        services: [],
        service_scopes: {}
      });
      setShowNewClientForm(false);

    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client. Please try again.');
    }
  };

  return (
    <div>
      <p className="text-xs text-gray-600 mb-2">Upload <b>Google Drive</b> or <b>Genspark URL</b> links only (give view access). Use Scope of Work to describe the link (e.g., GA4 Dashboard, Ads PDF, WhatsApp screenshot).</p>
      <div className="flex gap-2 items-center mb-4">
        <label className="text-sm font-medium">Add Client</label>
        <select
          className="flex-1 border rounded-xl p-2 text-sm"
          onChange={(e) => addClientFromDropdown(e.target.value)}
          value=""
        >
          <option value="" disabled>Select from agency clients ({currentTeam} team)...</option>
          {clientNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowNewClientForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New
        </button>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-blue-50">
              <th className="text-left p-2 border">Client</th>
              <th className="text-left p-2 border">Scope of Work</th>
              <th className="text-left p-2 border">Drive/Genspark URL</th>
              <th className="text-left p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSubmission.clients.map(c => (
              <tr key={c.id} className="odd:bg-white even:bg-blue-50/40">
                <td className="p-2 border font-medium">{c.name}</td>
                <td className="p-2 border" colSpan={2}>
                  <TinyLinks
                    items={(c.reports || [])}
                    onAdd={(r) => {
                      if (!isDriveUrl(r.url) && !isGensparkUrl(r.url)) {
                        openModal('Invalid Link', 'Please paste a Google Drive/Docs or Genspark URL link.', closeModal);
                        return;
                      }
                      setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? { ...x, reports: [...(x.reports || []), r] } : x) }));
                    }}
                    onRemove={(id) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? { ...x, reports: x.reports.filter(rr => rr.id !== id) } : x) }))}
                  />
                </td>
                <td className="p-2 border">
                  <button className="text-xs text-red-600" onClick={() => setModel(m => ({ ...m, clients: m.clients.filter(x => x.id !== c.id) }))}>Remove</button>
                </td>
              </tr>
            ))}
            <tr className="bg-amber-50">
              <td className="p-2 border">
                <input className="w-full border rounded-lg p-2" placeholder="Enter client name" value={draftRow.name} onChange={e => setDraftRow(d => ({ ...d, name: e.target.value }))} />
              </td>
              <td className="p-2 border">
                <textarea className="w-full border rounded-lg p-2" rows={2} placeholder="Scope of Work (Dashboard, PDF, WhatsApp…)" value={draftRow.scopeOfWork} onChange={e => setDraftRow(d => ({ ...d, scopeOfWork: e.target.value }))} />
              </td>
              <td className="p-2 border">
                <input className="w-full border rounded-lg p-2" placeholder="Google Drive or Genspark URL (view access)" value={draftRow.url} onChange={e => setDraftRow(d => ({ ...d, url: e.target.value }))} />
              </td>
              <td className="p-2 border">
                <button className="px-3 py-2 rounded-lg bg-blue-600 text-white" onClick={pushDraft}>Add Client</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {currentSubmission.clients.length === 0 && (
        <div className="text-sm text-gray-600 mt-2">Start by typing a client name in the first row, optionally add a Drive link, then hit <b>Add Client</b>. KPIs for that client will appear below.</div>
      )}

      {currentSubmission.clients.map(c => {
        const prevClient = previousSubmission?.clients.find(pc => pc.name === c.name) || {};
        const isNewClient = !previousSubmission || Object.keys(prevClient).length === 0;
        return (
          <div key={c.id} className="border rounded-2xl p-4 my-4 bg-white">
            <div className="font-semibold mb-2">KPIs • {c.name} <span className="text-xs text-gray-500">({monthLabel(monthPrev)} vs {monthLabel(monthThis)})</span></div>
            <ClientScopePreview client={c} department={currentSubmission.employee.department} />
            {currentSubmission.employee.department === 'Web' && (
              <KPIsWeb client={c} prevClient={prevClient} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient} />
            )}
            {currentSubmission.employee.department === 'Social Media' && (
              <KPIsSocial client={c} prevClient={prevClient} employeeRole={currentSubmission.employee.role} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient} />
            )}
            {currentSubmission.employee.department === 'Ads' && (
              <KPIsAds client={c} prevClient={prevClient} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient} />
            )}
            {currentSubmission.employee.department === 'SEO' && (
              <KPIsSEO client={c} prevClient={prevClient} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} monthPrev={monthPrev} monthThis={monthThis} openModal={openModal} closeModal={closeModal} isNewClient={isNewClient} />
            )}
            {isWebHead && (
              <KPIsWebHead client={c} prevClient={prevClient} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient} />
            )}
            {isOpsHead && (
              <KPIsOperationsHead client={c} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} />
            )}
            {hasClientStatusSection && (
              <ClientReportStatus client={c} prevClient={prevClient} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} />
            )}
          </div>
        )
      })}

      {showNewClientForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create New Client</h3>
                <button
                  onClick={() => setShowNewClientForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateNewClient} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={newClientForm.name}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Type *</label>
                <select
                  value={newClientForm.client_type}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, client_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team *</label>
                <select
                  value={newClientForm.team}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, team: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="Web">Web Team</option>
                  <option value="Marketing">Marketing Team</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Services *</label>
                <MultiSelect 
                  options={serviceOptions}
                  selected={newClientForm.services}
                  onChange={handleServiceChange}
                  placeholder="Select services..."
                />
              </div>

              {newClientForm.services.map(service => (
                <div key={service} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-800 mb-3">{service} - Scope Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Deliverables</label>
                      <input
                        type="number"
                        min="1"
                        value={newClientForm.service_scopes[service]?.deliverables || ''}
                        onChange={(e) => handleServiceScopeChange(service, 'deliverables', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={`Number of ${service.toLowerCase()} deliverables per month`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scope Description</label>
                      <textarea
                        rows={2}
                        value={newClientForm.service_scopes[service]?.description || ''}
                        onChange={(e) => handleServiceScopeChange(service, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={`Describe the ${service} scope and requirements...`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <select
                        value={newClientForm.service_scopes[service]?.frequency || 'monthly'}
                        onChange={(e) => handleServiceScopeChange(service, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  value={newClientForm.scope_of_work}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, scope_of_work: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Additional notes or overall scope description..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
