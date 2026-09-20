import{e as w,r as u,s as x,y as v,j as e,m as g,t as j,B as p,a4 as k,V as N,q as E}from"./index-CMsonWhx.js";import{D as S,a as C,b as _,c as P,d as M}from"./dialog-DMYsoKrG.js";import{S as R,a as T,b as D,c as L,d as I}from"./sheet-BWD5v_sL.js";import{u as A}from"./use-mobile-W8yThRFu.js";import{u as B}from"./useEdgeSubscription-hkjlVVqx.js";import{r as O,P as U}from"./renderMarkdown-TCxwW55Q.js";import{a as $}from"./billing-CHdu2Fp_.js";import{Z as z}from"./zap-DEi2SlS_.js";import{S as F}from"./sparkles-Bf7WUOJj.js";import{P as q}from"./plug-DKI8lNpb.js";import{L as Q}from"./layers-DcnxLJxD.js";import{F as W}from"./file-text-F_hq-bZe.js";import{M as H}from"./mail-BG1aXDqi.js";import{C as K}from"./circle-check-BSy2B2je.js";import{L as V}from"./lock-DZyeI31e.js";import{T as Y}from"./textarea-4cmZNNN4.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=w("Radar",[["path",{d:"M19.07 4.93A10 10 0 0 0 6.99 3.34",key:"z3du51"}],["path",{d:"M4 6h.01",key:"oypzma"}],["path",{d:"M2.29 9.62A10 10 0 1 0 21.31 8.35",key:"qzzz0"}],["path",{d:"M16.24 7.76A6 6 0 1 0 8.23 16.67",key:"1yjesh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M17.99 11.66A6 6 0 0 1 15.77 16.67",key:"1u2y91"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"m13.41 10.59 5.66-5.66",key:"mhq4k0"}]]);function G(){const[r,t]=u.useState(null),[i,c]=u.useState(null),[o,n]=u.useState(!0);return u.useEffect(()=>{let a=!1;async function s(){try{const{data:{user:l}}=await x.auth.getUser();if(!l){a||n(!1);return}const{data:h,error:f}=await x.from("user_memory").select("fact_key, fact_value").eq("user_id",l.id).eq("is_current",!0).in("fact_key",["company_name","company","role","title"]);if(f||!h){a||n(!1);return}const m=new Map;for(const d of h)typeof d.fact_value=="string"&&d.fact_value.trim()&&m.set(d.fact_key,d.fact_value.trim());a||(t(m.get("company_name")||m.get("company")||null),c(m.get("role")||m.get("title")||null))}catch(l){console.warn("useProfileBasics: load failed",l)}finally{a||n(!1)}}return s(),()=>{a=!0}},[]),{companyName:r,role:i,loading:o}}const X={board_memo:`## Executive Summary

Our product portfolio delivered **23% revenue growth** this quarter, exceeding the board-approved target by 4 points.

### Key Decisions Required

- Approve $2.4M expansion into enterprise segment
- Ratify the revised go-to-market timeline for Q4
- Review updated risk framework for international markets`,strategy_doc:`## Strategic Direction: Q4 2026

### Market Position

We hold **second position** in the mid-market segment with 18% share. The gap to leader has narrowed from 12 to 7 points.

### Priority Initiatives

1. Accelerate enterprise pipeline with dedicated BDR team
2. Launch self-serve tier to capture SMB demand
3. Expand partner ecosystem from 12 to 25 integrations`,email:`**Subject: Alignment on Q4 Priorities**

Hi team,

Following our strategy review, I want to share three priorities I'd like us to rally around for Q4.

1. **Customer retention** - we need to move NRR from 108% to 115%
2. **Pipeline velocity** - cut average deal cycle from 47 to 35 days
3. **Team capacity** - backfill the two open roles by end of October`,meeting_agenda:`## Leadership Team Weekly - Oct 14

### Pre-read
- Q3 financial close summary (attached)
- Customer churn analysis draft

### Agenda (60 min)

1. **[10 min]** Q3 close highlights - CFO
2. **[15 min]** Churn deep-dive and action plan - VP CS
3. **[15 min]** Q4 hiring plan approval - VP People
4. **[10 min]** Enterprise deal review - CRO
5. **[10 min]** Open items and next steps`,template:`## Weekly Update Template

**Week of:** [date]

### Wins
- [highlight 1]
- [highlight 2]

### Blockers
- [blocker and proposed resolution]

### Key Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Pipeline | $X | $Y | On track |`,systemize:`## Framework: High-Trust Team Building

### The 4-Layer Model

Based on your demonstrated pattern of building high-performing teams, here is your instinct codified:

1. **Safety First** - establish psychological safety before pushing for performance
2. **Clarity of Ownership** - every initiative has exactly one DRI
3. **Rhythm over Rules** - weekly standups, monthly retros, quarterly planning`,teach:`## Teaching Doc: Strategic Thinking

### How I Approach Big-Picture Decisions

When I face a strategic decision, I follow a pattern that has served me well:

1. **Frame the decision** - write down the actual question in one sentence
2. **Map the stakeholders** - who is affected and what do they need?
3. **Identify the reversibility** - is this a one-way or two-way door?`};function J(r,t){const i=Math.ceil((new Date().getMonth()+1)/3);switch(r){case"board_memo":return`Board memo for ${t}, Q${i}`;case"strategy_doc":return`Strategy doc for ${t}, Q${i}`;case"email":return`Email draft for ${t}`;case"meeting_agenda":return`Leadership agenda for ${t}`;case"template":return`Weekly template for ${t}`;case"systemize":return`Leadership framework for ${t}`;case"teach":return`Teaching doc for ${t}`;default:return null}}function ee(r){if(!r)return null;const t=r.toLowerCase();return t.includes("board")||t.includes("memo")?"board_memo":t.includes("strategy")?"strategy_doc":t.includes("email")?"email":t.includes("meeting")||t.includes("agenda")?"meeting_agenda":t.includes("template")?"template":t.includes("systemize")||t.includes("framework")?"systemize":t.includes("teach")?"teach":t.includes("draft")?"email":"strategy_doc"}const te=[{icon:j,text:"Unlimited decision weighs (free is 3 a month)"},{icon:F,text:"Multi-model cross-examination of every decision"},{icon:Z,text:"Decision watch: an alert when a load-bearing assumption weakens"},{icon:q,text:"Live MCP pull of your skills into any AI"},{icon:U,text:"Unlimited drafting: emails, memos, strategy docs"},{icon:Q,text:"Framework generation from your strengths"},{icon:W,text:"Edge artifacts: agendas, templates, board memos"},{icon:H,text:"Email delivery of generated artifacts"}],ae=["Read-write Memory Web","Voice profile","Blind Spot reflections","Daily personalised briefing","3 decision weighs a month"],y=$;function b({capability:r,onClose:t,onSubscribe:i,isProcessing:c}){const{companyName:o}=G(),n=r==="free_quota_exhausted";return e.jsxs("div",{className:"space-y-5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2.5 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20",children:e.jsx(z,{className:"h-5 w-5 text-accent"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-bold text-foreground",children:n?"Your free weighs this month are used":"Unlimited weighs, cross-examined, plus Edge artifacts"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:n?"Free covers 3 decision weighs a month. Edge Pro removes the cap and adds a multi-model cross-examination of every decision.":r?`Required for: ${r}`:`Unlimited decisions, the live pull of your skills, and Edge artifacts. ${y}.`})]})]}),(()=>{const a=ee(r),s=a?X[a]:null;if(!s)return null;const l=o?J(a,o):null;return e.jsxs(g.div,{initial:{opacity:0,y:8},animate:{opacity:1,y:0},transition:{delay:.15},className:"relative rounded-xl border border-border overflow-hidden",children:[l&&e.jsx("div",{className:"px-4 pt-3 pb-1 bg-accent/5 border-b border-border",children:e.jsx("p",{className:"text-[11px] font-medium text-accent",children:l})}),e.jsx("div",{className:"p-4 max-h-32 overflow-hidden text-xs",dangerouslySetInnerHTML:{__html:O(s)}}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"}),e.jsx("div",{className:"absolute bottom-0 inset-x-0 h-16 backdrop-blur-[3px] bg-background/50 flex items-end justify-center pb-3",children:e.jsx("span",{className:"text-[11px] text-accent font-medium",children:"Unlock to generate the full artifact"})})]})})(),e.jsx("div",{className:"space-y-3",children:te.map((a,s)=>(a.icon,e.jsxs(g.div,{initial:{opacity:0,x:-8},animate:{opacity:1,x:0},transition:{delay:s*.05},className:"flex items-start gap-3",children:[e.jsx(K,{className:"h-4 w-4 text-accent flex-shrink-0 mt-0.5"}),e.jsx("span",{className:"text-sm text-foreground",children:a.text})]},s)))}),e.jsxs("div",{className:"rounded-xl border border-border bg-muted/30 p-3",children:[e.jsx("p",{className:"text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",children:"Free tier still includes"}),e.jsx("ul",{className:"mt-1.5 space-y-1",children:ae.map(a=>e.jsx("li",{className:"text-xs text-foreground/80",children:a},a))})]}),e.jsxs("div",{className:"text-center py-2",children:[e.jsx("span",{className:"text-3xl font-bold text-foreground",children:y}),e.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:"Cancel anytime"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs(p,{onClick:i,disabled:c,className:"w-full gap-2",size:"lg",children:[e.jsx(V,{className:"h-4 w-4"}),c?"Redirecting...":"Start Edge Pro"]}),e.jsx(p,{onClick:t,variant:"ghost",className:"w-full text-muted-foreground",children:"Maybe later"})]}),e.jsx("p",{className:"text-[10px] text-muted-foreground/60 text-center",children:"Secure checkout via Stripe. Cancel anytime from your account."})]})}const re=v.memo(({isOpen:r,onClose:t,capability:i})=>{const c=A(),{subscribe:o,isProcessing:n}=B(),a=u.useCallback(async()=>{const s=await o();s&&(window.location.href=s)},[o]);return c?e.jsx(R,{open:r,onOpenChange:t,children:e.jsxs(T,{side:"bottom",className:"rounded-t-2xl px-6 pb-8 pt-6",children:[e.jsxs(D,{className:"sr-only",children:[e.jsx(L,{children:"Unlock Edge Pro"}),e.jsx(I,{children:"Upgrade to access all Edge capabilities"})]}),e.jsx(b,{capability:i,onClose:t,onSubscribe:a,isProcessing:n})]})}):e.jsx(S,{open:r,onOpenChange:t,children:e.jsxs(C,{className:"sm:max-w-md",children:[e.jsxs(_,{className:"sr-only",children:[e.jsx(P,{children:"Unlock Edge Pro"}),e.jsx(M,{children:"Upgrade to access all Edge capabilities"})]}),e.jsx(b,{capability:i,onClose:t,onSubscribe:a,isProcessing:n})]})})});re.displayName="EdgePaywall";function we({transcript:r,rawTranscript:t,refined:i,editedText:c,onEditedTextChange:o,onConfirm:n,onDismiss:a,confirmLabel:s="Use this transcript",className:l}){const[h,f]=u.useState(!1),m=i&&t!=null&&t.trim().length>0&&t.trim()!==r.trim();return e.jsxs("div",{className:E("space-y-3 rounded-xl border border-border/60 bg-card/40 p-4",l),children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-medium text-muted-foreground",children:"Review transcript"}),e.jsx("p",{className:"text-[11px] text-muted-foreground/80 mt-0.5",children:"Edit if anything looks wrong. What you confirm is what we use."})]}),e.jsx(Y,{value:c,onChange:d=>o(d.target.value),rows:6,className:"text-sm resize-y min-h-[120px] bg-background/80","aria-label":"Edit transcript before continuing"}),m&&e.jsxs("div",{className:"space-y-1",children:[e.jsxs("button",{type:"button",onClick:()=>f(d=>!d),className:"flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",children:[h?e.jsx(k,{className:"h-3.5 w-3.5"}):e.jsx(N,{className:"h-3.5 w-3.5"}),"Original transcription (before cleanup)"]}),h&&e.jsx("p",{className:"text-xs text-muted-foreground/90 whitespace-pre-wrap rounded-md bg-muted/40 p-2 border border-border/40",children:t})]}),e.jsxs("div",{className:"flex flex-wrap gap-2 pt-1",children:[e.jsx(p,{type:"button",size:"sm",onClick:n,className:"flex-1 sm:flex-none",children:s}),a&&e.jsx(p,{type:"button",size:"sm",variant:"outline",onClick:a,children:"Cancel"})]})]})}export{re as E,we as T};
