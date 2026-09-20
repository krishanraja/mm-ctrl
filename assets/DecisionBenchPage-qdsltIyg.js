import{r as u,j as e}from"./index-CMsonWhx.js";import{D as E,a as B,c as O,d as D}from"./dialog-DMYsoKrG.js";import{o as f,s as t,a as y,b as Q,l as I,n as Y,Z as M,e as W}from"./types-9a_QLykC.js";import{C as U}from"./check-DrDJqkHO.js";import{C as J}from"./copy-Bzy9IkQI.js";import{A}from"./arrow-right-B9zcM4fB.js";import{S as Z}from"./search-CRx0oBhm.js";import{H as z}from"./history-BLW4z-js.js";import{A as X}from"./arrow-left-D9l3xt3O.js";import"./index-DfWcrk5A.js";const K={"ROUTE-A":{id:"ROUTE-A",tabLabel:"Rebuild now",title:"Rebuild the function this quarter.",summary:"A small AI-native team replaces the current production model and learns through immediate responsibility.",personal:"Fits your appetite to move.",detail:"It risks automating output before your way of judging quality can travel.",support:"41% of recorded time sits in routine content work. Nine of twelve AI variants repeated the same category frame.",oppose:"Judgement transfer has not survived unfamiliar work. The board expects staged commitments.",counter:"The old structure may absorb any pilot. A clean break could be the only way to expose the real roles.",question:"Is speed worth an unproved quality system?",effect:"Choose this only if structural learning matters more than containing the first mistake."},"ROUTE-B":{id:"ROUTE-B",tabLabel:"Prove the system first",title:"Prove the new system on one important campaign.",summary:"A separate AI-native route competes blind against the current process before roles are redesigned.",personal:"Uses how you judge best.",detail:"Concrete comparison makes your standards precise while protecting surprise and final accountability.",support:"Customer recall, the work audit, your corrected delegation view and the broken scorecard all point here.",oppose:"A pilot can become theatre if it keeps the current measures or has no authority to work differently.",counter:"The volume incentives may be more causal than judgement transfer. The test must change both or it proves little.",question:"What result would earn the larger rebuild?",effect:"Name the customer proof, human judgement and kill condition before choosing people or tools."},"ROUTE-C":{id:"ROUTE-C",tabLabel:"Add tools gradually",title:"Keep the team and add tools role by role.",summary:"Each person adopts AI inside the current job while the organisation learns with minimal disruption.",personal:"Conflicts with your current diagnosis.",detail:"You believe the weekly work and measures are wrong, not only that people lack access to tools.",support:"It is the easiest story internally and creates the least immediate disruption.",oppose:"The workshop produced 43 use cases but no shared priorities. Current measures reward volume and deadlines.",counter:"Distributed adoption may surface unexpected high-agency builders without prematurely redesigning roles.",question:"Can the old measures produce a new system?",effect:"Choose this only if adoption evidence matters more than changing the work itself."}},ee={"ROUTE-A":[{kind:"YOU CAN ANSWER",question:"What would make you regret rebuilding the team this quickly?",why:"Pick the risk that matters most. The Brain will turn it into a limit for the first move.",effect:"The first move must make this risk easy to stop or reverse.",mode:"answer",choices:["Customer work gets worse","The best people leave","Maya still fixes everything","Costs rise before we learn","Something else"],source:"Raised from the board note and Maya's final-accountability standard."},{kind:"THE BRAIN CAN CHECK",question:"Before changing any role, what should the Brain check first?",why:"You do not need to know this already. Pick one and the Brain can look through the work.",effect:"The answer could change which roles stay, change or lead the rebuild.",mode:"find",choices:["Who improves customer results","Who spots weak ideas early","Which work AI already does well","Which measures cause the problem"],source:"Raised from the work audit, campaign review and customer evidence."},{kind:"A SIMILAR DECISION",question:"Last time the team changed but the measures did not. What changes first this time?",why:"An earlier synthetic decision shows that new roles alone did not change the work.",effect:"If the measures stay the same, a new team may repeat the old behaviour.",mode:"history",choices:["The measures","Who owns final quality","The work process","The customer goal","Something else"],source:"Matched to synthetic decision DEC-MAYA-014."}],"ROUTE-B":[],"ROUTE-C":[{kind:"YOU CAN ANSWER",question:"What could gradual AI use teach you that the workshop did not?",why:"Pick the one thing you need to learn before making a bigger change.",effect:"Without one clear learning goal, gradual use may create activity without answering the decision.",mode:"answer",choices:["Which work matters","Who learns fastest","What customers value","Which roles should change","Something else"],source:"Raised from the team workshop and Maya's current view."},{kind:"THE BRAIN CAN CHECK",question:"What should the Brain look for in the current team?",why:"Pick the proof that would make gradual change worth considering.",effect:"The answer could show whether the current team can build the new way of working.",mode:"find",choices:["Better customer results","Less final fixing by Maya","Stronger ideas","Safer, faster work"],source:"Raised from the campaign review, customer evidence and scorecard gap."},{kind:"A SIMILAR DECISION",question:"The team found 43 possible AI uses but chose none. Who chooses the first three this time?",why:"This comes from a synthetic earlier workshop. It shows the old process did not set a priority.",effect:"Without one clear owner, the team may create more ideas without changing the work.",mode:"history",choices:["Maya","One named leader","Customer evidence","A small team vote","Something else"],source:"Matched to the synthetic team workshop and strategy draft."}]},ne={leader_can_answer:"YOU CAN ANSWER",brain_can_find:"THE BRAIN CAN CHECK",prior_decision_match:"A SIMILAR DECISION"},te={leader_can_answer:"answer",brain_can_find:"find",prior_decision_match:"history"};function se(n,s){return s!==n.decision_sharpening.default_route?ee[s]:n.decision_sharpening.default_route_questions.map(i=>{var o;return{kind:ne[i.kind],question:i.question,why:i.why_it_matters,effect:i.decision_effect,mode:te[i.kind],choices:i.choices,source:i.prior_decision_ref?`Matched to synthetic decision ${i.prior_decision_ref}.`:`Raised from ${((o=i.source_refs)==null?void 0:o.length)??0} linked synthetic sources.`}})}function ae(n){return n.map((s,i)=>`${i+1}. ${s}`).join(`
`)}function q(n){return n.map(s=>`- ${s}`).join(`
`)}function ie(n,s){const i=n.sources.find(o=>o.id===s);if(!i)throw new Error(`Missing source ${s}`);return`${i.label}: ${i.assertion}`}function re(n,s=[],i="Stop if the new route produces more material but still needs Maya to rescue the central idea."){const o=n.decision.routes.map((r,h)=>`${String.fromCharCode(65+h)}. ${r.name}: ${r.plain_summary} Upside: ${r.upside} Risk: ${r.risk}`),c=["SRC-203","SRC-205","SRC-207","SRC-208","SRC-211","SRC-209"],a=n.corrections[0],l=n.standards.find(r=>r.id==="STD-205"),m=[`You are helping ${n.subject.display_name}, the synthetic ${n.subject.role.toLowerCase()} of ${n.subject.organisation}, think through a consequential operating-model decision. ${n.disclosure}`,"","DECISION",`${n.decision.title} ${n.decision.stakes}`,"","MAYA'S CURRENT VIEW",n.decision.provisional_view,"","SUPPORTED BRAIN READ",`${n.current_read.plain_summary} Strongest counter-case: ${n.current_read.counter_case}`,"","HOW MAYA JUDGES",ae([...n.personal_portrait.patterns.filter(r=>r.id!=="PAT-204").map(r=>r.statement),`${a.to} This replaced: ${a.from}`,(l==null?void 0:l.test)??"A named human remains accountable for final consequential release."]),"","THREE ROUTES",o.join(`
`),"","IMPORTANT SYNTHETIC EVIDENCE",q(c.map(r=>ie(n,r))),"","UNKNOWNS",q(n.unknowns.map(r=>r.question)),"","CURRENT TEST LIMIT",i,"","DO NOT ASSUME",q(n.claude_handoff.forbidden_assumptions),"","YOUR TASK",n.claude_handoff.desired_output,q(n.claude_handoff.output_shape)].join(`
`);if(s.length===0)return m;const d=s.map((r,h)=>`${h+1}. ${r.standing}
Question: ${r.question}
Input: ${r.input}`).join(`

`);return`${m}

NEW DECISION-SHARPENING INPUTS
${d}

Treat leader answers as direct input, pending evidence tasks as unknown, and prior-decision matches as prompts for scrutiny rather than proof.`}function oe(n){const s=n.returned_claude_example.brain_audit;return[{title:"This does not choose a real operating model.",body:s.generic_reasoning[0],reference:`Conflicts with: ${n.standards[0].name}.`},{title:"Efficiency has replaced the actual goal.",body:s.generic_reasoning[1],reference:"Evidence: campaign review and two-week work audit."},{title:"The human owner is missing.",body:s.standard_conflicts[2],reference:`Conflicts with: ${n.standards[4].name}.`},{title:"These measures repeat the problem.",body:s.standard_conflicts[1],reference:"Evidence: current marketing scorecard."},{title:"Keep this part.",body:s.additive_material[0],reference:"Supported by: synthetic board planning note.",keep:!0}]}const ce=`{
  "fixture_version": "4.0.0",
  "fixture_status": "synthetic_demo",
  "as_of": "2026-09-09T01:50:00+01:00",
  "disclosure": "Maya Chen, Aperture House, every source, number, decision and output in this fixture are synthetic. They demonstrate a proposed product experience, not a real person, company or diagnostic result.",
  "subject": {
    "id": "SYN-CUST-014",
    "display_name": "Maya Chen",
    "role": "Founder and CEO",
    "organisation": "Aperture House",
    "proof_day": 11,
    "proof_length_days": 30,
    "brain_name": "Maya's Brain",
    "primary_aim": "Make the company's creative judgement transferable without making the work formulaic."
  },
  "decision": {
    "id": "DEC-MAYA-021",
    "title": "How far should Maya rebuild marketing around AI now?",
    "stakes": "A proposed twelve-month marketing redesign with a synthetic GBP 1.2 million operating budget and eight affected roles.",
    "status": "forming",
    "decision_by": "2026-09-18",
    "provisional_view": "Move faster than an incremental tools rollout, but do not replace the whole function before the new quality system has survived real customer work.",
    "owned_call": false,
    "routes": [
      {
        "id": "ROUTE-A",
        "name": "Rebuild now",
        "plain_summary": "Redesign the function around a small AI-native team this quarter.",
        "upside": "Fast structural learning and a clear break from content-volume incentives.",
        "risk": "The company could automate production before it has made Maya's quality standard transferable.",
        "evidence_for": ["SRC-203", "SRC-205", "SRC-208"],
        "evidence_against": ["SRC-202", "SRC-206", "SRC-209"]
      },
      {
        "id": "ROUTE-B",
        "name": "Prove the new system first",
        "plain_summary": "Run one category campaign through a new AI-native operating model, then use the evidence to redesign roles.",
        "upside": "Tests the quality system, customer response and role requirements together.",
        "risk": "A contained pilot may be absorbed by the existing process and fail to create structural change.",
        "evidence_for": ["SRC-201", "SRC-202", "SRC-204", "SRC-210"],
        "evidence_against": ["SRC-203", "SRC-207"]
      },
      {
        "id": "ROUTE-C",
        "name": "Add tools gradually",
        "plain_summary": "Keep the structure and encourage each role to adopt AI in its current work.",
        "upside": "Lowest immediate disruption and easiest internal story.",
        "risk": "Preserves the incentives and weekly work pattern that Maya already believes are wrong.",
        "evidence_for": ["SRC-209"],
        "evidence_against": ["SRC-203", "SRC-205", "SRC-207", "SRC-208"]
      }
    ]
  },
  "current_read": {
    "title": "The risky move is not going too fast. It is rebuilding around output before Maya has transferred what good looks like.",
    "plain_summary": "Maya is ready to change the structure. The missing piece is proof that another person can use her standards on unfamiliar work without copying her.",
    "standing": "supported_synthesis",
    "confidence": "supported_not_settled",
    "source_refs": ["SRC-201", "SRC-202", "SRC-204", "SRC-206", "SRC-210"],
    "counter_case": "The current incentives may be the stronger cause. If volume and deadlines remain the visible measures, even a well-transferred quality standard could lose.",
    "counter_source_refs": ["SRC-203", "SRC-207"],
    "important_unknown": "Can the new operating model produce one unfamiliar campaign Maya would ship after no more than a final polish pass?"
  },
  "personal_portrait": {
    "headline": "Maya is moving from being the final quality filter to designing how other people see quality earlier.",
    "patterns": [
      {
        "id": "PAT-201",
        "name": "Fast diagnosis",
        "statement": "Maya spots why work is wrong faster than she can state the positive rule in advance.",
        "standing": "supported_pattern",
        "source_refs": ["SRC-202", "SRC-204"]
      },
      {
        "id": "PAT-202",
        "name": "Concrete comparison",
        "statement": "Her judgement becomes precise when she compares real options. Abstract questions produce rules she later qualifies.",
        "standing": "supported_pattern",
        "source_refs": ["SRC-204", "SRC-210"]
      },
      {
        "id": "PAT-203",
        "name": "Surprise protected",
        "statement": "She wants a recognisable standard but will reject any rule that blocks a genuinely new idea.",
        "standing": "direct_standard",
        "source_refs": ["SRC-206"]
      },
      {
        "id": "PAT-204",
        "name": "Delegation interpretation corrected",
        "statement": "Maya does not resist delegation itself. She takes work back when the quality reasoning reaches her too late.",
        "standing": "corrected_synthesis",
        "source_refs": ["SRC-201", "SRC-210", "COR-201"]
      }
    ],
    "growth_frontier": "Make the earliest quality signals explicit enough for other people to challenge and use, while Maya stays accountable for the final call.",
    "growth_source_refs": ["SRC-201", "SRC-206", "SRC-210"]
  },
  "standards": [
    {
      "id": "STD-201",
      "kind": "standard",
      "name": "Only Aperture House would say it",
      "test": "The central claim should arise from the company's actual customer view, not category language any competitor could borrow.",
      "source_refs": ["SRC-202", "SRC-205"]
    },
    {
      "id": "STD-202",
      "kind": "anti_standard",
      "name": "Polished but interchangeable",
      "test": "Reject complete-looking work whose idea, evidence and tone could belong to another company.",
      "source_refs": ["SRC-202"]
    },
    {
      "id": "STD-203",
      "kind": "standard",
      "name": "Specific before confident",
      "test": "A strong direction names the customer behaviour, number or observed mechanism that earns its confidence.",
      "source_refs": ["SRC-205", "SRC-208"]
    },
    {
      "id": "STD-204",
      "kind": "boundary",
      "name": "Do not turn taste into a formula",
      "test": "Criteria should help the team notice and argue, not force every new idea to resemble the last approved one.",
      "source_refs": ["SRC-206", "SRC-210"]
    },
    {
      "id": "STD-205",
      "kind": "release_standard",
      "name": "Human final accountability",
      "test": "AI may prepare, compare and audit. Maya or a named human owner still polishes and releases consequential work.",
      "source_refs": ["SRC-201", "SRC-209"]
    }
  ],
  "unknowns": [
    {
      "id": "UNK-201",
      "question": "Would customers find the bolder category position more useful or merely more interesting?",
      "why_it_matters": "It separates creative novelty from commercial value.",
      "smallest_test": "Show both directions to six current buyers without telling them which one Maya prefers."
    },
    {
      "id": "UNK-202",
      "question": "Can another leader apply Maya's standard to unfamiliar work without her rescuing the final idea?",
      "why_it_matters": "The role redesign depends on judgement transfer, not prompt fluency.",
      "smallest_test": "Run one blinded campaign brief through the proposed new operating model."
    },
    {
      "id": "UNK-203",
      "question": "Which current tasks disappear, and which new human responsibilities appear?",
      "why_it_matters": "Role titles should follow the work design, not precede it.",
      "smallest_test": "Map one campaign from raw evidence to release and mark every handoff, judgement and accountability point."
    },
    {
      "id": "UNK-204",
      "question": "Will existing volume incentives overpower the new quality standard?",
      "why_it_matters": "A new team structure can still reproduce the old behaviour.",
      "smallest_test": "Draft the three measures the pilot will reward before selecting people or tools."
    }
  ],
  "sources": [
    {
      "id": "SRC-201",
      "kind": "consented_transcript",
      "label": "Opening conversation",
      "observed_at": "2026-08-29",
      "audience": "customer_private",
      "assertion": "I want them to bring me work that is nearly there, not more options I have to rescue."
    },
    {
      "id": "SRC-202",
      "kind": "consented_transcript",
      "label": "Strategy session 1",
      "observed_at": "2026-09-03",
      "audience": "customer_private",
      "assertion": "The launch was polished, but it could have belonged to anyone. Nobody could tell me what only we would say."
    },
    {
      "id": "SRC-203",
      "kind": "work_audit",
      "label": "Synthetic two-week marketing work audit",
      "observed_at": "2026-09-04",
      "audience": "customer_private",
      "assertion": "The eight-person marketing function spent a synthetic 41 percent of recorded time producing, adapting or approving routine channel content."
    },
    {
      "id": "SRC-204",
      "kind": "operator_note",
      "label": "Krish private session note",
      "observed_at": "2026-09-03",
      "audience": "operator_private",
      "assertion": "Maya became precise only when comparing two concrete directions. Abstract questions produced principles she later contradicted."
    },
    {
      "id": "SRC-205",
      "kind": "customer_research",
      "label": "Synthetic customer interview synthesis",
      "observed_at": "2026-09-05",
      "audience": "customer_private",
      "assertion": "Seven of ten synthetic customers remembered Aperture House for diagnosing a category problem plainly; two could recall its recent campaign theme."
    },
    {
      "id": "SRC-206",
      "kind": "customer_reply",
      "label": "Maya email reply",
      "observed_at": "2026-09-05",
      "audience": "customer_private",
      "assertion": "I do not want a brand rulebook so tight that the next good idea gets rejected for being new."
    },
    {
      "id": "SRC-207",
      "kind": "operating_data",
      "label": "Synthetic marketing scorecard",
      "observed_at": "2026-09-06",
      "audience": "customer_private",
      "assertion": "The current scorecard tracks output volume, publishing cadence and deadline completion. It has no measure for distinctiveness, customer usefulness or quality reasoning."
    },
    {
      "id": "SRC-208",
      "kind": "work_sample",
      "label": "Synthetic campaign review",
      "observed_at": "2026-09-06",
      "audience": "customer_private",
      "assertion": "The AI-assisted campaign produced twelve usable variants quickly, but nine repeated the same historical category frame and none cited fresh customer evidence."
    },
    {
      "id": "SRC-209",
      "kind": "board_note",
      "label": "Synthetic board planning note",
      "observed_at": "2026-09-07",
      "audience": "customer_private",
      "assertion": "The board supports a material operating-model change but expects named accountability, customer evidence and staged financial commitments."
    },
    {
      "id": "SRC-210",
      "kind": "voice_reflection",
      "label": "Maya voice reflection",
      "observed_at": "2026-09-07",
      "audience": "customer_private",
      "assertion": "I do not need the team to imitate me. I need them to notice what I notice before I have to fix it."
    },
    {
      "id": "SRC-211",
      "kind": "team_workshop",
      "label": "Synthetic team workshop",
      "observed_at": "2026-09-08",
      "audience": "customer_private",
      "assertion": "The team generated forty-three possible AI uses but could not agree which three would change customer value or role design."
    },
    {
      "id": "SRC-212",
      "kind": "strategy_draft",
      "label": "Synthetic strategy draft",
      "observed_at": "2026-09-08",
      "audience": "customer_private",
      "assertion": "The current proposal names tools and target savings but does not define the future customer proposition, quality system or human accountability model."
    }
  ],
  "corrections": [
    {
      "id": "COR-201",
      "from": "Maya keeps final work because she fundamentally distrusts delegation.",
      "to": "Maya delegates generation but takes work back when quality reasoning arrives too late.",
      "status": "accepted_and_repaired",
      "source_refs": ["SRC-201", "SRC-210"]
    }
  ],
  "prior_decisions": [
    {
      "id": "DEC-MAYA-014",
      "title": "Whether to reorganise client strategy around category teams",
      "status": "synthetic_historical_match",
      "decision": "Change the team shape while retaining the existing marketing scorecard.",
      "observed_result": "The synthetic six-week review found that work still optimised for output volume and deadlines because the measures had not changed.",
      "relevance_to_current_decision": "A new team structure can reproduce the old behaviour when nobody owns a different definition of success.",
      "source_refs": ["SRC-207", "SRC-209"]
    }
  ],
  "decision_sharpening": {
    "presentation_rule": "Keep the main decision table unchanged apart from one clear invitation. Open one contextual question at a time in a deeper layer.",
    "answering_rule": "The Brain carries the difficult interpretation. The leader gets a concrete question, one-tap choices and an optional note. Free text is never the first demand.",
    "default_route": "ROUTE-B",
    "question_classes": [
      {
        "kind": "leader_can_answer",
        "purpose": "Elicit an important judgement the leader knows but may not have thought to state."
      },
      {
        "kind": "brain_can_find",
        "purpose": "Name evidence the leader may not know and offer to find it in available work."
      },
      {
        "kind": "prior_decision_match",
        "purpose": "Surface a source-backed pattern from a relevant earlier decision without pretending analogy proves the answer."
      }
    ],
    "default_route_questions": [
      {
        "kind": "leader_can_answer",
        "question": "Before work goes out, what do you usually fix first?",
        "choices": ["The main idea", "The proof", "The tone", "Who it is for", "Something else"],
        "why_it_matters": "This shows what good work means to Maya.",
        "decision_effect": "The pilot must test whether someone else spots it too.",
        "source_refs": ["SRC-201", "SRC-210"]
      },
      {
        "kind": "brain_can_find",
        "question": "Before changing the team, which fact would you most want to know?",
        "choices": ["Which work customers value", "Where Maya changes the outcome", "Which measures reward the wrong thing", "Who already works well with AI"],
        "why_it_matters": "Maya does not need to know this already. The Brain can look for the chosen fact.",
        "decision_effect": "The answer could show whether to change the people, the measures or the work first.",
        "source_refs": ["SRC-203", "SRC-205", "SRC-207", "SRC-208"]
      },
      {
        "kind": "prior_decision_match",
        "question": "A previous team change kept the old measures. The old behaviour came back. What would stop that happening again?",
        "choices": ["One owner for the new measures", "A customer result we must hit", "A budget limit", "A clear stop rule", "Something else"],
        "why_it_matters": "The earlier synthetic decision is a warning, not proof.",
        "decision_effect": "If nobody owns a new measure of success, this pilot may repeat the same mistake.",
        "prior_decision_ref": "DEC-MAYA-014"
      }
    ]
  },
  "recommended_move": {
    "title": "Prove the quality system before fixing the org chart.",
    "reason": "A contained campaign can test customer value, judgement transfer, new role responsibilities and incentives at the same time.",
    "method": "Run one strategically important campaign through a separate AI-native operating model. Compare it blind against the current process. Maya makes the final call and records the earliest signal that changed it.",
    "decision_effect": "If the new route wins on customer usefulness and requires no final rescue, Route B earns evidence for a larger rebuild. If it fails, Maya learns whether the missing ingredient is the standard, the people, the incentives or the category proposition.",
    "source_refs": ["SRC-202", "SRC-203", "SRC-205", "SRC-207", "SRC-208", "SRC-210"]
  },
  "claude_handoff": {
    "desired_output": "Design two materially different twelve-week pilot operating models and recommend one. Each must cover work flow, human judgement points, AI roles, measures, customer proof, cost gates and failure conditions.",
    "forbidden_assumptions": [
      "Do not assume faster content production is the goal.",
      "Do not recommend named-person replacement or performance judgement.",
      "Do not treat synthetic numbers as real company evidence.",
      "Do not collapse Maya's standards into a rigid brand formula.",
      "Do not claim that AI output or model agreement proves quality."
    ],
    "output_shape": [
      "State the decision in one plain sentence.",
      "Give two genuinely different pilot designs.",
      "For each, name the causal bet, work design, human judgement, evidence required, cost gate and kill condition.",
      "Recommend one and state the strongest counter-case.",
      "Separate supplied evidence, inference and new suggestion.",
      "List the three questions Maya must answer herself."
    ]
  },
  "returned_claude_example": {
    "text": "Aperture House should embrace an AI-first marketing transformation. Start by training the team on leading AI tools, automate content creation and use a human-in-the-loop process to maintain quality. This will unlock efficiency while empowering the team to focus on strategy. Track engagement and output to prove success, then scale the programme across the company.",
    "provenance": "synthetic_claude_suggestion",
    "brain_audit": {
      "verdict": "Do not use this yet.",
      "generic_reasoning": [
        "It repeats the standard tools, training, automation and scale sequence without choosing a future operating model.",
        "It treats content efficiency as the goal even though the Brain says customer usefulness and judgement transfer are the decision."
      ],
      "missing_evidence": [
        "No cost gate against the synthetic GBP 1.2 million budget.",
        "No test of whether another leader can apply Maya's standard.",
        "No customer proof or kill condition."
      ],
      "standard_conflicts": [
        "Uses category language that any company could adopt.",
        "Measures engagement and output despite the current incentive problem.",
        "Says human in the loop without naming who owns the final judgement."
      ],
      "additive_material": [
        "A staged rollout is directionally compatible with the board's demand for staged commitments."
      ],
      "sharpening_instruction": "Rebuild the answer around one customer-facing campaign, two competing operating models, named human judgement points, a budget gate and an explicit failure condition."
    }
  },
  "sparse_fallback": {
    "known": "Maya rejects polished work that could belong to anyone.",
    "unknown": "The Brain does not yet know which positive signal she trusts first.",
    "next_move": "Compare two real campaign directions and record the first detail she notices."
  }
}
`,de=W(["customer_private","operator_private"]),L=W(["ROUTE-A","ROUTE-B","ROUTE-C"]),G=W(["leader_can_answer","brain_can_find","prior_decision_match"]),_=y(t().min(1)),le=f({id:t().min(1),kind:t().min(1),label:t().min(1),observed_at:t().min(1),audience:de,assertion:t().min(1)}),ue=f({kind:G,question:t().min(1),choices:y(t().min(1)).min(2),why_it_matters:t().min(1),decision_effect:t().min(1),source_refs:_.optional(),prior_decision_ref:t().min(1).optional()}),he=f({fixture_version:I("4.0.0"),fixture_status:I("synthetic_demo"),as_of:t().min(1),disclosure:t().min(1),subject:f({id:I("SYN-CUST-014"),display_name:t().min(1),role:t().min(1),organisation:t().min(1),proof_day:Y().int().positive(),proof_length_days:Y().int().positive(),brain_name:t().min(1),primary_aim:t().min(1)}),decision:f({id:I("DEC-MAYA-021"),title:t().min(1),stakes:t().min(1),status:t().min(1),decision_by:t().min(1),provisional_view:t().min(1),owned_call:Q(),routes:y(f({id:L,name:t().min(1),plain_summary:t().min(1),upside:t().min(1),risk:t().min(1),evidence_for:_,evidence_against:_})).length(3)}),current_read:f({title:t().min(1),plain_summary:t().min(1),standing:t().min(1),confidence:t().min(1),source_refs:_,counter_case:t().min(1),counter_source_refs:_,important_unknown:t().min(1)}),personal_portrait:f({headline:t().min(1),patterns:y(f({id:t().min(1),name:t().min(1),statement:t().min(1),standing:t().min(1),source_refs:_})).min(1),growth_frontier:t().min(1),growth_source_refs:_}),standards:y(f({id:t().min(1),kind:t().min(1),name:t().min(1),test:t().min(1),source_refs:_})).min(1),unknowns:y(f({id:t().min(1),question:t().min(1),why_it_matters:t().min(1),smallest_test:t().min(1)})).min(1),sources:y(le).min(1),corrections:y(f({id:t().min(1),from:t().min(1),to:t().min(1),status:t().min(1),source_refs:_})).min(1),prior_decisions:y(f({id:t().min(1),title:t().min(1),status:t().min(1),decision:t().min(1),observed_result:t().min(1),relevance_to_current_decision:t().min(1),source_refs:_})).min(1),decision_sharpening:f({presentation_rule:t().min(1),answering_rule:t().min(1),default_route:L,question_classes:y(f({kind:G,purpose:t().min(1)})).length(3),default_route_questions:y(ue).length(3)}),recommended_move:f({title:t().min(1),reason:t().min(1),method:t().min(1),decision_effect:t().min(1),source_refs:_}),claude_handoff:f({desired_output:t().min(1),forbidden_assumptions:y(t().min(1)).min(1),output_shape:y(t().min(1)).min(1)}),returned_claude_example:f({text:t().min(1),provenance:t().min(1),brain_audit:f({verdict:t().min(1),generic_reasoning:y(t().min(1)).min(1),missing_evidence:y(t().min(1)).min(1),standard_conflicts:y(t().min(1)).min(1),additive_material:y(t().min(1)).min(1),sharpening_instruction:t().min(1)})}),sparse_fallback:f({known:t().min(1),unknown:t().min(1),next_move:t().min(1)})}).superRefine((n,s)=>{const i=new Set(n.sources.map(a=>a.id)),o=[...n.decision.routes.flatMap(a=>[...a.evidence_for,...a.evidence_against]),...n.current_read.source_refs,...n.current_read.counter_source_refs,...n.personal_portrait.patterns.flatMap(a=>a.source_refs),...n.standards.flatMap(a=>a.source_refs),...n.recommended_move.source_refs].filter(a=>a.startsWith("SRC-"));for(const a of o)i.has(a)||s.addIssue({code:M.custom,message:`Missing source ${a}`});const c=new Set(n.decision.routes.map(a=>a.id));(c.size!==3||!c.has(n.decision_sharpening.default_route))&&s.addIssue({code:M.custom,message:"Route identities or default route are invalid"}),n.sources.some(a=>a.audience==="operator_private")||s.addIssue({code:M.custom,message:"Operator-private evidence boundary is missing"})});function me(){return he.parse(JSON.parse(ce))}const g=me();function pe({queue:n,notify:s}){const[i,o]=u.useState(!1),c=u.useRef(null);if(!n.available)return null;const a=n.next,l=n.ready_count===1?"1 question for Maya":`${n.ready_count} questions, next for Maya`;async function m(){try{await navigator.clipboard.writeText(a.question),o(!0),s("Question copied")}catch{o(!1);const d=window.getSelection();if(d&&c.current){const r=document.createRange();r.selectNodeContents(c.current),d.removeAllRanges(),d.addRange(r)}s("Copy was blocked. The question is selected.")}}return e.jsxs("section",{className:"dt-review-signal","aria-labelledby":"operator-review-question",children:[e.jsxs("div",{className:"dt-review-meta",children:[e.jsx("span",{children:"For your next session"}),e.jsx("strong",{children:l})]}),e.jsxs("div",{className:"dt-review-copy",children:[e.jsx("h2",{id:"operator-review-question",ref:c,children:a.question}),e.jsxs("p",{children:[e.jsx("strong",{children:a.headline})," ",a.consequence]})]}),e.jsxs("div",{className:"dt-review-action",children:[e.jsx("span",{children:"Maya decides."}),e.jsxs("button",{type:"button",onClick:m,"data-copied":i||void 0,children:[i?e.jsx(U,{"aria-hidden":"true"}):e.jsx(J,{"aria-hidden":"true"}),i?"Copied":"Copy question"]})]})]})}const F={schema:"ctrl.standard-change.operator-pending-review.v1",decision_authority_granted:!1,active_standard_mutated:!1,notification_sent:!1},fe={ready:{question:"Should strong proposals move when the customer proof and three agreed quality checks are present?",headline:"Maya’s team may no longer need her final rewrite.",consequence:"Routine proposals can move without waiting for her. High-stakes proposals still come to her."},long:{question:"Should strong customer-facing proposals move without Maya’s final rewrite when the named buyer proof, the comparison against the existing route and all three agreed quality checks are already present?",headline:"Maya may be protecting quality by correcting work too late instead of teaching the team to recognise the proof she uses before a proposal reaches her.",consequence:"If Maya agrees, routine proposals can move without waiting for her once the named buyer proof, the route comparison and all three quality checks are visible. High-stakes, novel or brand-defining proposals still come to her."}};function ge(){const n=new URLSearchParams(window.location.search).get("review"),s=n==="ready"||n==="long"||n==="empty"||n==="unavailable"?n:"unavailable";return s==="empty"||s==="unavailable"?{...F,available:!1,reason:"not_available",ready_count:0,next:null}:{...F,available:!0,ready_count:1,next:{review_packet_id:"6913dca4-e613-4fa3-8c63-0b7a03c03132",...fe[s],ready_since:"2026-09-20T09:00:00.000Z"},selection:{method:"oldest_ready_first",materiality_inferred:!1}}}const V={comparison:["SRC-204","SRC-210"],surprise:["SRC-206","SRC-208"],unknown:["SRC-201","SRC-210"],all:g.sources.map(n=>n.id)},ye=[["01","Customer value","Which route helps buyers act?"],["02","Judgement transfer","Can someone else apply your standard?"],["03","Role design","What disappears and what becomes human?"],["04","Incentives","What behaviour does the pilot reward?"]];function we(){const n=new URLSearchParams(window.location.search).get("state");return n==="sparse"||n==="stale"||n==="wrong"?n:null}function be(){const n=new URLSearchParams(window.location.search).get("view");return n==="test"||n==="brief"||n==="audit"?n:"decision"}function _e(n){const s=g.sources.find(i=>i.id===n);if(!s)throw new Error(`Missing source ${n}`);return s}function ve(n){return n==="find"?"EVIDENCE REQUEST PENDING":n==="history"?"PRIOR DECISION MATCH":"LEADER ANSWER"}function N({children:n,onClick:s,disabled:i=!1}){return e.jsx("button",{className:"dt-primary",type:"button",onClick:s,disabled:i,children:n})}function $({children:n,onClick:s}){return e.jsxs("button",{className:"dt-back",type:"button",onClick:s,children:[e.jsx(X,{"aria-hidden":"true"}),n]})}function ke({benchState:n,reviewQueue:s,routeId:i,onRouteChange:o,onViewChange:c,onOpenChallenge:a,onOpenSources:l,notify:m}){const[d,r]=u.useState(!1),h=K[i],b=n==="sparse",v=b?`${g.sparse_fallback.known} ${g.sparse_fallback.unknown}`:"The bigger risk is rebuilding the team before someone else can apply your quality standard.",k=n==="stale"?"The latest evidence is stale. This read cannot steer the decision until it is checked.":`The counter-case: ${g.current_read.counter_case}`;return e.jsxs("main",{className:"dt-main dt-decision-view",children:[e.jsxs("section",{className:"dt-decision-head","aria-labelledby":"decision-title",children:[e.jsxs("div",{children:[e.jsx("h1",{id:"decision-title",children:"How far should you rebuild marketing around AI?"}),e.jsx("p",{className:"dt-stakes",children:"Twelve months · synthetic £1.2m operating budget · eight roles affected"})]}),e.jsxs("div",{className:"dt-brain-read",children:[e.jsx("span",{children:"What your Brain sees"}),e.jsx("p",{children:v}),e.jsx("small",{children:k})]})]}),e.jsx(pe,{queue:s,notify:m}),e.jsxs("section",{className:`dt-recognitions ${b?"is-sparse":""}`,"aria-label":"Current Brain recognitions",children:[e.jsxs("article",{className:"dt-recognition",children:[e.jsx("span",{className:"dt-mark",children:"1"}),e.jsxs("div",{children:[e.jsx("small",{children:"Your pattern"}),e.jsx("strong",{children:"You judge best through real comparison."})]}),e.jsx("button",{type:"button",onClick:()=>l("comparison"),children:"2 sources"})]}),b?null:e.jsxs("article",{className:"dt-recognition",children:[e.jsx("span",{className:"dt-mark",children:"2"}),e.jsxs("div",{children:[e.jsx("small",{children:"Your standard"}),e.jsx("strong",{children:"Make quality clear without killing surprise."})]}),e.jsx("button",{type:"button",onClick:()=>l("surprise"),children:"2 sources"})]}),e.jsxs("article",{className:"dt-recognition",children:[e.jsx("span",{className:"dt-mark",children:"?"}),e.jsxs("div",{children:[e.jsx("small",{children:"Still unknown"}),e.jsx("strong",{children:b?g.sparse_fallback.next_move:"Can your standard travel without your final rescue?"})]}),e.jsx("button",{type:"button",onClick:a,"aria-label":"Ask three useful questions about this decision",children:"Ask me more"})]})]}),e.jsxs("div",{className:"dt-current-view",children:[e.jsx("span",{children:"You"}),e.jsx("p",{children:g.decision.provisional_view})]}),e.jsxs("section",{className:"dt-route-table","aria-label":"Three operating routes",children:[e.jsx("div",{className:"dt-route-tabs",role:"tablist","aria-label":"Operating routes",children:g.decision.routes.map((p,S)=>{const x=p.id===i;return e.jsxs("button",{className:x?"is-active":"",type:"button",role:"tab","aria-selected":x,onClick:()=>{o(p.id),r(!1)},children:[e.jsx("small",{children:x&&p.id===g.decision_sharpening.default_route?"Current best route":`Route ${S+1}`}),e.jsx("strong",{children:K[p.id].tabLabel})]},p.id)})}),e.jsxs("div",{className:"dt-route-body",children:[e.jsxs("div",{className:"dt-route-main",children:[e.jsx("span",{className:"dt-label",children:"The causal bet"}),e.jsx("h2",{children:h.title}),e.jsx("p",{children:h.summary}),e.jsxs("div",{className:"dt-route-impact",children:[e.jsx("strong",{children:h.personal}),e.jsx("span",{children:h.detail})]})]}),e.jsxs("div",{className:"dt-route-proof",children:[e.jsx("span",{className:"dt-label",children:"Why this route moves"}),e.jsxs("div",{className:"dt-proof-line is-support",children:[e.jsx("b",{children:"Supports"}),e.jsx("span",{children:h.support})]}),e.jsxs("div",{className:"dt-proof-line is-pullback",children:[e.jsx("b",{children:"Pulls back"}),e.jsx("span",{children:h.oppose})]}),e.jsxs("div",{className:"dt-counter",children:[e.jsx("button",{type:"button",onClick:()=>r(p=>!p),"aria-expanded":d,children:d?"Hide the counter-case":"Show the strongest counter-case"}),d?e.jsx("p",{children:h.counter}):null]})]}),e.jsxs("div",{className:"dt-route-action",children:[e.jsxs("div",{children:[e.jsx("span",{className:"dt-label",children:"What only you decide"}),e.jsx("h3",{children:h.question}),e.jsx("p",{children:h.effect})]}),e.jsxs("div",{children:[e.jsxs(N,{onClick:()=>c("test"),children:["Design the test ",e.jsx(A,{"aria-hidden":"true"})]}),e.jsx("button",{className:"dt-text-action",type:"button",onClick:()=>m("The three synthetic routes stay fixed in this proof."),children:"I see another route"})]})]})]})]})]})}function je({killCondition:n,setKillCondition:s,onBack:i,onBuildBrief:o}){return e.jsxs("main",{className:"dt-main dt-secondary-view",children:[e.jsx($,{onClick:i,children:"Back to the decision"}),e.jsxs("section",{className:"dt-section-title",children:[e.jsxs("div",{children:[e.jsx("h1",{children:"One campaign can answer four questions."}),e.jsx("span",{children:"Current best route · prove the system first"})]}),e.jsx("p",{children:"Run the new operating model separately. Compare it blind with the current process. You keep the final call."})]}),e.jsxs("section",{className:"dt-test-grid",children:[e.jsxs("div",{className:"dt-test-main",children:[e.jsx("span",{className:"dt-label",children:"What the test must reveal"}),e.jsx("div",{className:"dt-test-steps",children:ye.map(([c,a,l])=>e.jsxs("article",{children:[e.jsx("b",{children:c}),e.jsx("strong",{children:a}),e.jsx("span",{children:l})]},c))}),e.jsxs("label",{className:"dt-condition",children:[e.jsx("span",{children:"Your kill condition"}),e.jsx("textarea",{value:n,onChange:c=>s(c.target.value)})]})]}),e.jsxs("aside",{className:"dt-test-side",children:[e.jsx("span",{className:"dt-label",children:"Brain recommendation"}),e.jsx("h2",{children:g.recommended_move.title}),e.jsx("p",{children:g.recommended_move.reason}),e.jsxs(N,{onClick:o,children:["Build the Claude brief ",e.jsx(A,{"aria-hidden":"true"})]}),e.jsx("small",{children:"You can change the test. The Brain cannot make the final organisational call."})]})]})]})}function xe({brief:n,wrongCustomer:s,onBack:i,onAudit:o,notify:c}){const[a,l]=u.useState(!1),m=u.useRef(null);async function d(){if(!s)try{await navigator.clipboard.writeText(n),l(!0),c("Complete brief copied")}catch{const r=window.getSelection(),h=document.createRange();m.current&&r&&(h.selectNodeContents(m.current),r.removeAllRanges(),r.addRange(h)),c("Copy was blocked. The full brief is selected.")}}return e.jsxs("main",{className:"dt-main dt-secondary-view",children:[e.jsx($,{onClick:i,children:"Back to the test"}),e.jsxs("section",{className:"dt-section-title",children:[e.jsxs("div",{children:[e.jsx("h1",{children:"Claude gets the full decision."}),e.jsx("span",{children:"Prepared from Maya's Brain"})]}),e.jsx("p",{children:"The brief carries your view, evidence, standards, unknowns and the exact work you want back."})]}),e.jsxs("section",{className:"dt-brief-shell",children:[e.jsxs("div",{className:"dt-brief-summary",children:[e.jsx("span",{className:"dt-label",children:"Included in the brief"}),e.jsxs("div",{className:"dt-brief-facts",children:[e.jsxs("div",{children:[e.jsx("small",{children:"Decision"}),e.jsx("strong",{children:"Three routes and their causal bets"})]}),e.jsxs("div",{children:[e.jsx("small",{children:"Maya's judgement"}),e.jsx("strong",{children:"Patterns, standards and one corrected belief"})]}),e.jsxs("div",{children:[e.jsx("small",{children:"Evidence boundary"}),e.jsx("strong",{children:"Twelve synthetic sources and explicit unknowns"})]}),e.jsxs("div",{children:[e.jsx("small",{children:"Output"}),e.jsx("strong",{children:"Two pilots, one recommendation, counter-case and kill conditions"})]})]}),e.jsx("p",{className:"dt-copy-note",children:s?"This brief belongs to a different selected customer. Nothing can be copied.":"Copies the complete private synthetic brief. Nothing is sent automatically."}),e.jsxs("div",{className:"dt-copy-actions",children:[e.jsx(N,{onClick:d,disabled:s,children:s?"Return to Maya before copying":a?e.jsxs(e.Fragment,{children:["Brief copied ",e.jsx(U,{"aria-hidden":"true"})]}):e.jsxs(e.Fragment,{children:["Copy complete brief ",e.jsx(A,{"aria-hidden":"true"})]})}),a?e.jsx("a",{href:"https://claude.ai/new",target:"_blank",rel:"noopener noreferrer",children:"Open Claude ↗"}):null]}),e.jsxs("div",{className:"dt-return-box",children:[e.jsx("textarea",{"aria-label":"Claude plan to assess",placeholder:"Paste Claude's plan back here",onPaste:r=>{r.clipboardData.getData("text")&&(r.preventDefault(),o())}}),e.jsx("button",{type:"button",onClick:o,children:"Use the synthetic return"})]})]}),e.jsxs("div",{className:"dt-brief-preview",children:[e.jsx("span",{className:"dt-label",children:"Full brief · inspectable"}),e.jsx("pre",{ref:m,id:"brief-text",children:n})]})]})]})}function Ce({onSelect:n}){return e.jsxs("p",{children:["Aperture House should embrace an ",e.jsx("button",{type:"button",onClick:()=>n(0),children:"AI-first marketing transformation"}),". Start by training the team on leading AI tools, ",e.jsx("button",{type:"button",onClick:()=>n(1),children:"automate content creation"})," and use a ",e.jsx("button",{type:"button",onClick:()=>n(2),children:"human-in-the-loop process"})," to maintain quality. Track ",e.jsx("button",{type:"button",onClick:()=>n(3),children:"engagement and output"})," to prove success, then ",e.jsx("button",{className:"is-keep",type:"button",onClick:()=>n(4),children:"scale the programme in stages"}),"."]})}function Se({onBack:n,onRepair:s,notify:i}){const o=u.useMemo(()=>oe(g),[]),[c,a]=u.useState(0),l=o[c];return e.jsxs("main",{className:"dt-main dt-secondary-view",children:[e.jsx($,{onClick:n,children:"Back to the brief"}),e.jsxs("section",{className:"dt-section-title",children:[e.jsxs("div",{children:[e.jsx("h1",{children:"Do not use this plan yet."}),e.jsx("span",{children:"Claude proposal · not Brain truth"})]}),e.jsx("p",{children:"Your Brain found four material failures and one useful direction. You decide whether the criticism is fair."})]}),e.jsxs("section",{className:"dt-audit",children:[e.jsxs("article",{className:"dt-plan",children:[e.jsx("span",{className:"dt-label",children:"Returned plan · select an underline"}),e.jsx(Ce,{onSelect:a})]}),e.jsxs("aside",{className:"dt-findings",children:[e.jsx("span",{className:"dt-label",children:"Maya's Brain · applied judgement"}),e.jsx("h2",{className:l.keep?"is-keep":"",children:l.title}),e.jsx("p",{children:l.body}),e.jsx("div",{className:"dt-finding-ref",children:l.reference}),e.jsx("div",{className:"dt-audit-nav","aria-label":"Assessment findings",children:o.map((m,d)=>e.jsx("button",{className:d===c?"is-active":"",type:"button","aria-label":`Finding ${d+1}`,onClick:()=>a(d),children:d+1},d))}),e.jsxs("div",{className:"dt-audit-actions",children:[e.jsxs(N,{onClick:s,children:["Build the sharper request ",e.jsx(A,{"aria-hidden":"true"})]}),e.jsx("button",{type:"button",onClick:()=>i("Your correction stays separate until it is reviewed."),children:"The Brain missed something"})]})]})]})]})}function Re({open:n,sources:s,onClose:i}){return e.jsx(E,{open:n,onOpenChange:o=>{o||i()},children:e.jsxs(B,{className:"dt-dialog dt-sources-dialog",children:[e.jsx(O,{children:"Why the Brain thinks this"}),e.jsx(D,{children:"Each claim keeps its source and privacy boundary."}),e.jsx("div",{className:"dt-source-list",children:s.map(o=>e.jsxs("article",{children:[e.jsxs("small",{children:[o.label," · synthetic · ",o.audience.replace("_"," ")]}),e.jsx("p",{children:o.assertion})]},o.id))})]})})}function Ne({open:n,onClose:s,notify:i}){const[o,c]=u.useState(""),[a,l]=u.useState(!1);return e.jsx(E,{open:n,onOpenChange:m=>{m||s()},children:e.jsxs(B,{className:"dt-dialog dt-capture-dialog",children:[e.jsx(O,{children:"Add evidence for Maya"}),e.jsx(D,{children:"This proof keeps the note only until you close the page."}),e.jsx("textarea",{value:o,onChange:m=>c(m.target.value),placeholder:"Paste or type here"}),e.jsxs(N,{onClick:()=>{if(!o.trim()){i("Add a note first");return}l(!0),i("Kept with this decision")},children:["Keep with this decision ",e.jsx(A,{"aria-hidden":"true"})]}),a?e.jsx("p",{className:"dt-saved",children:"Kept with this decision as an unreviewed synthetic note."}):null]})})}function Te({open:n,routeId:s,onClose:i,onKeep:o,notify:c}){const a=u.useMemo(()=>se(g,s),[s]),[l,m]=u.useState(0),[d,r]=u.useState(""),[h,b]=u.useState(!1),[v,k]=u.useState(""),p=a[l];u.useEffect(()=>{n&&(m(0),r(""),b(!1),k(""))},[n,s]);function S(){if(l>=a.length-1){i();return}m(w=>w+1),r(""),b(!1),k("")}function x(){d&&(o({standing:ve(p.mode),question:p.question,input:v.trim()?`${d}
Optional note: ${v.trim()}`:d}),c(p.mode==="find"?"The Brain will check this":"Answer kept"),S())}return e.jsx(E,{open:n,onOpenChange:w=>{w||i()},children:e.jsxs(B,{className:"dt-dialog dt-challenge-dialog","data-testid":"challenge-dialog",children:[e.jsx(O,{children:"One question"}),e.jsxs(D,{className:"dt-challenge-meta",children:[e.jsx("span",{children:p.kind}),e.jsxs("span",{children:[l+1," of ",a.length]})]}),e.jsx("h3",{children:p.question}),e.jsx("p",{className:"dt-challenge-why",children:p.why}),e.jsx("div",{className:"dt-challenge-choices",role:"group","aria-label":"Answer choices",children:p.choices.map(w=>e.jsx("button",{className:d===w?"is-selected":"",type:"button","aria-pressed":d===w,onClick:()=>{r(w),w==="Something else"&&b(!0)},children:w},w))}),e.jsxs("div",{className:"dt-challenge-effect",children:[e.jsx("small",{children:"What the answer changes"}),e.jsx("p",{children:p.effect})]}),e.jsx("button",{className:"dt-note-toggle",type:"button","aria-expanded":h,onClick:()=>b(w=>!w),children:h?"Hide note":"Add a note"}),h?e.jsx("textarea",{"aria-label":"Optional note",value:v,onChange:w=>k(w.target.value),placeholder:"Add anything the choices miss"}):null,e.jsxs("div",{className:"dt-challenge-actions",children:[e.jsx(N,{onClick:x,disabled:!d,children:p.mode==="find"?e.jsxs(e.Fragment,{children:[e.jsx(Z,{"aria-hidden":"true"}),"Find this for me"]}):e.jsxs(e.Fragment,{children:[e.jsx(U,{"aria-hidden":"true"}),"Keep answer"]})}),e.jsx("button",{type:"button",onClick:S,children:l===a.length-1?"Close":"Next question"})]}),e.jsxs("p",{className:"dt-question-source",children:[e.jsx(z,{"aria-hidden":"true"}),p.source]})]})})}function $e(){const[n,s]=u.useState(be),[i,o]=u.useState(g.decision_sharpening.default_route),[c,a]=u.useState(()=>new URLSearchParams(window.location.search).get("view")==="challenge"?"challenge":null),[l,m]=u.useState("all"),[d,r]=u.useState([]),[h,b]=u.useState("Stop if the new route produces more material but still needs Maya to rescue the central idea."),[v,k]=u.useState(""),p=we(),S=u.useMemo(ge,[]),x=u.useMemo(()=>re(g,d,h),[d,h]),w=(V[l]??V.all).map(_e);u.useEffect(()=>{const C=document.title,j=document.querySelector('meta[name="robots"]'),T=j??document.createElement("meta"),H=j==null?void 0:j.content;return j||(T.name="robots",document.head.appendChild(T)),document.title="Decision Table · synthetic operator proof",T.content="noindex,nofollow",()=>{document.title=C,j&&H!==void 0?T.content=H:T.remove()}},[]);function R(C){k(C),window.setTimeout(()=>k(""),1800)}function P(C){m(C),a("sources")}return e.jsxs("div",{className:"dt-shell",children:[e.jsxs("header",{className:"dt-header",children:[e.jsxs("div",{className:"dt-identity",children:[e.jsx("img",{src:"/mindmaker-favicon.png",alt:"Mindmake"}),e.jsx("span",{className:"dt-avatar","aria-hidden":"true",children:"MC"}),e.jsxs("div",{children:[e.jsx("strong",{children:g.subject.display_name}),e.jsxs("small",{children:[g.subject.role," · ",g.subject.organisation," · synthetic"]})]})]}),e.jsxs("nav",{"aria-label":"Decision controls",children:[e.jsx("button",{type:"button",onClick:()=>P("all"),children:"Sources"}),e.jsx("button",{type:"button",onClick:()=>a("capture"),children:"Add evidence"})]})]}),n==="decision"?e.jsx(ke,{benchState:p,reviewQueue:S,routeId:i,onRouteChange:o,onViewChange:s,onOpenChallenge:()=>a("challenge"),onOpenSources:P,notify:R}):null,n==="test"?e.jsx(je,{killCondition:h,setKillCondition:b,onBack:()=>s("decision"),onBuildBrief:()=>s("brief")}):null,n==="brief"?e.jsx(xe,{brief:x,wrongCustomer:p==="wrong",onBack:()=>s("test"),onAudit:()=>s("audit"),notify:R}):null,n==="audit"?e.jsx(Se,{onBack:()=>s("brief"),onRepair:()=>{s("brief"),R("The sharper instruction is already in the complete brief")},notify:R}):null,e.jsx(Te,{open:c==="challenge",routeId:i,onClose:()=>a(null),onKeep:C=>r(j=>[...j,C]),notify:R}),e.jsx(Re,{open:c==="sources",sources:w,onClose:()=>a(null)}),e.jsx(Ne,{open:c==="capture",onClose:()=>a(null),notify:R}),e.jsx("div",{className:`dt-toast ${v?"is-visible":""}`,role:"status",children:v})]})}export{$e as default};
