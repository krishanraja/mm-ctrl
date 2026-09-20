import{j as e,q as a}from"./index-I2BQEZoH.js";const r="ctrl-skeleton-styles",o=`
@keyframes ctrlSkShimmer { 0%{ background-position:-160% 0 } 100%{ background-position:160% 0 } }
@keyframes ctrlSkSweep { 0%{ transform:translateX(-10%) } 100%{ transform:translateX(110%) } }
@keyframes ctrlSkDot { 0%,100%{ opacity:.3; transform:translateY(0) } 50%{ opacity:1; transform:translateY(-2px) } }
.ctrl-sk{ background:linear-gradient(90deg,#12161d 25%,#1b212b 50%,#12161d 75%); background-size:220% 100%;
  animation:ctrlSkShimmer 1.5s ease-in-out infinite; border-radius:7px; }
.ctrl-sk-hero::after{ content:""; position:absolute; inset:0;
  background:linear-gradient(105deg, transparent 40%, color-mix(in srgb, hsl(var(--accent)) 10%, transparent) 50%, transparent 60%);
  width:55%; animation:ctrlSkSweep 1.6s ease-in-out infinite; }
.ctrl-sk-dot{ animation:ctrlSkDot 1.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce){
  .ctrl-sk, .ctrl-sk-hero::after, .ctrl-sk-dot{ animation:none !important; }
}
`;function n(){if(typeof document>"u"||document.getElementById(r))return;const t=document.createElement("style");t.id=r,t.textContent=o,document.head.appendChild(t)}function s({className:t}){return n(),e.jsx("span",{className:a("ctrl-sk block",t),"aria-hidden":"true"})}function m({variant:t="feed",className:l}){n();const i=t==="lead"?"h-[170px]":t==="tile"?"h-[112px]":"h-[128px]";return e.jsxs("div",{className:a("flex flex-col overflow-hidden rounded-[18px] border border-border","bg-[linear-gradient(180deg,#0e131b,#0a0e12)]",l),"aria-hidden":"true",children:[e.jsx("div",{className:a("ctrl-sk-hero ctrl-motif-band relative overflow-hidden",i)}),e.jsxs("div",{className:"flex flex-col gap-[11px] p-[15px_17px_16px]",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx(s,{className:"h-[11px] w-[42%]"}),e.jsx(s,{className:"h-[11px] w-[18%]"})]}),e.jsx(s,{className:"h-[15px] w-[94%]"}),e.jsx(s,{className:"h-[15px] w-[72%]"}),e.jsx(s,{className:"h-[10px] w-[88%]"}),e.jsx("div",{className:"mt-1 flex",children:e.jsx(s,{className:"h-[9px] w-[34%]"})})]})]})}function x({children:t}){return n(),e.jsxs("div",{className:"flex items-center justify-center gap-2 py-2 text-[11px] text-muted-foreground",children:[e.jsxs("span",{className:"inline-flex gap-[3px]",children:[e.jsx("span",{className:"ctrl-sk-dot h-1 w-1 rounded-full bg-accent"}),e.jsx("span",{className:"ctrl-sk-dot h-1 w-1 rounded-full bg-accent",style:{animationDelay:".18s"}}),e.jsx("span",{className:"ctrl-sk-dot h-1 w-1 rounded-full bg-accent",style:{animationDelay:".36s"}})]}),t]})}export{x as L,s as S,m as a};
