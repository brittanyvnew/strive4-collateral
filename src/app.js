// Trust Certificate Studio: editor, certificate renderer and export.
// Libraries (html2canvas, jsPDF, qrcode-generator) load from cdnjs script tags in index.html.
(() => {
'use strict';
/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T = s => String(s ?? '').trim();
const sentence = s => { s = T(s); return s && !/[.!?]$/.test(s) ? s + '.' : s; };
const lcFirst = s => { s = T(s); return s && /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s; };
const an = w => /^[aeiou]/i.test(T(w)) ? 'an' : 'a';
const lines = s => String(s ?? '').split('\n').map(T).filter(Boolean);
const num = (v, d = 0) => { const n = parseFloat(String(v).replace(/,/g, '')); return isFinite(n) ? n : d; };
const pad2 = n => String(n).padStart(2, '0');
const isoOf = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseISO = s => { if (!s) return null; const [y, m, d] = String(s).split('-').map(Number); return y ? new Date(y, (m || 1) - 1, d || 1) : null; };
const TODAY = isoOf(new Date());
const addDays = (s, n) => { const d = parseISO(s); if (!d) return ''; d.setDate(d.getDate() + num(n)); return isoOf(d); };
const addMonths = (s, n) => { const d = parseISO(s); if (!d) return ''; d.setMonth(d.getMonth() + num(n)); return isoOf(d); };
const addPeriod = (s, txt) => { const m = String(txt).match(/(\d+)\s*(day|week|month|year)/i); if (!m) return ''; const n = +m[1], u = m[2].toLowerCase(); return u === 'day' ? addDays(s, n) : u === 'week' ? addDays(s, n * 7) : u === 'month' ? addMonths(s, n) : addMonths(s, n * 12); };
const rid = n => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const r = crypto.getRandomValues(new Uint32Array(n)); for (const x of r) s += a[x % a.length]; return s; };
const newNo = p => `${p}-${new Date().getFullYear()}-${rid(6)}`;
const slug = s => T(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

/* color */
const hexOk = h => /^#[0-9a-f]{6}$/i.test(h);
const rgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
const hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
const lum = h => { const c = rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const ensure = (c, bg, r) => { let out = c; const dark = lum(bg) > .4; for (let i = 0; i < 24 && contrast(out, bg) < r; i++) out = mix(out, dark ? '#000000' : '#ffffff', .08); return out; };
const onColor = bg => contrast('#ffffff', bg) >= contrast('#141414', bg) ? '#ffffff' : '#141414';

/* ================= icons ================= */
const ICO = {
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  refund: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  clip: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><polyline points="9 14 11 16 15 12"/>',
  check: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  head: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'
};
const icon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter">${ICO[k]}</svg>`;

/* ================= templates ================= */
const G1 = 'Risk reversal and guarantees', G2 = 'Quality, safety and compliance', G3 = 'Service, exclusivity and loyalty';
const plusYear = () => addMonths(TODAY, 12);
const unitSing = u => u.replace(/s$/, '');
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

const TPL = [
{
  id: 'warranty', group: G1, name: 'Warranty', icon: 'shield', prefix: 'WAR',
  desc: 'Lifetime or limited-term coverage on materials and workmanship. Proves the product is built to last.',
  recLabel: 'Customer name', recDef: 'Jordan and Casey Rivera',
  fields: [
    { k: 'coverage', label: 'Coverage type', type: 'seg', opts: ['Lifetime', 'Limited'], def: 'Lifetime' },
    { k: 'term', label: 'Term length', type: 'number', def: '10', half: 1, show: f => f.coverage === 'Limited' },
    { k: 'unit', label: 'Unit', type: 'select', opts: ['years', 'months'], def: 'years', half: 1, show: f => f.coverage === 'Limited' },
    { k: 'product', label: 'Product or service covered', def: 'Signature Series roof system' },
    { k: 'serial', label: 'Model or serial number', def: 'SS-30 / 7781-204', half: 1 },
    { k: 'purchase', label: 'Purchase or install date', type: 'date', def: TODAY, half: 1 },
    { k: 'covers', label: 'What is covered', type: 'textarea', def: 'Defects in materials and workmanship under normal use.' },
    { k: 'claim', label: 'How to make a claim', type: 'textarea', def: 'Contact us with your certificate number and we will schedule an inspection within 5 business days.' }
  ],
  dur: f => f.coverage === 'Lifetime' ? 'Lifetime' : `${T(f.term)} ${num(f.term) === 1 ? unitSing(f.unit) : f.unit}`,
  exp: f => f.coverage === 'Lifetime' ? '' : addMonths(f.purchase, num(f.term) * (f.unit === 'years' ? 12 : 1)),
  auto: {
    eyebrow: () => 'Guaranteed protection',
    title: c => c.f.coverage === 'Lifetime' ? 'Lifetime Warranty' : `${T(c.f.term)}-${cap(unitSing(c.f.unit))} Limited Warranty`,
    subtitle: () => 'Certificate of warranty',
    rlabel: () => 'Issued to',
    statement: c => `${c.biz} warrants the ${T(c.f.product) || 'product'} for ${c.f.coverage === 'Lifetime' ? 'the lifetime of the product' : c.t.dur(c.f) + ' from the date of purchase'}. Coverage includes ${lcFirst(sentence(c.f.covers))} ${sentence(c.f.claim)}`,
    fine: () => 'This warranty applies to the original purchaser and is not transferable unless stated. It does not cover damage from misuse, accidents, neglect, unauthorized repairs or normal wear. Keep this certificate with your purchase records.'
  },
  facts: c => [['Coverage', c.t.dur(c.f)], ['Covers', c.f.product], ['Model / serial', c.f.serial], ['Purchased', c.d(c.f.purchase)], ['Expires', c.d(c.t.exp(c.f))]],
  seal: c => c.f.coverage === 'Lifetime' ? ['LIFETIME WARRANTY', 'LIFETIME', 'GUARANTEED'] : ['LIMITED WARRANTY', `${T(c.f.term)}\n${c.f.unit === 'years' ? (num(c.f.term) === 1 ? 'YEAR' : 'YEARS') : 'MONTHS'}`, 'GUARANTEED']
},
{
  id: 'moneyback', group: G1, name: 'Money-back guarantee', icon: 'refund', prefix: 'MBG',
  desc: 'A full or partial refund inside a set window. Removes the risk that keeps buyers on the fence.',
  recLabel: 'Customer name', recDef: 'Priya Shah',
  fields: [
    { k: 'product', label: 'Product or service', def: 'Whole-home energy audit' },
    { k: 'days', label: 'Guarantee window (days)', type: 'number', def: '60', half: 1 },
    { k: 'pct', label: 'Refund amount (%)', type: 'number', def: '100', half: 1 },
    { k: 'purchase', label: 'Purchase date', type: 'date', def: TODAY },
    { k: 'how', label: 'How to claim', type: 'textarea', def: 'Tell us within the guarantee window and quote your certificate number. No forms and no hard feelings.' }
  ],
  auto: {
    eyebrow: () => 'Risk-free purchase',
    title: c => num(c.f.pct, 100) >= 100 ? 'Money-Back Guarantee' : `${num(c.f.pct)}% Money-Back Guarantee`,
    subtitle: c => `${T(c.f.days)}-day satisfaction guarantee`,
    rlabel: () => 'Guaranteed to',
    statement: c => `If you are not completely satisfied with ${lcFirst(c.f.product) || 'your purchase'}, let us know within ${T(c.f.days)} days of purchase and ${c.biz} will refund ${num(c.f.pct, 100) >= 100 ? 'your full purchase price' : num(c.f.pct) + '% of your purchase price'}. ${sentence(c.f.how)}`,
    fine: () => 'Refunds are issued to the original payment method within 10 business days of approval. This guarantee applies to the original purchaser and the purchase listed on this certificate.'
  },
  facts: c => [['Refund', num(c.f.pct, 100) >= 100 ? '100% of price paid' : num(c.f.pct) + '% of price paid'], ['Window', `${T(c.f.days)} days`], ['Purchased', c.d(c.f.purchase)], ['Valid through', c.d(addDays(c.f.purchase, c.f.days))]],
  seal: c => ['MONEY-BACK GUARANTEE', `${T(c.f.days)}\nDAYS`, num(c.f.pct, 100) >= 100 ? '100% REFUND' : 'RISK FREE']
},
{
  id: 'pricematch', group: G1, name: 'Price-match / best value', icon: 'tag', prefix: 'BPG',
  desc: 'Refund the difference if they find it cheaper. Stops buyers from stalling to shop around.',
  recLabel: 'Customer name', recDef: 'Michael Okafor',
  fields: [
    { k: 'name', label: 'Guarantee name', type: 'select', opts: ['Best Price Guarantee', 'Price-Match Guarantee', 'Lowest Price Promise'], def: 'Best Price Guarantee' },
    { k: 'product', label: 'Product or service', def: 'Carrier 16 SEER heat pump, installed' },
    { k: 'paid', label: 'Price paid', def: '8,450', half: 1 },
    { k: 'days', label: 'Match window (days)', type: 'number', def: '30', half: 1 },
    { k: 'beat', label: 'Beat the lower price by (%)', type: 'number', def: '10', half: 1, hint: 'Use 0 to refund the difference only.' },
    { k: 'purchase', label: 'Purchase date', type: 'date', def: TODAY, half: 1 },
    { k: 'eligible', label: 'Eligible offers', type: 'textarea', def: 'Written quotes from licensed local competitors for the same product, scope and warranty terms.' }
  ],
  auto: {
    eyebrow: () => 'Buy now with confidence',
    title: c => c.f.name,
    subtitle: () => 'Certificate of best value',
    rlabel: () => 'Issued to',
    statement: c => `If you find the ${lcFirst(c.f.product) || 'same product'} advertised or quoted for less within ${T(c.f.days)} days of purchase, ${c.biz} will refund the difference${num(c.f.beat) > 0 ? ` plus an extra ${num(c.f.beat)}% of that difference` : ''}. Eligible offers: ${lcFirst(sentence(c.f.eligible))}`,
    fine: () => 'Excludes clearance, closeout, auction, financing promotions and member-only pricing. Submit proof of the lower price within the match window. Limit one claim per purchase.'
  },
  facts: c => [['Price paid', c.m(c.f.paid)], ['Match window', `${T(c.f.days)} days`], ['Purchased', c.d(c.f.purchase)], ['Valid through', c.d(addDays(c.f.purchase, c.f.days))]],
  seal: c => [c.f.name.toUpperCase().replace('GUARANTEE', '').trim() + ' GUARANTEE', 'BEST\nPRICE', 'BEST VALUE']
},
{
  id: 'performance', group: G1, name: 'Performance / ROI guarantee', icon: 'trend', prefix: 'PRF',
  desc: 'Commit to a measurable result like uptime, savings or leads. Built for B2B and service deals.',
  recLabel: 'Client company', recDef: 'Northwind Logistics',
  fields: [
    { k: 'name', label: 'Guarantee name', type: 'select', opts: ['Performance Guarantee', 'ROI Guarantee', 'Results Guarantee', 'Uptime Guarantee', 'Savings Guarantee'], def: 'Performance Guarantee' },
    { k: 'target', label: 'Target', def: '40', half: 1, hint: 'For example 40, 99.9% or $25,000' },
    { k: 'metric', label: 'Metric', def: 'qualified sales leads per month', half: 1 },
    { k: 'baseline', label: 'Current baseline', def: '18', half: 1, hint: 'Optional' },
    { k: 'period', label: 'Delivered within', def: '90 days', half: 1 },
    { k: 'start', label: 'Start date', type: 'date', def: TODAY },
    { k: 'measure', label: 'How it is measured', type: 'textarea', def: 'Results are measured from the shared CRM report at the end of the period.' },
    { k: 'remedy', label: 'If the target is missed', type: 'textarea', def: 'If we miss the target, we keep working at no additional cost until it is met.' }
  ],
  auto: {
    eyebrow: () => 'Results you can count on',
    title: c => c.f.name,
    subtitle: () => 'Certificate of committed results',
    rlabel: () => 'Guaranteed to',
    statement: c => `${c.biz} commits to delivering ${T(c.f.target)} ${T(c.f.metric)} for ${T(c.rec) || 'your business'} within ${T(c.f.period)} of the start date${T(c.f.baseline) ? `, up from a baseline of ${T(c.f.baseline)}` : ''}. ${sentence(c.f.measure)} ${sentence(c.f.remedy)}`,
    fine: () => 'This guarantee applies when the client provides the access, approvals and information agreed in the service agreement. Full terms are set out in the signed agreement, which takes precedence.'
  },
  facts: c => [['Target', `${T(c.f.target)} ${T(c.f.metric)}`], ['Baseline', c.f.baseline], ['Start date', c.d(c.f.start)], ['Results due', c.d(addPeriod(c.f.start, c.f.period)) || c.f.period]],
  seal: c => [c.f.name.toUpperCase().replace(' GUARANTEE', '') + ' GUARANTEED', /uptime/i.test(c.f.name) ? 'UPTIME' : /saving/i.test(c.f.name) ? 'SAVINGS' : /roi/i.test(c.f.name) ? 'ROI' : 'RESULTS', 'COMMITTED']
},
{
  id: 'coa', group: G2, name: 'Certificate of authenticity', icon: 'award', prefix: 'COA',
  desc: 'Verifies an item is genuine, original or made from verified materials. Justifies premium pricing.',
  recLabel: 'Owner name', recDef: 'Samuel Adeyemi',
  fields: [
    { k: 'item', label: 'Item', def: 'Hand-forged Damascus chef knife' },
    { k: 'maker', label: 'Maker, artist or origin', def: 'Elena Ruiz, master bladesmith' },
    { k: 'materials', label: 'Verified materials', def: '67-layer Damascus steel and stabilized walnut' },
    { k: 'edition', label: 'Edition or number', def: '12 of 50', half: 1 },
    { k: 'dims', label: 'Size or weight', def: '8 in blade', half: 1 },
    { k: 'made', label: 'Date made', type: 'date', def: TODAY },
    { k: 'provenance', label: 'Provenance', type: 'textarea', def: 'Designed and made by hand in our workshop. Each piece is inspected, numbered and recorded in our registry.' }
  ],
  auto: {
    eyebrow: () => 'Genuine article',
    title: () => 'Certificate of Authenticity',
    subtitle: () => 'Verified original',
    rlabel: () => 'Presented to',
    statement: c => `This certifies that the ${lcFirst(c.f.item) || 'item'}${T(c.f.maker) ? ` by ${T(c.f.maker)}` : ''} is a genuine, original piece${T(c.f.materials) ? `, made from ${lcFirst(c.f.materials)}` : ''}. ${sentence(c.f.provenance)}`,
    fine: () => 'This certificate is valid only for the item described above and should stay with it. Any alteration voids this certificate. Confirm authenticity using the certificate number.'
  },
  facts: c => [['Item', c.f.item], ['Edition', c.f.edition], ['Size', c.f.dims], ['Date made', c.d(c.f.made)]],
  seal: () => ['CERTIFIED AUTHENTIC', 'GENUINE', 'ORIGINAL']
},
{
  id: 'qa', group: G2, name: 'Quality assurance and inspection', icon: 'clip', prefix: 'QAI',
  desc: 'Confirms this specific item passed multi-point testing before delivery.',
  recLabel: 'Customer', recDef: 'Brightline Facilities',
  fields: [
    { k: 'product', label: 'Product', def: 'Model X2 commercial rooftop unit' },
    { k: 'serial', label: 'Serial number', def: 'SN 48210-77', half: 1 },
    { k: 'lot', label: 'Batch or lot', def: 'Batch 26-11', half: 1 },
    { k: 'points', label: 'Inspection points', type: 'number', def: '27', half: 1 },
    { k: 'result', label: 'Result', type: 'select', opts: ['Passed', 'Passed with notes'], def: 'Passed', half: 1 },
    { k: 'inspector', label: 'Inspected by', def: 'Marcus Lee, QA lead', half: 1 },
    { k: 'idate', label: 'Inspection date', type: 'date', def: TODAY, half: 1 },
    { k: 'checks', label: 'Checkpoints', type: 'list', def: 'Visual and cosmetic inspection\nElectrical safety and insulation test\nPressure and leak test\nPerformance run at rated load\nPackaging and labels verified', hint: 'One per line.' }
  ],
  auto: {
    eyebrow: () => 'Inspected before delivery',
    title: () => 'Quality Assurance Certificate',
    subtitle: c => `${T(c.f.points)}-point inspection`,
    rlabel: () => 'Prepared for',
    statement: c => `This certifies that the ${lcFirst(c.f.product) || 'product'}${T(c.f.serial) ? ` (${T(c.f.serial)})` : ''} passed a ${T(c.f.points)}-point quality inspection${c.f.idate ? ` on ${c.d(c.f.idate)}` : ''} before delivery. Each checkpoint was tested and signed off by our quality team.`,
    fine: () => 'Inspection results apply to the unit identified above at the time of shipment. Inspection records are retained and available on request.'
  },
  facts: c => [['Result', c.f.result], ['Serial', c.f.serial], ['Batch', c.f.lot], ['Inspected by', c.f.inspector]],
  list: c => ({ title: 'Checkpoints verified', items: lines(c.f.checks) }),
  seal: c => ['QUALITY INSPECTED', 'PASSED', `${T(c.f.points)} POINTS`]
},
{
  id: 'compliance', group: G2, name: 'Compliance and safety standards', icon: 'check', prefix: 'CMP',
  desc: 'Shows adherence to ISO, CE, safety or eco standards. Speeds up B2B procurement approval.',
  recLabel: 'Prepared for', recDef: 'Contoso procurement team',
  fields: [
    { k: 'name', label: 'Certificate name', type: 'select', opts: ['Certificate of Compliance', 'Compliance and Safety Certificate', 'Certificate of Conformity', 'Eco-Certified Business'], def: 'Certificate of Compliance' },
    { k: 'scope', label: 'Scope', def: 'the design, manufacture and installation of commercial HVAC systems' },
    { k: 'standards', label: 'Standards met', type: 'list', def: 'ISO 9001:2015 quality management\nISO 14001:2015 environmental management\nISO 45001:2018 health and safety\nCE marking, EU conformity\nUL 1995 safety listed', hint: 'One per line.' },
    { k: 'body', label: 'Certifying body or auditor', def: 'Bureau Veritas', half: 1 },
    { k: 'reg', label: 'Registration number', def: 'QMS-55120', half: 1 },
    { k: 'audit', label: 'Last audit', type: 'date', def: TODAY, half: 1 },
    { k: 'valid', label: 'Valid until', type: 'date', def: plusYear, half: 1 }
  ],
  auto: {
    eyebrow: () => 'Procurement ready',
    title: c => c.f.name.replace(' and ', ' & '),
    subtitle: () => 'Standards and certifications on record',
    rlabel: () => 'Prepared for',
    statement: c => `This certifies that ${c.biz} meets the standards listed below for ${T(c.f.scope) || 'its products and services'}. Supporting certificates and audit reports are available on request.`,
    fine: () => 'This summary reflects certifications held on the issue date. Status can be confirmed with the issuing bodies using the registration numbers shown.'
  },
  facts: c => [['Certifying body', c.f.body], ['Registration', c.f.reg], ['Last audit', c.d(c.f.audit)], ['Valid until', c.d(c.f.valid)]],
  list: c => ({ title: 'Standards met', items: lines(c.f.standards) }),
  seal: c => [/eco/i.test(c.f.name) ? 'ECO CERTIFIED' : 'STANDARDS COMPLIANT', 'VERIFIED', /eco/i.test(c.f.name) ? 'SUSTAINABLE' : 'SAFETY AND QUALITY']
},
{
  id: 'vip', group: G3, name: 'Priority VIP support', icon: 'head', prefix: 'VIP',
  desc: 'Faster response times, a dedicated rep or free maintenance checks. Makes customers feel looked after.',
  recLabel: 'Member name', recDef: 'The Nakamura family',
  fields: [
    { k: 'tier', label: 'Tier', def: 'Platinum', half: 1 },
    { k: 'program', label: 'Program name', def: 'Priority Care', half: 1 },
    { k: 'response', label: 'Response time', def: '2-hour response, 24/7' },
    { k: 'rep', label: 'Dedicated rep', def: 'Dana Whitfield', half: 1 },
    { k: 'repContact', label: 'Rep direct line', def: '(555) 014-2290', half: 1 },
    { k: 'benefits', label: 'Benefits', type: 'list', def: 'Priority scheduling ahead of the standard queue\nA dedicated rep who knows your system\n2 free maintenance checks per year\n15% off parts and repairs', hint: 'One per line.' },
    { k: 'valid', label: 'Valid until', type: 'date', def: plusYear }
  ],
  auto: {
    eyebrow: () => 'Priority member',
    title: c => `${T(c.f.tier)} ${T(c.f.program)}`.trim() || 'VIP Membership',
    subtitle: () => 'VIP support certificate',
    rlabel: () => 'Membership granted to',
    statement: c => `As ${an(c.f.tier)} ${T(c.f.tier)} member, you go to the front of the line at ${c.biz}.${T(c.f.rep) ? ` ${T(c.f.rep)} is your dedicated rep and your direct line for anything you need.` : ''}`,
    fine: () => 'Benefits apply to the member and service address named above and are not transferable. Membership renews with an active service plan.'
  },
  facts: c => [['Tier', c.f.tier], ['Response time', c.f.response], ['Your rep', [T(c.f.rep), T(c.f.repContact)].filter(Boolean).join(' · ')], ['Valid until', c.d(c.f.valid)]],
  list: c => ({ title: 'Your benefits', items: lines(c.f.benefits) }),
  seal: c => ['VIP PRIORITY SUPPORT', T(c.f.tier).toUpperCase() || 'VIP', 'MEMBER']
},
{
  id: 'partner', group: G3, name: 'Authorized partner / certified member', icon: 'users', prefix: 'PTR',
  desc: 'An official badge for resellers and B2B clients to display. Strengthens retention and co-branding.',
  recLabel: 'Partner company', recDef: 'Summit Home Services',
  fields: [
    { k: 'designation', label: 'Designation', type: 'select', opts: ['Authorized Dealer', 'Authorized Partner', 'Certified Member', 'Certified Installer', 'Preferred Reseller'], def: 'Authorized Dealer' },
    { k: 'level', label: 'Partner level', def: 'Gold', half: 1 },
    { k: 'program', label: 'Program name', def: 'Partner Network', half: 1 },
    { k: 'pid', label: 'Partner ID', def: 'PN-2041', half: 1 },
    { k: 'territory', label: 'Territory', def: 'the Greater Denver area', half: 1 },
    { k: 'since', label: 'Partner since', type: 'date', def: TODAY, half: 1 },
    { k: 'valid', label: 'Valid until', type: 'date', def: plusYear, half: 1 }
  ],
  auto: {
    eyebrow: () => 'Official recognition',
    title: c => c.f.designation,
    subtitle: c => `${T(c.f.level)} ${T(c.f.program)}`.trim(),
    rlabel: () => 'Proudly awarded to',
    statement: c => `${c.biz} recognizes ${T(c.rec) || 'this partner'} as ${an(c.f.designation)} ${c.f.designation.toLowerCase()}${T(c.f.territory) ? ` serving ${T(c.f.territory)}` : ''}. This partner has met our standards for training, quality and customer care, and is authorized to represent our products and services.`,
    fine: () => 'This certificate is valid while the partner agreement is active. Use of badges and logos must follow the partner brand guidelines.'
  },
  facts: c => [['Level', c.f.level], ['Partner ID', c.f.pid], ['Partner since', c.d(c.f.since)], ['Valid until', c.d(c.f.valid)]],
  seal: c => [c.f.designation.toUpperCase(), T(c.f.level).toUpperCase() || 'OFFICIAL', 'OFFICIAL PARTNER']
},
{
  id: 'voucher', group: G3, name: 'Gift / referral voucher', icon: 'gift', prefix: 'GFT',
  desc: 'Transferable credit for a friend or a future order. Drives repeat sales and referrals.',
  recLabel: 'Recipient', recDef: 'Alex Rivera', size: 'voucher',
  fields: [
    { k: 'kind', label: 'Voucher type', type: 'seg', opts: ['Gift voucher', 'Referral reward', 'Store credit'], def: 'Gift voucher' },
    { k: 'mode', label: 'Value type', type: 'select', opts: ['Fixed amount', 'Percent off', 'Free item or service'], def: 'Fixed amount', half: 1 },
    { k: 'amount', label: f => f.mode === 'Percent off' ? 'Percent off' : 'Amount', def: '100', half: 1, show: f => f.mode !== 'Free item or service' },
    { k: 'item', label: 'Free item or service', def: 'Free annual tune-up', half: 1, show: f => f.mode === 'Free item or service' },
    { k: 'from', label: f => f.kind === 'Referral reward' ? 'Referred by' : 'From', def: 'Jordan Patel', half: 1 },
    { k: 'code', label: 'Voucher code', def: () => 'GIFT-' + rid(5), half: 1 },
    { k: 'valid', label: 'Valid until', type: 'date', def: () => addMonths(TODAY, 6), half: 1 }
  ],
  value: f => f.mode === 'Percent off' ? `${T(f.amount)}% off` : f.mode === 'Free item or service' ? T(f.item) : money(f.amount),
  auto: {
    eyebrow: c => c.f.kind === 'Referral reward' ? 'Thanks for the referral' : c.f.kind === 'Store credit' ? 'Account credit' : 'A gift for you',
    title: c => c.f.kind === 'Referral reward' ? 'Referral Reward' : c.f.kind === 'Store credit' ? 'Store Credit' : 'Gift Voucher',
    subtitle: () => 'Valid toward your next order',
    rlabel: () => 'For',
    statement: c => {
      const v = c.t.value(c.f), free = c.f.mode === 'Free item or service';
      if (c.f.kind === 'Referral reward') return `Thanks to a referral from ${T(c.f.from) || 'a friend'}, you have ${free ? lcFirst(v) : v + ' toward your first order'} with ${c.biz}.`;
      if (c.f.kind === 'Store credit') return `${c.biz} has added ${free ? lcFirst(v) : v} in credit for your next order.`;
      return `${T(c.f.from) ? T(c.f.from) + ' has sent you' : 'You have received'} ${free ? lcFirst(v) : v + ' toward your next order'} with ${c.biz}.`;
    },
    fine: () => 'Present this voucher or quote the code when you book. Transferable. Not redeemable for cash and cannot be combined with other offers. One voucher per order.'
  },
  hero: c => c.t.value(c.f),
  facts: c => [['Value', c.t.value(c.f)], ['Code', c.f.code], [c.f.kind === 'Referral reward' ? 'Referred by' : 'From', c.f.from], ['Valid until', c.d(c.f.valid)]],
  seal: c => { const v = c.t.value(c.f); return [c.f.kind.toUpperCase(), v.length <= 9 ? v.toUpperCase() : 'GIFT', 'THANK YOU']; }
}
];
const byId = id => TPL.find(t => t.id === id) || TPL[0];
const WORDS = [
  { k: 'eyebrow', label: 'Small heading' },
  { k: 'title', label: 'Title' },
  { k: 'subtitle', label: 'Subtitle' },
  { k: 'rlabel', label: 'Line above the name' },
  { k: 'statement', label: 'Main statement', type: 'textarea', rows: 5 },
  { k: 'fine', label: 'Terms and fine print', type: 'textarea', rows: 4 }
];
const FONTS = {
  engraved: { hf: "'Cinzel', Georgia, serif", bf: "'Cormorant Garamond', Georgia, serif", lf: "'Figtree', system-ui, sans-serif", nf: "'Great Vibes', cursive", ns: 'normal', nw: 400, nsz: 1.25, hw: 700, ht: '.03em', bs: 17 },
  editorial: { hf: "'Playfair Display', Georgia, serif", bf: "'Figtree', system-ui, sans-serif", lf: "'Figtree', system-ui, sans-serif", nf: "'Playfair Display', Georgia, serif", ns: 'italic', nw: 500, nsz: 1, hw: 700, ht: '0', bs: 15 },
  elegant: { hf: "'Cormorant Garamond', Georgia, serif", bf: "'Cormorant Garamond', Georgia, serif", lf: "'Figtree', system-ui, sans-serif", nf: "'Great Vibes', cursive", ns: 'normal', nw: 400, nsz: 1.25, hw: 700, ht: '.01em', bs: 17 },
  modern: { hf: "'Figtree', system-ui, sans-serif", bf: "'Figtree', system-ui, sans-serif", lf: "'Figtree', system-ui, sans-serif", nf: "'Figtree', system-ui, sans-serif", ns: 'normal', nw: 700, nsz: .9, hw: 800, ht: '-.01em', bs: 15 }
};
const PRESETS = [
  { n: 'Forest and gold', p: '#50743e', a: '#c4920f' },
  { n: 'Navy and gold', p: '#1f3a5f', a: '#c9a227' },
  { n: 'Burgundy and champagne', p: '#7a1f2b', a: '#c8a96a' },
  { n: 'Charcoal and teal', p: '#2f3437', a: '#1e8c8c' },
  { n: 'Royal and silver', p: '#2742a8', a: '#8c96a8' },
  { n: 'Black and copper', p: '#1a1a1a', a: '#b87333' },
  { n: 'Teal and coral', p: '#0f5e63', a: '#e0765a' },
  { n: 'Plum and rose gold', p: '#4b2a59', a: '#c9927a' }
];
const SIZES = { letter: { w: 1056, h: 816, pw: 11, ph: 8.5, n: 'US Letter' }, a4: { w: 1123, h: 794, pw: 11.69, ph: 8.27, n: 'A4' }, voucher: { w: 768, h: 336, pw: 8, ph: 3.5, n: 'Voucher 8 × 3.5 in' } };
const FRAMES = [['classic', 'Classic'], ['modern', 'Modern'], ['bold', 'Bold'], ['minimal', 'Minimal']];

/* ================= state ================= */
const KEY = 'trust-cert-studio:v1';
function freshState() {
  return {
    tpl: 'warranty', fields: {}, words: {},
    brand: { name: 'Your Company Name', tagline: 'Licensed and insured since 2009', logo: '', primary: '#50743e', accent: '#c4920f', ink: '#1d211c', currency: '$', showName: true },
    design: { frame: 'classic', fonts: 'engraved', size: 'letter', orient: 'landscape', paper: 'white', pattern: true, seal: true, qr: true, dateStyle: 'us' },
    sign: { name: 'Alex Morgan', title: 'Owner', mode: 'typed', img: '', website: 'www.yourcompany.com', phone: '(555) 010-2030', email: 'hello@yourcompany.com', verify: '', issue: TODAY }
  };
}
let state = freshState();
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved && typeof saved === 'object') {
    const f = freshState();
    state = { ...f, ...saved, brand: { ...f.brand, ...saved.brand }, design: { ...f.design, ...saved.design }, sign: { ...f.sign, ...saved.sign }, fields: saved.fields || {}, words: saved.words || {} };
  }
} catch (e) { /* storage unavailable */ }
const cur = () => byId(state.tpl);
function ensureFields(t) {
  if (!state.fields[t.id]) state.fields[t.id] = {};
  const f = state.fields[t.id];
  for (const fd of t.fields) if (f[fd.k] === undefined) f[fd.k] = typeof fd.def === 'function' ? fd.def() : (fd.def ?? '');
  if (f.__rec === undefined) f.__rec = t.recDef;
  if (!f.__no) f.__no = newNo(t.prefix);
  if (!state.words[t.id]) state.words[t.id] = {};
  return f;
}
let saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); $('#saveNote').textContent = 'Your work is saved in this browser.'; }
    catch (e) { $('#saveNote').textContent = 'This browser could not save your work. Download before you leave.'; }
  }, 350);
}

/* ================= formatting ================= */
function fmtDate(s) { const d = parseISO(s); if (!d) return ''; return d.toLocaleDateString(state.design.dateStyle === 'intl' ? 'en-GB' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
function money(v) { v = T(v); if (!v) return ''; return /^[\d.,\s]+$/.test(v) ? state.brand.currency + v : v; }
function ctx() { const t = cur(), f = ensureFields(t); return { t, f, rec: f.__rec, biz: T(state.brand.name) || 'Our company', d: fmtDate, m: money }; }
function autoWord(k, c) { const fn = c.t.auto[k]; return fn ? String(fn(c)).replace(/\s+/g, ' ').trim() : ''; }
function word(k, c) { const o = state.words[c.t.id]?.[k]; return o !== undefined ? o : autoWord(k, c); }

/* ================= image generators (canvas, cached) ================= */
const cache = new Map();
function memo(key, fn) { if (!cache.has(key)) { if (cache.size > 60) cache.clear(); cache.set(key, fn()); } return cache.get(key); }

function sealImg(texts, p, a) {
  return memo('seal|' + texts.join('|') + p + a, () => {
    const S = 520, cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d'); const c = S / 2;
    const on = onColor(p);
    // rosette edge
    const pts = 64; x.beginPath();
    for (let i = 0; i < pts * 2; i++) { const ang = i * Math.PI / pts - Math.PI / 2; const r = i % 2 ? S * .462 : S * .498; x.lineTo(c + r * Math.cos(ang), c + r * Math.sin(ang)); }
    x.closePath();
    const g = x.createRadialGradient(c - S * .15, c - S * .2, S * .05, c, c, S * .52);
    g.addColorStop(0, mix(a, '#ffffff', .35)); g.addColorStop(.55, a); g.addColorStop(1, mix(a, '#000000', .25));
    x.fillStyle = g; x.fill();
    // inner disc
    x.beginPath(); x.arc(c, c, S * .425, 0, Math.PI * 2); x.fillStyle = p; x.fill();
    x.strokeStyle = on; x.globalAlpha = .9;
    x.lineWidth = 3; x.beginPath(); x.arc(c, c, S * .4, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 2; x.beginPath(); x.arc(c, c, S * .268, 0, Math.PI * 2); x.stroke();
    x.globalAlpha = 1; x.fillStyle = on; x.textAlign = 'center'; x.textBaseline = 'middle';
    const R = S * .335;
    const ring = (txt, top) => {
      txt = T(txt); if (!txt) return;
      const maxArc = top ? 2.55 : 1.9; let fs = S * .062; const sp = .16;
      const width = () => { x.font = `700 ${fs}px Figtree, system-ui, sans-serif`; let w = 0; for (const ch of txt) w += x.measureText(ch).width + fs * sp; return w - fs * sp; };
      let w = width(); while (w / R > maxArc && fs > S * .03) { fs -= 1; w = width(); }
      const total = w / R; let acc = 0;
      for (const ch of txt) {
        const cw = x.measureText(ch).width; const mid = (acc + cw / 2) / R;
        const ang = top ? -Math.PI / 2 - total / 2 + mid : Math.PI / 2 + total / 2 - mid;
        x.save(); x.translate(c + R * Math.cos(ang), c + R * Math.sin(ang)); x.rotate(top ? ang + Math.PI / 2 : ang - Math.PI / 2); x.fillText(ch, 0, 0); x.restore();
        acc += cw + fs * sp;
      }
    };
    ring(texts[0], true); ring(texts[2], false);
    // side stars
    const star = (cx, cy, r) => { x.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r; const an2 = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(cx + rr * Math.cos(an2), cy + rr * Math.sin(an2)); } x.closePath(); x.fill(); };
    star(c - R, c, S * .022); star(c + R, c, S * .022);
    // center
    const parts = String(texts[1] || '').split('\n').map(T).filter(Boolean);
    const maxW = S * .44;
    const fit = (txt, size, wt) => { let fs = size; do { x.font = `${wt} ${fs}px Figtree, system-ui, sans-serif`; if (x.measureText(txt).width <= maxW) break; fs -= 2; } while (fs > 14); return fs; };
    if (parts.length >= 2) {
      const f1 = fit(parts[0], S * .15, 800), f2 = fit(parts[1], S * .06, 700);
      x.font = `800 ${f1}px Figtree, system-ui, sans-serif`; x.fillText(parts[0], c, c - f2 * .55);
      x.font = `700 ${f2}px Figtree, system-ui, sans-serif`; x.fillText(parts[1].split('').join(String.fromCharCode(8202)), c, c + f1 * .5);
    } else if (parts.length) {
      const f1 = fit(parts[0], S * .095, 800); x.font = `800 ${f1}px Figtree, system-ui, sans-serif`; x.fillText(parts[0], c, c + 2);
    }
    return cv.toDataURL('image/png');
  });
}

function patternImg(p) {
  return memo('pat|' + p, () => {
    const S = 1000, cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d'); const c = S / 2;
    x.strokeStyle = p; x.lineWidth = 1.3;
    const band = (n, R0, A, k, B, j, phStep) => {
      for (let q = 0; q < n; q++) {
        x.beginPath();
        for (let i = 0; i <= 720; i++) { const t = i / 720 * Math.PI * 2; const r = R0 + A * Math.sin(k * t + q * phStep) + B * Math.sin(j * t - q * phStep * .5); const px = c + r * Math.cos(t), py = c + r * Math.sin(t); i ? x.lineTo(px, py) : x.moveTo(px, py); }
        x.closePath(); x.stroke();
      }
    };
    band(28, 400, 46, 18, 18, 7, Math.PI * 2 / 28);
    band(22, 250, 36, 13, 12, 5, Math.PI * 2 / 22);
    band(16, 120, 26, 9, 8, 4, Math.PI * 2 / 16);
    return cv.toDataURL('image/png');
  });
}

function qrImg(url) {
  if (!window.qrcode || !T(url)) return '';
  return memo('qr|' + url, () => { try { const q = qrcode(0, 'M'); q.addData(T(url)); q.make(); return q.createDataURL(6, 0); } catch (e) { return ''; } });
}

/* ================= certificate render ================= */
function dims() { const s = SIZES[state.design.size] || SIZES.letter; const port = state.design.size !== 'voucher' && state.design.orient === 'portrait'; return port ? { w: s.h, h: s.w, pw: s.ph, ph: s.pw, n: s.n, port } : { w: s.w, h: s.h, pw: s.pw, ph: s.ph, n: s.n, port }; }

function certHTML() {
  const c = ctx(), t = c.t, f = c.f, B = state.brand, D = state.design, S = state.sign;
  const dm = dims(), voucher = D.size === 'voucher';
  const P = hexOk(B.primary) ? B.primary : '#50743e', A = hexOk(B.accent) ? B.accent : '#c4920f', INK = hexOk(B.ink) ? B.ink : '#1d211c';
  const paper = D.paper === 'ivory' ? '#fbf7ee' : D.paper === 'tint' ? mix(P, '#ffffff', .955) : '#ffffff';
  const onp = onColor(P);
  const F = FONTS[D.fonts] || FONTS.engraved;
  const vars = {
    '--p': P, '--a': A, '--ink': ensure(INK, paper, 7), '--paper': paper, '--onp': onp,
    '--pt': ensure(P, paper, 3.2), '--at': ensure(A, paper, 4.5), '--abd': contrast(A, P) >= 3 ? A : onp,
    '--ink2': ensure(mix(INK, paper, .12), paper, 7), '--muted': ensure(mix(INK, paper, .42), paper, 4.6), '--soft': mix(INK, paper, .72), '--tint': mix(P, paper, .93),
    '--hf': F.hf, '--bf': F.bf, '--lf': F.lf, '--nf': F.nf, '--ns': F.ns, '--nw': F.nw, '--nsz': F.nsz, '--hw': F.hw, '--ht': F.ht, '--bs': F.bs, '--fit': 1,
    width: dm.w + 'px', height: dm.h + 'px'
  };
  const style = Object.entries(vars).map(([k, v]) => `${k}:${String(v).replace(/"/g, "'")}`).join(';');
  const W = {}; for (const w of WORDS) W[w.k] = word(w.k, c);
  const facts = t.facts(c).filter(([, v]) => T(v)).slice(0, 5);
  let list = t.list ? t.list(c) : null; if (list && !list.items.length) list = null;
  const hero = t.hero ? T(t.hero(c)) : '';
  const seal = D.seal ? sealImg(t.seal(c), P, A) : '';
  const qr = D.qr ? qrImg(S.verify) : '';
  const bold = D.frame === 'bold';

  // head
  const logo = B.logo ? `<img class="c-logo" src="${B.logo}" alt="">` : '';
  const showName = B.showName || !B.logo;
  const head = (logo || showName) ? `<div class="${voucher ? 'v-head' : 'c-head'} ${logo ? '' : 'only-name'}">${logo ? (bold && !voucher ? `<span class="c-plate">${logo}</span>` : logo) : ''}${showName ? `<div class="c-bizwrap"><div class="c-biz">${esc(B.name)}</div>${T(B.tagline) && !voucher ? `<div class="c-tag">${esc(B.tagline)}</div>` : ''}</div>` : ''}</div>` : '';

  // signature
  let sigArt = '';
  if (S.mode === 'typed' && T(S.name)) sigArt = `<div class="c-sig-typed">${esc(S.name)}</div>`;
  else if ((S.mode === 'draw' || S.mode === 'upload') && S.img) sigArt = `<img class="c-sig-img" src="${S.img}" alt="">`;
  const sig = `<div class="c-sig"><div class="c-sig-art">${sigArt}</div><div class="c-sig-line"><div class="c-sig-name">${esc(S.name)}</div><div class="c-sig-title">${esc([T(S.title), T(B.name)].filter(Boolean).join(', '))}</div></div></div>`;

  const contact = [S.website, S.phone, S.email].map(T).filter(Boolean).map(esc).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
  const frameBits = `<div class="c-frame"></div><div class="c-frame2"></div>${D.frame === 'classic' && !voucher ? ['left:21px;top:21px', 'right:21px;top:21px', 'left:21px;bottom:21px', 'right:21px;bottom:21px'].map(s => `<span class="c-corner" style="${s}"></span>`).join('') : ''}<div class="c-band"></div><div class="c-band2"></div>`;
  const patSize = Math.round(Math.min(dm.w, dm.h) * (voucher ? 1.2 : .92));
  const pattern = D.pattern ? `<img class="c-pattern" src="${patternImg(P)}" style="width:${patSize}px;height:${patSize}px" alt="">` : '';
  const cls = `cert f-${D.frame} ${dm.port ? 'o-portrait' : 'o-landscape'} ${voucher ? 'lay-voucher' : ''}`;

  if (voucher) {
    const code = t.id === 'voucher' ? f.code : f.__no;
    const validFact = facts.find(([l]) => /valid|expires|due/i.test(l));
    const fromLbl = f.kind === 'Referral reward' ? 'Referred by' : 'From';
    const to = [T(f.__rec) ? `${esc(W.rlabel || 'For')} <b>${esc(f.__rec)}</b>` : `${esc(W.rlabel || 'For')} <span class="v-blank"></span>`,t.id === 'voucher' && T(f.from) ? `${fromLbl} <b>${esc(f.from)}</b>` : ''].filter(Boolean).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
    return `<div class="${cls}" style="${style}">${pattern}${frameBits}<div class="vb">
      <div class="v-main">${head}${W.eyebrow ? `<div class="c-eyebrow">${esc(W.eyebrow)}</div>` : ''}<h2 class="c-title">${esc(W.title)}</h2>${hero ? `<div class="c-hero">${esc(hero)}</div>` : ''}${to ? `<div class="v-to">${to}</div>` : ''}${W.statement ? `<p class="c-statement">${esc(W.statement)}</p>` : ''}<div class="c-fine">${esc(W.fine)}${contact ? `<div class="c-contact">${contact}</div>` : ''}</div></div>
      <div class="v-stub"><div><div class="c-ml">${t.id === 'voucher' ? 'Voucher code' : 'Certificate no.'}</div><div class="v-code">${esc(code)}</div></div>${validFact ? `<div><div class="c-ml">${esc(validFact[0])}</div><div class="c-mv">${esc(validFact[1])}</div></div>` : ''}${qr ? `<img class="c-qr" src="${qr}" alt="">` : seal ? `<img class="c-seal" src="${seal}" alt="">` : ''}<div><div class="c-ml">Issued</div><div class="c-mv">${esc(fmtDate(S.issue))}</div></div></div>
    </div></div>`;
  }

  const fc = list ? (dm.port ? Math.min(facts.length, 4) : 2) : Math.min(facts.length, dm.port ? 3 : 5);
  const lc = list && (list.items.length > 5 && dm.port) ? 2 : 1;
  const factsHTML = facts.length ? `<div class="c-facts" style="--fc:${Math.max(fc, 1)}">${facts.map(([l, v]) => `<div class="c-fact"><div class="c-fl">${esc(l)}</div><div class="c-fv">${esc(v)}</div></div>`).join('')}</div>` : '';
  const listHTML = list ? `<div class="c-list" style="--lc:${lc}"><div class="c-list-t">${esc(list.title)}</div><ul>${list.items.map(i => `<li><span class="ck"></span><span>${esc(i)}</span></li>`).join('')}</ul></div>` : '';
  const meta = `<div class="c-meta"><div class="c-meta-rows"><div><div class="c-ml">Certificate no.</div><div class="c-mv">${esc(f.__no)}</div></div><div><div class="c-ml">Issued</div><div class="c-mv">${esc(fmtDate(S.issue))}</div></div></div>${qr ? `<div><img class="c-qr" src="${qr}" alt=""><div class="c-qrcap">Scan to verify</div></div>` : ''}</div>`;
  const verifyTxt = !qr && T(S.verify) ? `<div class="c-contact">Verify at ${esc(S.verify.replace(/^https?:\/\//, ''))}</div>` : '';

  return `<div class="${cls}" style="${style}">${pattern}${frameBits}<div class="c-body">
    <div class="c-top">${head}${W.eyebrow ? `<div class="c-eyebrow">${esc(W.eyebrow)}</div>` : ''}<h2 class="c-title">${esc(W.title)}</h2>${W.subtitle ? `<div class="c-sub">${esc(W.subtitle)}</div>` : ''}</div>
    <div class="c-main">${bold ? '<div style="height:1em"></div>' : '<div class="c-rule"><i></i><b></b><i></i></div>'}
      ${hero ? `<div class="c-hero">${esc(hero)}</div>` : ''}
      <div class="c-rec ${T(f.__rec) ? '' : 'is-blank'}" aria-hidden="${T(f.__rec) ? 'false' : 'true'}">${W.rlabel ? `<div class="c-rlabel">${esc(W.rlabel)}</div>` : ''}<div class="c-name ${T(f.__rec) ? '' : 'is-blank'}">${T(f.__rec) ? esc(f.__rec) : '&nbsp;'}</div></div>
      ${W.statement ? `<p class="c-statement">${esc(W.statement)}</p>` : ''}
      ${factsHTML || listHTML ? `<div class="c-mid">${factsHTML}${listHTML}</div>` : ''}
      <div class="c-foot">${sig}${seal ? `<img class="c-seal" src="${seal}" alt="">` : '<span></span>'}${meta}</div>
      ${W.fine || contact || verifyTxt ? `<div class="c-fine">${esc(W.fine)}${contact ? `<div class="c-contact">${contact}</div>` : ''}${verifyTxt}</div>` : ''}
    </div></div></div>`;
}

/* ================= preview ================= */
let zoom = 'fit', rafId = 0;
function render() { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(doRender); }
function doRender() {
  const inner = $('#stageInner');
  inner.innerHTML = certHTML();
  const el = inner.firstElementChild;
  autoFit(el);
  layoutPreview();
  const dm = dims(), t = cur();
  $('#pvMeta').innerHTML = `<strong>${esc(t.name)}</strong> · ${esc(dm.n)}${state.design.size !== 'voucher' ? ' ' + (dm.port ? 'portrait' : 'landscape') : ''}`;
}
function autoFit(el) {
  if (!el) return;
  const boxes = $$('.c-main,.v-main', el);
  let fit = 1; el.style.setProperty('--fit', fit);
  const over = () => boxes.some(b => b.scrollHeight > b.clientHeight + 1);
  while (fit > .58 && over()) { fit = +(fit - .03).toFixed(2); el.style.setProperty('--fit', fit); }
}
function layoutPreview() {
  const stage = $('#stage'), inner = $('#stageInner'), el = inner.firstElementChild; if (!el) return;
  const dm = dims(); const cs = getComputedStyle(stage);
  const aw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const ah = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const mobile = matchMedia('(max-width: 899px)').matches;
  let s = zoom === '100' ? 1 : Math.min(aw / dm.w, mobile ? 10 : ah / dm.h);
  s = Math.max(.15, Math.min(s, zoom === '100' ? 1 : 1.4));
  inner.style.width = dm.w * s + 'px'; inner.style.height = dm.h * s + 'px';
  el.style.transform = `scale(${s})`;
}
new ResizeObserver(() => layoutPreview()).observe($('#stage'));

/* ================= form building ================= */
function controlHTML(fd, val, id, scope) {
  const data = `data-scope="${scope}" data-k="${fd.k}"`;
  const v = esc(val);
  switch (fd.type) {
    case 'textarea': case 'list': return `<textarea class="inp" id="${id}" ${data} rows="${fd.rows || (fd.type === 'list' ? 5 : 3)}">${v}</textarea>`;
    case 'number': return `<input class="inp" type="number" inputmode="decimal" id="${id}" ${data} value="${v}">`;
    case 'date': return `<input class="inp" type="date" id="${id}" ${data} value="${v}">`;
    case 'select': return `<select class="inp" id="${id}" ${data}>${fd.opts.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    case 'seg': return `<div class="seg" id="${id}" ${data}>${fd.opts.map(o => `<button type="button" data-v="${esc(o)}" class="${o === val ? 'on' : ''}">${esc(o)}</button>`).join('')}</div>`;
    default: return `<input class="inp" type="text" id="${id}" ${data} value="${v}">`;
  }
}
const lbl = (fd, f) => typeof fd.label === 'function' ? fd.label(f) : fd.label;
function buildForm() {
  const t = cur(), f = ensureFields(t);
  $('#curIco').innerHTML = icon(t.icon); $('#curGrp').textContent = t.group; $('#curName').textContent = t.name; $('#tplDesc').textContent = t.desc;
  let h = `<div class="field"><label for="x_rec">${esc(t.recLabel)}</label><input class="inp" id="x_rec" data-scope="fields" data-k="__rec" value="${esc(f.__rec)}" placeholder="Optional. Leave blank to keep the space empty"></div>`;
  h += t.fields.map(fd => `<div class="field ${fd.half ? 'half' : ''}" data-fk="${fd.k}" ${fd.show && !fd.show(f) ? 'hidden' : ''}>${fd.type === 'seg' ? `<span class="lbl">${esc(lbl(fd, f))}</span>` : `<label for="x_${fd.k}">${esc(lbl(fd, f))}</label>`}${controlHTML(fd, f[fd.k], 'x_' + fd.k, 'fields')}${fd.hint ? `<p class="hint">${esc(fd.hint)}</p>` : ''}</div>`).join('');
  h += `<div class="field half"><label for="x_issue">Issue date</label><input class="inp" type="date" id="x_issue" data-scope="sign" data-k="issue" value="${esc(state.sign.issue)}"></div>`;
  h += `<div class="field half"><label for="x_no">Certificate number</label><div class="inline"><input class="inp" id="x_no" data-scope="fields" data-k="__no" value="${esc(f.__no)}"><button class="btn btn-secondary btn-sm" type="button" id="btnNewNo" title="Generate a new number" aria-label="Generate a new number"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></button></div></div>`;
  $('#detailFields').innerHTML = h;
  buildWords();
}
function buildWords() {
  const c = ctx();
  $('#wordFields').innerHTML = WORDS.map(w => {
    const over = state.words[c.t.id][w.k] !== undefined;
    return `<div class="field" data-wk="${w.k}"><span class="lbl"><label for="w_${w.k}">${esc(w.label)}</label><button type="button" class="reset" data-reset="${w.k}" ${over ? '' : 'hidden'}>Reset</button></span>${controlHTML({ k: w.k, type: w.type, rows: w.rows }, word(w.k, c), 'w_' + w.k, 'words')}</div>`;
  }).join('');
}
function refreshDynamic() {
  const t = cur(), f = ensureFields(t), c = ctx();
  for (const fd of t.fields) {
    const box = $(`[data-fk="${fd.k}"]`); if (!box) continue;
    if (fd.show) box.hidden = !fd.show(f);
    if (typeof fd.label === 'function') { const l = $('label,.lbl', box); if (l) l.textContent = lbl(fd, f); }
  }
  for (const w of WORDS) {
    if (state.words[t.id][w.k] !== undefined) continue;
    const el = $('#w_' + w.k); if (el && document.activeElement !== el) el.value = autoWord(w.k, c);
  }
}
function syncStatic() {
  for (const el of $$('[data-scope="brand"],[data-scope="design"],[data-scope="sign"]')) {
    const obj = state[el.dataset.scope], k = el.dataset.k, v = obj[k];
    if (el.classList.contains('seg')) $$('button', el).forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
    else if (el.type === 'checkbox') el.checked = !!v;
    else if (document.activeElement !== el) el.value = v ?? '';
  }
  for (const k of ['primary', 'accent', 'ink']) { const v = state.brand[k]; $(`[data-color="${k}"]`).value = hexOk(v) ? v : '#000000'; const tx = $(`[data-colortext="${k}"]`); if (document.activeElement !== tx) tx.value = v; }
  $$('.sw').forEach(b => b.classList.toggle('on', b.dataset.p === state.brand.primary.toLowerCase() && b.dataset.a === state.brand.accent.toLowerCase()));
  $$('.frame-opt').forEach(b => b.classList.toggle('on', b.dataset.frame === state.design.frame));
  $('#orientField').hidden = state.design.size === 'voucher';
  // logo
  $('#logoThumb').innerHTML = state.brand.logo ? `<img src="${state.brand.logo}" alt="Your logo">` : icon('image');
  $('#logoActions').hidden = !state.brand.logo;
  syncSig();
}
function syncSig() {
  const S = state.sign, box = $('#sigBox'), act = $('#sigActions');
  if (S.mode === 'typed') { box.innerHTML = `<span class="typed">${esc(S.name || 'Your name')}</span>`; act.innerHTML = ''; }
  else if (S.mode === 'none') { box.innerHTML = '<span class="none">No signature. The line stays for a wet signature.</span>'; act.innerHTML = ''; }
  else {
    box.innerHTML = S.img ? `<img src="${S.img}" alt="Signature">` : `<span class="none">${S.mode === 'draw' ? 'No signature drawn yet' : 'No signature uploaded yet'}</span>`;
    act.innerHTML = S.mode === 'draw' ? `<button type="button" class="btn btn-secondary btn-sm" id="btnDraw">${S.img ? 'Redraw' : 'Draw signature'}</button>` : `<button type="button" class="btn btn-secondary btn-sm" id="btnSigUp">${S.img ? 'Replace image' : 'Upload image'}</button><span class="hint" style="align-self:center">A transparent PNG works best.</span>`;
  }
}

/* frame thumbnails + presets */
$('#frames').innerHTML = FRAMES.map(([k, n]) => {
  const art = {
    classic: '<i style="position:absolute;inset:4px;border:2px solid var(--primary)"></i><i style="position:absolute;inset:7px;border:1px solid var(--accent)"></i>',
    modern: '<i style="position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--primary)"></i><i style="position:absolute;left:5px;top:0;bottom:0;width:2px;background:var(--accent)"></i>',
    bold: '<i style="position:absolute;left:0;right:0;top:0;height:34%;background:var(--primary);border-bottom:2px solid var(--accent)"></i>',
    minimal: '<i style="position:absolute;inset:6px;border:1px solid var(--line-strong)"></i>'
  }[k];
  return `<button type="button" class="frame-opt" data-frame="${k}"><span class="frame-thumb">${art}<i style="position:absolute;left:30%;right:30%;top:${k === 'bold' ? '14%' : '30%'};height:3px;background:${k === 'bold' ? '#fff' : 'var(--ink)'};opacity:.7"></i><i style="position:absolute;left:38%;right:38%;top:55%;height:2px;background:var(--line-strong)"></i></span>${n}</button>`;
}).join('');
$('#presets').innerHTML = PRESETS.map(p => `<button type="button" class="sw" data-p="${p.p}" data-a="${p.a}" title="${p.n}" aria-label="${p.n}"><span style="background:${p.p}"></span><span style="background:${p.a}"></span></button>`).join('');

/* ================= events ================= */
function setVal(scope, k, v) {
  if (scope === 'fields') ensureFields(cur())[k] = v;
  else if (scope === 'words') { state.words[cur().id][k] = v; const r = $(`[data-reset="${k}"]`); if (r) r.hidden = false; }
  else state[scope][k] = v;
  if (scope === 'design' && k === 'fonts') cache.clear();
  if (scope === 'design' && k === 'size' && v === 'voucher') state.design.orient = 'landscape';
  if (scope !== 'words') refreshDynamic();
  if (scope === 'sign' && (k === 'name' || k === 'mode')) syncSig();
  if (scope === 'design' || scope === 'brand') syncStatic();
  render(); save();
}
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.color) { state.brand[el.dataset.color] = el.value; syncStatic(); render(); save(); return; }
  if (el.dataset.colortext) { let v = el.value.trim(); if (!v.startsWith('#')) v = '#' + v; if (hexOk(v)) { state.brand[el.dataset.colortext] = v.toLowerCase(); $(`[data-color="${el.dataset.colortext}"]`).value = v; render(); save(); } return; }
  if (!el.dataset.scope || el.classList.contains('seg')) return;
  if (el.type === 'checkbox') return;
  setVal(el.dataset.scope, el.dataset.k, el.value);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.type === 'checkbox' && el.dataset.scope) setVal(el.dataset.scope, el.dataset.k, el.checked);
  if (el.tagName === 'SELECT' && el.dataset.scope) setVal(el.dataset.scope, el.dataset.k, el.value);
});
document.addEventListener('click', e => {
  const segBtn = e.target.closest('.seg[data-scope] button');
  if (segBtn) {
    const seg = segBtn.parentElement; let v = segBtn.dataset.v; if (seg.dataset.bool) v = v === 'true';
    $$('button', seg).forEach(b => b.classList.toggle('on', b === segBtn));
    setVal(seg.dataset.scope, seg.dataset.k, v);
    if (seg.dataset.k === 'mode' && seg.dataset.scope === 'sign') { if (v === 'draw' && !state.sign.img) openPad(); if (v === 'upload' && !state.sign.img) $('#sigInput').click(); }
    return;
  }
  const t = e.target;
  const rs = t.closest('[data-reset]'); if (rs) { delete state.words[cur().id][rs.dataset.reset]; rs.hidden = true; $('#w_' + rs.dataset.reset).value = autoWord(rs.dataset.reset, ctx()); render(); save(); return; }
  const fr = t.closest('.frame-opt'); if (fr) { state.design.frame = fr.dataset.frame; syncStatic(); render(); save(); return; }
  const sw = t.closest('.sw'); if (sw) { state.brand.primary = sw.dataset.p; state.brand.accent = sw.dataset.a; syncStatic(); render(); save(); return; }
  if (t.closest('#btnNewNo')) { const f = ensureFields(cur()); f.__no = newNo(cur().prefix); $('#x_no').value = f.__no; render(); save(); return; }
  if (t.closest('#btnDraw')) { openPad(); return; }
  if (t.closest('#btnSigUp')) { $('#sigInput').click(); return; }
  const ex = t.closest('[data-export]'); if (ex) { exportFile(ex.dataset.export, ex); return; }
  if (t.closest('[data-close]')) { closeModals(); return; }
  if (t.classList && t.classList.contains('modal')) { closeModals(); return; }
  const z = t.closest('#zoomSeg button'); if (z) { zoom = z.dataset.z; $$('#zoomSeg button').forEach(b => b.classList.toggle('on', b === z)); layoutPreview(); return; }
  const vw = t.closest('#viewSeg button'); if (vw) { setView(vw.dataset.view); return; }
  const tc = t.closest('.tcard'); if (tc) { pickTemplate(tc.dataset.id); return; }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });
function setView(v) { document.body.dataset.view = v; $$('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.view === v)); if (v === 'preview') { window.scrollTo(0, 0); requestAnimationFrame(layoutPreview); } }

/* template picker */
function openPicker() {
  const groups = [G1, G2, G3];
  $('#pickBody').innerHTML = groups.map(g => `<div class="tgroup"><h3>${esc(g)}</h3><div class="tgrid">${TPL.filter(t => t.group === g).map(t => `<button type="button" class="tcard ${t.id === state.tpl ? 'on' : ''}" data-id="${t.id}"><div class="tpl-ico">${icon(t.icon)}</div><div><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></div></button>`).join('')}</div></div>`).join('');
  openModal('#pickModal');
}
function pickTemplate(id) {
  const prev = cur(), next = byId(id);
  if (next.size === 'voucher' && state.design.size !== 'voucher') { state.design._lastSize = state.design.size; state.design.size = 'voucher'; }
  else if (prev.size === 'voucher' && !next.size && state.design.size === 'voucher') state.design.size = state.design._lastSize || 'letter';
  state.tpl = id; ensureFields(next);
  closeModals(); buildForm(); syncStatic(); render(); save();
  $('#panel').scrollTo({ top: 0, behavior: 'smooth' });
}
$('#btnPick').addEventListener('click', openPicker);
let lastFocus = null;
function openModal(sel) { lastFocus = document.activeElement; const m = $(sel); m.classList.add('open'); setTimeout(() => { const f = $('.tcard.on, button, input', m); f && f.focus(); }, 30); }
function closeModals() { $$('.modal.open').forEach(m => m.classList.remove('open')); lastFocus && lastFocus.focus && lastFocus.focus(); }

/* next customer + reset */
$('#btnNext').addEventListener('click', () => {
  const t = cur(), f = ensureFields(t);
  f.__rec = ''; f.__no = newNo(t.prefix); if (t.id === 'voucher') f.code = 'GIFT-' + rid(5);
  state.sign.issue = TODAY;
  buildForm(); render(); save(); setView('edit');
  const r = $('#x_rec'); r && r.focus();
  toast('Ready for the next customer. New certificate number issued.');
});
$('#btnReset').addEventListener('click', () => openModal('#confirmModal'));
$('#cfOk').addEventListener('click', () => { state = freshState(); cache.clear(); try { localStorage.removeItem(KEY); } catch (e) {} closeModals(); buildForm(); syncStatic(); render(); toast('Back to the sample content.'); });

/* ================= images in ================= */
function readImage(file, maxDim) {
  return new Promise((res, rej) => {
    if (!file) return rej();
    if (file.size > 10 * 1024 * 1024) { toast('That image is over 10 MB. Try a smaller file.'); return rej(); }
    const rd = new FileReader();
    rd.onerror = rej;
    rd.onload = () => {
      const url = rd.result;
      if (file.type === 'image/svg+xml') return res(url);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, maxDim / Math.max(img.width, img.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        res(cv.toDataURL('image/png'));
      };
      img.onerror = () => { toast('That file could not be read as an image.'); rej(); };
      img.src = url;
    };
    rd.readAsDataURL(file);
  });
}
async function setLogo(file) {
  try { state.brand.logo = await readImage(file, 900); syncStatic(); render(); save(); toast('Logo added. Tap “Use colors from logo” to match your brand.'); } catch (e) {}
}
$('#logoInput').addEventListener('change', e => { setLogo(e.target.files[0]); e.target.value = ''; });
const drop = $('#logoDrop');
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
drop.addEventListener('drop', e => setLogo(e.dataTransfer.files[0]));
$('#btnLogoRemove').addEventListener('click', e => { e.preventDefault(); state.brand.logo = ''; syncStatic(); render(); save(); });
$('#btnLogoColors').addEventListener('click', e => {
  e.preventDefault();
  const img = new Image();
  img.onload = () => {
    const N = 80, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d');
    const s = Math.min(N / img.width, N / img.height) || 1; x.drawImage(img, 0, 0, img.width * s || N, img.height * s || N);
    const d = x.getImageData(0, 0, N, N).data, buckets = new Map();
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 200) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 510, sat = mx === mn ? 0 : (mx - mn) / (255 - Math.abs(mx + mn - 255));
      if (sat < .22 || l > .9 || l < .1) continue;
      const key = [r, g, b].map(v => v >> 5).join(',');
      const bk = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 }; bk.n++; bk.r += r; bk.g += g; bk.b += b; buckets.set(key, bk);
    }
    const cols = [...buckets.values()].filter(b => b.n > 6).sort((a, b) => b.n - a.n).map(b => hex([b.r / b.n, b.g / b.n, b.b / b.n]));
    if (!cols.length) { toast('Your logo has no strong colors to pull from. Pick them below.'); return; }
    const hue = h => { const [r, g, b] = rgb(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return 0; let H = mx === r ? (g - b) / (mx - mn) : mx === g ? 2 + (b - r) / (mx - mn) : 4 + (r - g) / (mx - mn); return (H * 60 + 360) % 360; };
    const p = cols[0]; const a = cols.find(c => { const dh = Math.abs(hue(c) - hue(p)); return Math.min(dh, 360 - dh) > 28; });
    state.brand.primary = p; if (a) state.brand.accent = a;
    syncStatic(); render(); save(); toast(a ? 'Applied 2 colors from your logo.' : 'Applied your logo color. Pick an accent below.');
  };
  img.src = state.brand.logo;
});
$('#sigInput').addEventListener('change', async e => { try { state.sign.img = await readImage(e.target.files[0], 900); state.sign.mode = 'upload'; syncStatic(); render(); save(); } catch (er) {} e.target.value = ''; });

/* ================= signature pad ================= */
const pad = $('#pad'); let pctx, drawing = false, strokes = 0, last = null;
function openPad() {
  openModal('#padModal');
  requestAnimationFrame(() => {
    const r = pad.getBoundingClientRect(), dpr = Math.max(2, window.devicePixelRatio || 1);
    pad.width = r.width * dpr; pad.height = r.height * dpr; pctx = pad.getContext('2d'); pctx.scale(dpr, dpr);
    pctx.lineCap = 'round'; pctx.lineJoin = 'round'; pctx.strokeStyle = '#1b2230'; pctx.lineWidth = 2.6; strokes = 0; $('#padPh').hidden = false;
  });
}
const pt = e => { const r = pad.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
pad.addEventListener('pointerdown', e => { e.preventDefault(); pad.setPointerCapture(e.pointerId); drawing = true; last = pt(e); strokes++; $('#padPh').hidden = true; pctx.beginPath(); pctx.arc(last.x, last.y, 1.2, 0, Math.PI * 2); pctx.fillStyle = '#1b2230'; pctx.fill(); });
pad.addEventListener('pointermove', e => { if (!drawing) return; const p = pt(e); pctx.beginPath(); pctx.moveTo(last.x, last.y); pctx.quadraticCurveTo(last.x, last.y, (last.x + p.x) / 2, (last.y + p.y) / 2); pctx.lineTo(p.x, p.y); pctx.stroke(); last = p; });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => pad.addEventListener(ev, () => drawing = false));
$('#padClear').addEventListener('click', () => { pctx.clearRect(0, 0, pad.width, pad.height); strokes = 0; $('#padPh').hidden = false; });
$('#padUse').addEventListener('click', () => {
  if (!strokes) { toast('Draw your signature first.'); return; }
  const w = pad.width, h = pad.height, d = pctx.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const m = 8; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w, x1 + m); y1 = Math.min(h, y1 + m);
  const out = document.createElement('canvas'); out.width = x1 - x0; out.height = y1 - y0; out.getContext('2d').drawImage(pad, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  state.sign.img = out.toDataURL('image/png'); state.sign.mode = 'draw';
  closeModals(); syncStatic(); render(); save();
});

/* ================= export ================= */
let dlNS = null;
const hasClaude = !!(window.claude && typeof window.claude.use === 'function');
const dlReady = hasClaude ? Promise.resolve().then(() => window.claude.use('downloads')).then(n => { dlNS = n; }).catch(() => { dlNS = null; }) : Promise.resolve();
async function saveBlob(blob, name) {
  if (hasClaude) {
    await dlReady;
    if (dlNS) {
      try { await dlNS.save({ filename: name, data: blob }); toast('Saved ' + name); }
      catch (e) {
        const code = e && e.code;
        toast(code === 'declined' ? 'Download cancelled.' : code === 'rate_limited' ? 'A download prompt is already open.' : 'Downloads are not available in this view.');
      }
      return;
    }
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('Downloaded ' + name);
}
let exporting = false;
async function exportFile(kind, btn) {
  if (exporting) return;
  if (!window.html2canvas || (kind === 'pdf' && !(window.jspdf && window.jspdf.jsPDF))) { toast('The export tools are still loading. Try again in a moment.'); return; }
  exporting = true;
  const btns = $$(`[data-export]`); btns.forEach(b => b.disabled = true);
  const label = btn ? btn.innerHTML : ''; if (btn) btn.textContent = 'Preparing…';
  let holder;
  try {
    try { await document.fonts.ready; } catch (e) {}
    cache.clear(); doRender();
    const src = $('#stageInner .cert');
    holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-40000px;top:0;pointer-events:none';
    holder.innerHTML = src.outerHTML; document.body.appendChild(holder);
    const el = holder.firstElementChild; el.style.transform = 'none';
    await Promise.all($$('img', el).map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
    const dm = dims();
    const scale = Math.min(kind === 'pdf' ? 3.125 : 2.5, Math.sqrt(15e6 / (dm.w * dm.h)));
    const canvas = await html2canvas(el, { scale, backgroundColor: null, useCORS: true, logging: false, width: dm.w, height: dm.h, scrollX: 0, scrollY: 0, windowWidth: Math.max(document.documentElement.clientWidth, dm.w) });
    const c = ctx();
    const base = [slug(word('title', c)), slug(c.rec), c.t.id === 'voucher' ? slug(c.f.code) : slug(c.f.__no)].filter(Boolean).join('-') || 'certificate';
    let blob;
    if (kind === 'png') blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    else {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: dm.pw > dm.ph ? 'landscape' : 'portrait', unit: 'in', format: [dm.pw, dm.ph], compress: true });
      pdf.addImage(canvas.toDataURL('image/jpeg', .95), 'JPEG', 0, 0, dm.pw, dm.ph, undefined, 'FAST');
      pdf.setProperties({ title: word('title', c), subject: `${word('title', c)} for ${c.rec || 'customer'}`, author: state.brand.name, creator: 'Trust Certificate Studio' });
      blob = pdf.output('blob');
    }
    await saveBlob(blob, `${base}.${kind}`);
  } catch (e) {
    console.error(e); toast('Something went wrong while building the file. Try again.');
  } finally {
    holder && holder.remove();
    exporting = false; btns.forEach(b => b.disabled = false); if (btn) btn.innerHTML = label;
  }
}

/* ================= saved templates (this device) ================= */
const LIB_KEY = 'trust-cert-studio:templates:v1';
const clone = o => JSON.parse(JSON.stringify(o));
function libRead() { try { const a = JSON.parse(localStorage.getItem(LIB_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function libWrite(list) { localStorage.setItem(LIB_KEY, JSON.stringify(list)); }
function libCount() { const n = libRead().length; $('#myCount').textContent = n ? String(n) : ''; }
const fmtStamp = ms => new Date(ms).toLocaleDateString(state.design.dateStyle === 'intl' ? 'en-GB' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });

$('#btnSaveTpl').addEventListener('click', () => {
  const t = cur();
  $('#svName').value = `${t.name}${T(state.brand.name) ? ' · ' + T(state.brand.name) : ''}`;
  $('#svKeepRec').checked = false;
  $('#svHint').textContent = 'Using a name you already saved replaces that template.';
  openModal('#saveModal');
  setTimeout(() => { $('#svName').focus(); $('#svName').select(); }, 40);
});
$('#svName').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#svOk').click(); } });
$('#svOk').addEventListener('click', () => {
  const name = T($('#svName').value);
  if (!name) { toast('Give the template a name.'); $('#svName').focus(); return; }
  const t = cur(), f = clone(ensureFields(t));
  if (!$('#svKeepRec').checked) f.__rec = '';
  delete f.__no;
  const entry = { id: 'tp_' + rid(8), name, tpl: t.id, savedAt: Date.now(), fields: f, words: clone(state.words[t.id] || {}), brand: clone(state.brand), design: clone(state.design), sign: clone(state.sign) };
  delete entry.sign.issue;
  let list = libRead();
  const same = list.findIndex(x => x.name.toLowerCase() === name.toLowerCase());
  if (same >= 0) { entry.id = list[same].id; list[same] = entry; } else list.unshift(entry);
  try { libWrite(list); toast(same >= 0 ? `Updated “${name}”.` : `Saved “${name}” to this device.`); }
  catch (e) {
    // Out of space: retry without the heavy images; the current logo/signature is used on load.
    entry.brand.logo = ''; entry.noLogo = true; entry.sign.img = ''; entry.noSig = true;
    try { libWrite(list); toast(`Saved “${name}” without the logo and signature. This browser is short on space.`); }
    catch (e2) { toast('This browser has no room to save templates. Use Back up to file instead.'); return; }
  }
  closeModals(); libCount();
});

function renderLib() {
  const list = libRead();
  $('#libList').innerHTML = list.length ? list.map(x => {
    const t = byId(x.tpl);
    return `<div class="lib-item" data-id="${esc(x.id)}"><div class="tpl-ico">${icon(t.icon)}</div><div class="meta"><b>${esc(x.name)}</b><span>${esc(t.name)} · Saved ${esc(fmtStamp(x.savedAt))}</span></div><div class="acts"><button type="button" class="btn btn-primary btn-sm" data-lib-load>Use</button><button type="button" class="btn btn-secondary btn-sm" data-lib-del aria-label="Delete ${esc(x.name)}">Delete</button></div></div>`;
  }).join('') : '<div class="lib-empty">No saved templates yet. Set up a certificate the way you like it, then choose Save as template.</div>';
  $('#libExport').disabled = !list.length;
}
$('#btnMyTpl').addEventListener('click', () => { renderLib(); openModal('#libModal'); });
$('#libList').addEventListener('click', e => {
  const item = e.target.closest('.lib-item'); if (!item) return;
  const id = item.dataset.id;
  const del = e.target.closest('[data-lib-del]');
  if (del) {
    if (!del.classList.contains('btn-danger')) { del.classList.add('btn-danger'); del.textContent = 'Confirm'; setTimeout(() => { if (del.isConnected) { del.classList.remove('btn-danger'); del.textContent = 'Delete'; } }, 4000); return; }
    try { libWrite(libRead().filter(x => x.id !== id)); } catch (er) {}
    renderLib(); libCount(); toast('Template deleted.');
    return;
  }
  if (e.target.closest('[data-lib-load]')) loadSaved(libRead().find(x => x.id === id));
});
function loadSaved(x) {
  if (!x) return;
  const t = byId(x.tpl), fresh = freshState();
  const f = { ...clone(x.fields) };
  for (const fd of t.fields) if (fd.type === 'date') f[fd.k] = typeof fd.def === 'function' ? fd.def() : (fd.def ?? '');
  f.__no = newNo(t.prefix);
  if (t.id === 'voucher') f.code = 'GIFT-' + rid(5);
  state.tpl = t.id; state.fields[t.id] = f; state.words[t.id] = clone(x.words || {});
  const keepLogo = state.brand.logo, keepSig = state.sign.img;
  state.brand = { ...fresh.brand, ...clone(x.brand) }; if (x.noLogo) state.brand.logo = keepLogo;
  state.design = { ...fresh.design, ...clone(x.design) };
  state.sign = { ...fresh.sign, ...clone(x.sign), issue: TODAY }; if (x.noSig) state.sign.img = keepSig;
  ensureFields(t); cache.clear();
  closeModals(); buildForm(); syncStatic(); render(); save(); setView('edit');
  toast(`Loaded “${x.name}”. New certificate number issued.`);
  const r = $('#x_rec'); if (r && !T(r.value)) r.focus();
}
$('#libExport').addEventListener('click', () => {
  const list = libRead(); if (!list.length) return;
  const data = JSON.stringify({ app: 'trust-certificate-studio', version: 1, exportedAt: new Date().toISOString(), templates: list }, null, 2);
  saveBlob(new Blob([data], { type: 'application/json' }), `certificate-templates-${TODAY}.json`);
});
$('#libImport').addEventListener('click', () => $('#libFile').click());
$('#libFile').addEventListener('change', async e => {
  const file = e.target.files[0]; e.target.value = ''; if (!file) return;
  try {
    const obj = JSON.parse(await file.text());
    const incoming = (Array.isArray(obj) ? obj : obj.templates || []).filter(x => x && typeof x === 'object' && TPL.some(t => t.id === x.tpl) && x.fields && T(x.name));
    if (!incoming.length) { toast('No templates found in that file.'); return; }
    const list = libRead(); let added = 0, updated = 0;
    for (const x of incoming) {
      const clean = { id: T(x.id) || 'tp_' + rid(8), name: T(x.name).slice(0, 80), tpl: x.tpl, savedAt: +x.savedAt || Date.now(), fields: x.fields, words: x.words || {}, brand: x.brand || {}, design: x.design || {}, sign: x.sign || {}, noLogo: !!x.noLogo, noSig: !!x.noSig };
      const i = list.findIndex(y => y.id === clean.id || y.name.toLowerCase() === clean.name.toLowerCase());
      if (i >= 0) { list[i] = clean; updated++; } else { list.push(clean); added++; }
    }
    try { libWrite(list); } catch (er) { toast('This browser does not have room for all of those templates.'); return; }
    renderLib(); libCount();
    toast(`Restored ${added + updated} template${added + updated === 1 ? '' : 's'}.`);
  } catch (er) { toast('That file could not be read. Choose a backup made by this app.'); }
});

/* ================= toast ================= */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200); }

/* ================= init ================= */
ensureFields(cur());
buildForm(); syncStatic(); render(); libCount();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { cache.clear(); render(); });
window.addEventListener('load', () => { cache.clear(); render(); });
window.__certApp = { state: () => state, render: doRender, pick: pickTemplate, setVal };
})();
