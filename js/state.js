"use strict";
/* =====================================================================
   STATE
===================================================================== */
const CELL_TYPES = [
  ["open","Open niche"],["door","Door"],["door-push","Door (push to open)"],
  ["drawer","Drawer"],["tv","TV niche"],["tv-panel","TV with panel (flush)"],["fireplace","Electric fireplace"]
];
const HINGES=[["left","Left"],["right","Right"],["top","Top (lift-up)"],["bottom","Bottom (drop-down)"]];
const HINGE_ARROW={left:"◀",right:"▶",top:"▲",bottom:"▼"};
const DECOR = [["none","Empty"],["books","Books"],["objects","Objects"],["mixed","Books + objects"],
  ["soundbar","Soundbar"],["speaker1","1 speaker"],["speaker2","2 speakers (L/R)"],["speaker3","3 speakers (L/C/R)"]];
const TVS = [43,50,55,65,75,85];
const FINISHES = [["oak","Oak"],["walnut","Walnut"],["black","Matte black"],["white","White"],
  ["smoked","Smoked oak"],["ash","Light ash"],["slats","Walnut slats (acoustic)"],
  ["concrete","Concrete / microcement"],["marble","Marble"],["travertine","Travertine"],
  ["anthracite","Anthracite"],["greige","Greige"],["sage","Sage green"],["navy","Navy blue"]];
const EXTRA_FIN=[["match","Match main finish"],["dark","Dark (shadow)"]];
function finLabel(key){
  const f=EXTRA_FIN.concat(FINISHES).find(x=>x[0]===key);
  return f?f[1]:key;
}

function newCell(t){ return {type:t||"open", decor:"none", tv:65, tvGap:5, hinge:"left", setback:0, border:0, shelves:0, faceplate:false}; }

const FACEPLATE_TYPES={"open":1,"tv":1,"tv-panel":1,"fireplace":1}; // niches that can join the continuous face plate layer
function isFaceplate(c){ return !!c.faceplate && !!FACEPLATE_TYPES[c.type]; }
/* face-plate frame width for open niches: exactly the niche's front border value (0 = no covering) */
function fpFrame(c,cw,rh){
  return cellBorder(c,cw,rh); // already clamped to keep at least a 4 cm opening
}

/* niche recess setback: how far the niche's back is brought forward from the unit back */
function cellSetback(c){
  const v=Math.max(0, +(c.setback||0));
  return Math.min(v, Math.max(0, S.depth-5)); // always keep at least 5 cm of recess
}
/* niche front border: fixed trim around the opening, flush with the fronts */
function cellBorder(c,cw,rh){
  const v=Math.max(0, +(c.border||0));
  return Math.min(v, Math.max(0,(Math.min(cw,rh)-4)/2)); // keep at least a 4 cm opening
}
const SETBACK_TYPES={"open":1,"tv":1,"fireplace":1}; // recessed niches: setback + front border configurable
const SHELF_TYPES={"open":1,"door":1,"door-push":1};  // niches that can take internal horizontal shelves

/* flush TV-panel geometry: TV size from diagonal, opening = TV + reveal gap all round */
function tvPanelCalc(c,cw,rh){
  const gap=Math.max(0, c.tvGap!=null?+c.tvGap:5);
  const diag=(c.tv||65)*2.54, minB=3; // keep at least 3 cm of panel border
  let tw=Math.min(diag*0.872, cw-0.4-2*gap-2*minB);
  let th=Math.min(diag*0.49,  rh-0.4-2*gap-2*minB);
  tw=Math.max(10,tw); th=Math.max(8,th);
  return {gap, tw:Math.round(tw*10)/10, th:Math.round(th*10)/10,
          ow:Math.round((tw+2*gap)*10)/10, oh:Math.round((th+2*gap)*10)/10};
}

/* migrate older saved designs: door-l / door-r → door + hinge */
function migrateDesign(d){
  (d.rows||[]).forEach(r=>(r.cols||[]).forEach(col=>{
    const c=col.c||{};
    if(c.type==="door-l"){ c.type="door"; c.hinge="left"; }
    else if(c.type==="door-r"){ c.type="door"; c.hinge="right"; }
    if(!c.hinge) c.hinge="left";
  }));
  return d;
}

/* ---------- demo design (loaded from demo.json) ---------- */
let DEMO_STATE = null;
async function loadDemoState(){
  if(!DEMO_STATE){
    const res = await fetch("demo.json");
    if(!res.ok) throw new Error("HTTP "+res.status);
    DEMO_STATE = await res.json();
  }
  return DEMO_STATE;
}
function defaultState(){
  return JSON.parse(JSON.stringify(DEMO_STATE)); // deep clone: caller may safely mutate
}

/* ---------- persistence (localStorage autosave) ---------- */
const SAVE_KEY="cinewall-designer-v1";
let storageOK=true;
function loadSaved(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(raw){ const d=JSON.parse(raw); if(d && d.rows && d.unitWidth) return migrateDesign(d); }
  }catch(e){ storageOK=false; }
  return null;
}
let S = null;
let expandedRow = null; // accordion: only one row card open (top row first) — set once S is ready

let saveTimer=0;
function saveState(){
  if(!storageOK) return;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{
    try{
      localStorage.setItem(SAVE_KEY,JSON.stringify(S));
      const el=document.getElementById("saveStatus");
      if(el) el.textContent="Autosaved ✓ "+new Date().toTimeString().slice(0,5);
    }catch(e){ storageOK=false; updateSaveStatus(); }
  },350);
}
function updateSaveStatus(){
  const el=document.getElementById("saveStatus");
  if(el) el.textContent = storageOK
    ? "Autosaves to this browser on every change."
    : "Autosave unavailable in this environment — use Export JSON to keep your design.";
}

/* ---------- undo / redo history ---------- */
const HISTORY_LIMIT = 100;
let historyStack = [];
let historyIndex = -1;
let historyTimer = 0;
function initHistory(){
  historyStack = [JSON.stringify(S)];
  historyIndex = 0;
  updateUndoRedoButtons();
}
function recordHistory(){ // commit the current S as a new history entry
  historyTimer = 0;
  const snap = JSON.stringify(S);
  if(historyIndex>=0 && historyStack[historyIndex]===snap) return; // nothing actually changed
  historyStack.length = historyIndex+1; // drop any redo branch
  historyStack.push(snap);
  if(historyStack.length>HISTORY_LIMIT) historyStack.shift();
  historyIndex = historyStack.length-1;
  updateUndoRedoButtons();
}
function scheduleHistory(){ // coalesce bursts (typing, dragging) into one entry after a pause
  clearTimeout(historyTimer);
  historyTimer=setTimeout(recordHistory,500);
}
function flushHistory(){ // commit a pending burst immediately (used right before undo/redo)
  if(historyTimer){ clearTimeout(historyTimer); recordHistory(); }
}
function undo(){
  flushHistory();
  if(historyIndex<=0) return;
  historyIndex--;
  restoreHistoryEntry();
}
function redo(){
  flushHistory();
  if(historyIndex>=historyStack.length-1) return;
  historyIndex++;
  restoreHistoryEntry();
}
function restoreHistoryEntry(){
  S = JSON.parse(historyStack[historyIndex]);
  if(expandedRow!=null && expandedRow>=S.rows.length) expandedRow = S.rows.length?S.rows.length-1:null;
  renderSidebar();
  scheduleRebuild();
  updateUndoRedoButtons();
}
function updateUndoRedoButtons(){
  const bu=document.getElementById("btnUndo"), br=document.getElementById("btnRedo");
  if(bu) bu.disabled = historyIndex<=0;
  if(br) br.disabled = historyIndex>=historyStack.length-1;
}

/* ---------- derived helpers ---------- */
function totalHeight(){ // plinth + bottom panel + rows + shelves/top
  return S.plinth + S.thickness + S.rows.reduce((a,r)=>a + r.height + S.thickness, 0);
}
function plinthRecess(){ // front setback of the plinth from the unit's front plane
  const v = S.plinthRecess!=null ? +S.plinthRecess : 2;
  return Math.min(Math.max(0,v), Math.max(0, S.depth-2));
}
function ensureDividers(row){
  // dividers[0] = left outer side, dividers[n] = right outer side, in-between = internal
  const need=row.cols.length+1;
  if(!Array.isArray(row.dividers)){ row.dividers=Array(need).fill(true); return; }
  if(row.dividers.length!==need){
    const L=row.dividers[0]!==false, R=row.dividers[row.dividers.length-1]!==false;
    const inner=row.dividers.slice(1,-1).map(v=>v!==false);
    while(inner.length<need-2) inner.push(true);
    inner.length=Math.max(0,need-2);
    row.dividers=[L,...inner,R];
  }
}
function rowAvail(row){ // interior width available for niches in a row
  ensureDividers(row);
  const nd=row.dividers.reduce((a,b)=>a+(b?1:0),0);
  return S.unitWidth - nd*S.thickness;
}
function rowSum(row){ return row.cols.reduce((a,c)=>a+c.w,0); }
function normWidths(row){ // widths scaled to exactly fill available space
  const avail = rowAvail(row), sum = rowSum(row) || 1;
  return row.cols.map(c => c.w * avail / sum);
}
function equalizeRow(i, silent){
  const row = S.rows[i], avail = rowAvail(row);
  const w = Math.round(avail / row.cols.length * 10)/10;
  row.cols.forEach(c=>c.w=w);
  // absorb rounding in last column
  row.cols[row.cols.length-1].w = Math.round((avail - w*(row.cols.length-1))*10)/10;
  if(!silent){ renderSidebar(); scheduleRebuild(); }
}
const MIN_COL_W = 5;
function setColumnWidth(i, j, v){
  const row=S.rows[i], avail=rowAvail(row), n=row.cols.length;
  if(n===1){ row.cols[0].w=Math.round(avail*10)/10; return; }
  // clamp the edited column so every other column keeps at least MIN_COL_W
  v=Math.max(MIN_COL_W, Math.min(v, avail-(n-1)*MIN_COL_W));
  v=Math.round(v*10)/10;
  row.cols[j].w=v;
  // redistribute the remainder: each sibling keeps at least MIN_COL_W,
  // and the slack above that is shared proportionally to their current widths
  const others=row.cols.filter((_,k)=>k!==j);
  const rest=Math.round((avail-v)*10)/10;
  const extra=rest-others.length*MIN_COL_W;
  const weights=others.map(c=>c.w);
  const wsum=weights.reduce((a,b)=>a+b,0);
  let acc=0;
  others.forEach((c,k)=>{
    let w;
    if(k===others.length-1) w=Math.round((rest-acc)*10)/10; // absorb rounding
    else {
      const share = wsum>0 ? extra*weights[k]/wsum : extra/others.length;
      w=Math.round((MIN_COL_W+share)*10)/10;
    }
    c.w=w; acc=Math.round((acc+w)*10)/10;
  });
  // safeguard: if rounding left the last sibling under the minimum, borrow from the widest one
  const last=others[others.length-1];
  if(last.w<MIN_COL_W && others.length>1){
    const donor=others.slice(0,-1).sort((a,b)=>b.w-a.w)[0];
    donor.w=Math.round((donor.w-(MIN_COL_W-last.w))*10)/10;
    last.w=MIN_COL_W;
  }
}
function syncRowWidthInputs(i, skipJ){
  document.querySelectorAll(`input[data-a="cellw"][data-row="${i}"]`).forEach(inp=>{
    const j=+inp.dataset.col;
    if(j!==skipJ) inp.value=fmt(S.rows[i].cols[j].w);
  });
}
function fmt(n){ return (Math.round(n*10)/10).toString(); }
function rowName(i){ const n=(S.rows[i].name||"").trim(); return n || ("Row "+(i+1)); }
function esc(s){ return String(s).replace(/[&<>"']/g,
  m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }
