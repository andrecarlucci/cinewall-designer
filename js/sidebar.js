"use strict";
/* =====================================================================
   SIDEBAR UI
===================================================================== */
const controls = document.getElementById("controls");

function renderSidebar(){
  let h = `
  <div class="section">
    <h2>Overall unit</h2>
    <div class="grid3">
      <div class="field"><label>Width (cm)</label><input type="number" step="0.5" min="30" value="${S.unitWidth}" data-g="unitWidth"></div>
      <div class="field"><label>Depth (cm)</label><input type="number" step="0.5" min="15" value="${S.depth}" data-g="depth"></div>
      <div class="field"><label>Plinth (cm)</label><input type="number" step="0.5" min="0" value="${S.plinth}" data-g="plinth"></div>
    </div>
    <div class="grid3" style="margin-top:8px">
      <div class="field"><label>Panel thickness (cm)</label><input type="number" step="0.1" min="1" max="4" value="${S.thickness}" data-g="thickness"></div>
      <div class="field"><label>Plinth recess (cm)</label><input type="number" step="0.5" min="0" value="${S.plinthRecess!=null?S.plinthRecess:2}" data-g="plinthRecess"></div>
      <div class="field"><label>Finish</label><select data-g="finish">${FINISHES.map(f=>`<option value="${f[0]}"${S.finish===f[0]?" selected":""}>${f[1]}</option>`).join("")}</select></div>
    </div>
    <div class="grid2" style="margin-top:8px">
      <div class="field"><label>Back panel finish</label><select data-g="backFinish">
        ${EXTRA_FIN.concat(FINISHES).map(f=>`<option value="${f[0]}"${(S.backFinish||"dark")===f[0]?" selected":""}>${f[1]}</option>`).join("")}</select></div>
      <div class="field"><label>Plinth finish</label><select data-g="plinthFinish">
        ${EXTRA_FIN.concat(FINISHES).map(f=>`<option value="${f[0]}"${(S.plinthFinish||"dark")===f[0]?" selected":""}>${f[1]}</option>`).join("")}</select></div>
    </div>
    <label class="check"><input type="checkbox" data-g="backPanel"${S.backPanel?" checked":""}> Back panel (6&nbsp;mm)</label>
    <div class="computed" id="computedBox"></div>
  </div>
  <div class="section" style="background:none;border:none;padding:4px 2px 0">
    <h2 style="margin-bottom:6px">Rows <small style="color:var(--muted);text-transform:none;letter-spacing:0">(top of unit first)</small></h2>
  </div>`;

  for(let i=S.rows.length-1;i>=0;i--){
    const row=S.rows[i], avail=rowAvail(row), sum=rowSum(row);
    const ok = Math.abs(sum-avail)<0.06;
    const open = (expandedRow===i);
    h += `
    <div class="rowcard${open?"":" collapsed"}" data-row="${i}">
      <div class="rhead" title="${open?"Collapse":"Expand"} row">
        <span class="chev">${open?"▾":"▸"}</span>
        <div class="rname">
          <input type="text" class="rname-input" maxlength="40" placeholder="Row ${i+1}"
            value="${esc(row.name||"")}" data-a="rowname" data-row="${i}"
            aria-label="Name for row ${i+1}">
          <small>Row ${i+1} · ${i===0?"bottom":(i===S.rows.length-1?"top":"middle")} · ${fmt(row.height)} cm · ${row.cols.length} niche${row.cols.length>1?"s":""}</small>
        </div>
        <button class="tiny" data-a="rowup" data-row="${i}" title="Move up" ${i===S.rows.length-1?"disabled":""}>↑</button>
        <button class="tiny" data-a="rowdown" data-row="${i}" title="Move down" ${i===0?"disabled":""}>↓</button>
        <button class="tiny danger" data-a="delrow" data-row="${i}" title="Delete row" ${S.rows.length<2?"disabled":""}>✕</button>
      </div>
      <div class="rbody">
        <div class="grid2">
          <div class="field"><label>Niche height (cm)</label>
            <input type="number" step="0.5" min="5" value="${row.height}" data-a="rowh" data-row="${i}"></div>
          <div class="field"><label>Columns</label>
            <div style="display:flex;gap:5px">
              <button class="tiny" data-a="delcol" data-row="${i}" ${row.cols.length<2?"disabled":""}>−</button>
              <input type="number" readonly value="${row.cols.length}" style="text-align:center;background:var(--bg);border:1px solid var(--line);border-radius:5px;color:var(--text);width:100%;font-family:var(--mono)">
              <button class="tiny" data-a="addcol" data-row="${i}">+</button>
            </div></div>
        </div>
        <div class="rowtools">
          <span class="badge ${ok?"ok":"bad"}" data-badge="${i}">Σ ${fmt(sum)} / ${fmt(avail)} cm${ok?"":" → scaled"}</span>
          <button class="tiny" data-a="equalize" data-row="${i}">Equalize</button>
        </div>
        <div class="divmaplabel">Vertical panels — tap to remove / add (incl. outer sides)</div>
        <div class="divmap">${divMapHTML(i)}</div>
        ${row.cols.map((col,j)=>cellHTML(i,j,col)).join("")}
      </div>
    </div>`;
  }

  h += `
  <div class="btnrow">
    <button class="primary" data-a="addrow">+ Add row on top</button>
    <button data-a="reset">Reset example</button>
  </div>
  <div class="section" style="margin-top:14px">
    <h2>Project file</h2>
    <div class="btnrow" style="margin-top:0">
      <button data-a="export">Export design (JSON)</button>
      <button data-a="import">Import file</button>
      <button data-a="paste">Paste design</button>
      <button class="danger" data-a="clearsave">Clear saved design</button>
    </div>
    <div class="computed" id="saveStatus" style="border-top:none;padding-top:6px;color:var(--muted)"></div>
  </div>`;
  controls.innerHTML = h;
  updateComputed();
  updateSaveStatus();
}

function divMapHTML(i){
  const row=S.rows[i]; ensureDividers(row);
  const widths=normWidths(row);
  let h="";
  for(let j=0;j<row.cols.length;j++){
    h+=divBar(i,j,row.dividers[j]);
    h+=`<div class="divcell" style="flex-grow:${Math.max(widths[j],1)}" title="${fmt(widths[j])} cm">
      <span>${String.fromCharCode(65+j)}</span></div>`;
  }
  h+=divBar(i,row.cols.length,row.dividers[row.cols.length]);
  return h;
}
function divBar(i,b,on){
  const n=S.rows[i].cols.length;
  const what=b===0?"left side panel":(b===n?"right side panel":"divider between "+String.fromCharCode(64+b)+" and "+String.fromCharCode(65+b));
  return `<button type="button" class="divbar${on?" on":""}" data-a="togdiv" data-row="${i}" data-b="${b}"
    aria-pressed="${on}" title="${on?"Remove":"Add"} ${what}"></button>`;
}

function cellHTML(i,j,col){
  const c=col.c;
  let extra="";
  const sbField=`<div class="field"><label>Setback (cm)</label>
    <input type="number" step="0.5" min="0" value="${c.setback!=null?c.setback:0}" data-a="setback" data-row="${i}" data-col="${j}"></div>
    <div class="field"><label>Front border (cm)</label>
    <input type="number" step="0.5" min="0" value="${c.border!=null?c.border:0}" data-a="border" data-row="${i}" data-col="${j}"></div>`;
  const hingeField=()=>{
    const hg=c.hinge||"left";
    return `<div class="field"><label>Hinge side</label><select data-a="hinge" data-row="${i}" data-col="${j}">
      ${HINGES.map(h=>`<option value="${h[0]}"${hg===h[0]?" selected":""}>${h[1]}</option>`).join("")}</select></div>`;
  };
  const shField=`<div class="field"><label>Shelves</label>
    <input type="number" step="1" min="0" max="20" value="${Math.max(0,Math.floor(c.shelves||0))}" data-a="shelves" data-row="${i}" data-col="${j}"></div>`;
  const fpField = FACEPLATE_TYPES[c.type] ?
    `<label class="check fpcheck"><input type="checkbox" data-a="faceplate" data-row="${i}" data-col="${j}"${c.faceplate?" checked":""}>
     Part of face plate <small>(flush timber layer that hides framing &amp; wiring)</small></label>` : "";
  if(c.type==="open"){
    extra=`<div class="field"><label>Contents</label><select data-a="decor" data-row="${i}" data-col="${j}">
      ${DECOR.map(d=>`<option value="${d[0]}"${c.decor===d[0]?" selected":""}>${d[1]}</option>`).join("")}</select></div>${sbField}${shField}`;
  } else if(c.type==="door"){
    extra=hingeField()+shField;
  } else if(c.type==="door-push"){
    extra=hingeField()+shField;
  } else if(c.type==="tv"){
    const gapField=c.faceplate?`<div class="field"><label>Reveal gap (cm)</label>
      <input type="number" step="0.5" min="0" value="${c.tvGap!=null?c.tvGap:5}" data-a="tvgap" data-row="${i}" data-col="${j}"></div>`:"";
    extra=`<div class="field"><label>TV size</label><select data-a="tvsize" data-row="${i}" data-col="${j}">
      ${TVS.map(t=>`<option value="${t}"${c.tv===t?" selected":""}>${t}″</option>`).join("")}</select></div>${sbField}${gapField}`;
  } else if(c.type==="fireplace"){
    extra=sbField;
  } else if(c.type==="tv-panel"){
    extra=`<div class="field"><label>TV size</label><select data-a="tvsize" data-row="${i}" data-col="${j}">
      ${TVS.map(t=>`<option value="${t}"${c.tv===t?" selected":""}>${t}″</option>`).join("")}</select></div>
      <div class="field"><label>Border gap (cm)</label>
      <input type="number" step="0.5" min="0" value="${c.tvGap!=null?c.tvGap:5}" data-a="tvgap" data-row="${i}" data-col="${j}"></div>`;
  }
  extra += fpField;
  return `<div class="cell">
    <div class="ctop">
      <span class="celltag">${String.fromCharCode(65+j)}</span>
      <div class="field wsm"><label>Width</label>
        <input type="number" step="0.5" min="5" value="${col.w}" data-a="cellw" data-row="${i}" data-col="${j}"></div>
      <div class="field"><label>Type</label>
        <select data-a="celltype" data-row="${i}" data-col="${j}">
          ${CELL_TYPES.map(t=>`<option value="${t[0]}"${c.type===t[0]?" selected":""}>${t[1]}</option>`).join("")}
        </select></div>
    </div>
    ${extra?`<div class="extra">${extra}</div>`:""}
  </div>`;
}

function updateComputed(){
  const el=document.getElementById("computedBox");
  if(el) el.innerHTML =
    `Overall size&nbsp; <b>${fmt(S.unitWidth)} W × ${fmt(totalHeight())} H × ${fmt(S.depth)} D</b> cm<br>`+
    `Rows: <b>${S.rows.length}</b> · Niches: <b>${S.rows.reduce((a,r)=>a+r.cols.length,0)}</b>`;
}
function updateBadge(i){
  const el=document.querySelector(`[data-badge="${i}"]`);
  if(!el) return;
  const row=S.rows[i], avail=rowAvail(row), sum=rowSum(row);
  const ok=Math.abs(sum-avail)<0.06;
  el.className="badge "+(ok?"ok":"bad");
  el.textContent=`Σ ${fmt(sum)} / ${fmt(avail)} cm${ok?"":" → scaled"}`;
}

/* ---------- events (delegated) ---------- */
function rescaleRow(i){
  const row=S.rows[i], avail=rowAvail(row), sum=rowSum(row)||1;
  let acc=0;
  row.cols.forEach((c,k)=>{
    let w=Math.round(c.w*avail/sum*10)/10;
    if(k===row.cols.length-1) w=Math.round((avail-acc)*10)/10;
    c.w=Math.max(0.1,w); acc+=c.w;
  });
}
function rescaleAllRows(){ S.rows.forEach((_,i)=>rescaleRow(i)); }

controls.addEventListener("change", e=>{
  const t=e.target;
  if(t.dataset.a==="cellw"){ // snap the edited field to its clamped value on blur
    const i=+t.dataset.row, j=+t.dataset.col;
    if(S.rows[i]&&S.rows[i].cols[j]) t.value=fmt(S.rows[i].cols[j].w);
  }
});

controls.addEventListener("input", e=>{
  const t=e.target;
  if(t.dataset.g){
    if(t.type==="checkbox") S[t.dataset.g]=t.checked;
    else if(t.tagName==="SELECT") S[t.dataset.g]=t.value;
    else { const v=parseFloat(t.value);
      const zeroOK = t.dataset.g==="plinth"||t.dataset.g==="plinthRecess";
      if(!isNaN(v) && (v>0 || (zeroOK && v>=0))) S[t.dataset.g]=v; }
    if(t.dataset.g==="unitWidth"||t.dataset.g==="thickness"){
      rescaleAllRows();
      S.rows.forEach((_,i)=>syncRowWidthInputs(i,-1));
    }
    updateComputed(); S.rows.forEach((_,i)=>updateBadge(i)); scheduleRebuild(); return;
  }
  const i=+t.dataset.row, j=+t.dataset.col;
  switch(t.dataset.a){
    case "rowname": S.rows[i].name=t.value; scheduleRebuild(); break;
    case "rowh":{ const v=parseFloat(t.value); if(!isNaN(v)&&v>=5){S.rows[i].height=v; updateComputed(); scheduleRebuild();} break;}
    case "cellw":{ const v=parseFloat(t.value);
      if(!isNaN(v)&&v>0){ setColumnWidth(i,j,v); syncRowWidthInputs(i,j); updateBadge(i); scheduleRebuild(); } break;}
    case "celltype": S.rows[i].cols[j].c.type=t.value; renderSidebar(); scheduleRebuild(); break;
    case "decor": S.rows[i].cols[j].c.decor=t.value; scheduleRebuild(); break;
    case "hinge": S.rows[i].cols[j].c.hinge=t.value; scheduleRebuild(); break;
    case "tvsize": S.rows[i].cols[j].c.tv=+t.value; scheduleRebuild(); break;
    case "tvgap":{ const v=parseFloat(t.value); if(!isNaN(v)&&v>=0){S.rows[i].cols[j].c.tvGap=v; scheduleRebuild();} break;}
    case "setback":{ const v=parseFloat(t.value); if(!isNaN(v)&&v>=0){S.rows[i].cols[j].c.setback=v; scheduleRebuild();} break;}
    case "border":{ const v=parseFloat(t.value); if(!isNaN(v)&&v>=0){S.rows[i].cols[j].c.border=v; scheduleRebuild();} break;}
    case "shelves":{ const v=parseInt(t.value,10); if(!isNaN(v)&&v>=0&&v<=20){S.rows[i].cols[j].c.shelves=v; scheduleRebuild();} break;}
    case "faceplate": S.rows[i].cols[j].c.faceplate=t.checked; renderSidebar(); scheduleRebuild(); break;
  }
});
controls.addEventListener("click", e=>{
  const head=e.target.closest(".rhead");
  if(head && !e.target.closest("button") && !e.target.closest("input,select")){
    const ri=+head.parentElement.dataset.row;
    expandedRow = (expandedRow===ri) ? null : ri;
    renderSidebar(); return;
  }
  const b=e.target.closest("button"); if(!b||!b.dataset.a) return;
  const i=+b.dataset.row;
  switch(b.dataset.a){
    case "togdiv":{
      const row=S.rows[i]; ensureDividers(row);
      const bi=+b.dataset.b;
      row.dividers[bi]=!row.dividers[bi];
      rescaleRow(i); break;}
    case "addrow":{ const r={name:"", height:35, cols:[{w:0,c:newCell("open")},{w:0,c:newCell("open")}]};
      S.rows.push(r); equalizeRow(S.rows.length-1,true); expandedRow=S.rows.length-1; break;}
    case "delrow": S.rows.splice(i,1);
      if(expandedRow===i) expandedRow=null; else if(expandedRow>i) expandedRow--; break;
    case "rowup": [S.rows[i],S.rows[i+1]]=[S.rows[i+1],S.rows[i]];
      if(expandedRow===i) expandedRow=i+1; else if(expandedRow===i+1) expandedRow=i; break;
    case "rowdown": [S.rows[i],S.rows[i-1]]=[S.rows[i-1],S.rows[i]];
      if(expandedRow===i) expandedRow=i-1; else if(expandedRow===i-1) expandedRow=i; break;
    case "addcol": S.rows[i].cols.push({w:0,c:newCell("open")}); equalizeRow(i,true); break;
    case "delcol": S.rows[i].cols.pop(); equalizeRow(i,true); break;
    case "equalize": equalizeRow(i,true); break;
    case "reset": S=defaultState(); expandedRow=S.rows.length-1; break;
    case "clearsave":{
      if(!confirm("Delete the saved design from this browser and load the example? Export it as JSON first if you want to keep it.")) return;
      try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
      S=defaultState(); expandedRow=S.rows.length-1; break;}
    case "export": exportJSON(); return;
    case "import": document.getElementById("fileImport").click(); return;
    case "paste": showPasteImport(); return;
    default: return;
  }
  renderSidebar(); scheduleRebuild();
});

function showPasteImport(){
  const old=document.getElementById("exportModal"); if(old) old.remove();
  const wrap=document.createElement("div");
  wrap.id="exportModal";
  wrap.innerHTML=`
    <div class="emcard">
      <h3>Paste design</h3>
      <p>Paste previously exported JSON here to load that design. This replaces your current one.</p>
      <textarea id="emText" spellcheck="false" placeholder='{ "unitWidth": 320, ... }'></textarea>
      <div class="embtns">
        <button class="primary" id="emLoad">Load design</button>
        <button id="emClose">Cancel</button>
      </div>
      <div id="emErr" class="emerr"></div>
    </div>`;
  document.body.appendChild(wrap);
  const ta=wrap.querySelector("#emText"); ta.focus();
  wrap.querySelector("#emClose").addEventListener("click",()=>wrap.remove());
  wrap.addEventListener("click",e=>{ if(e.target===wrap) wrap.remove(); });
  wrap.querySelector("#emLoad").addEventListener("click",()=>{
    const err=wrap.querySelector("#emErr");
    try{
      const d=JSON.parse(ta.value);
      if(!d || !d.rows || !d.unitWidth){ err.textContent="That doesn't look like a Cinewall design."; return; }
      S=migrateDesign(d);
      expandedRow=S.rows.length?S.rows.length-1:null;
      wrap.remove(); renderSidebar(); scheduleRebuild();
    }catch(e){ err.textContent="Couldn't read that: "+e.message; }
  });
}

function exportJSON(){
  const json=JSON.stringify(S,null,2);
  let ok=false;
  try{
    const blob=new Blob([json],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download="cinewall-design.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    ok=true;
  }catch(e){ ok=false; }
  // sandboxed previews block blob downloads ("This content is blocked") — offer copy/paste instead
  showExportFallback(json, ok);
}

function showExportFallback(json, downloadTried){
  const old=document.getElementById("exportModal"); if(old) old.remove();
  const wrap=document.createElement("div");
  wrap.id="exportModal";
  wrap.innerHTML=`
    <div class="emcard">
      <h3>Export design</h3>
      <p>${downloadTried
        ? "A download should have started. If your browser blocked it (common in embedded previews), copy the design below and save it as <code>cinewall-design.json</code>."
        : "Download isn't available here. Copy the design below and save it as <code>cinewall-design.json</code>."}</p>
      <textarea id="emText" spellcheck="false" readonly></textarea>
      <div class="embtns">
        <button class="primary" id="emCopy">Copy to clipboard</button>
        <button id="emClose">Close</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const ta=wrap.querySelector("#emText");
  ta.value=json;
  wrap.querySelector("#emClose").addEventListener("click",()=>wrap.remove());
  wrap.addEventListener("click",e=>{ if(e.target===wrap) wrap.remove(); });
  wrap.querySelector("#emCopy").addEventListener("click",()=>{
    const btn=wrap.querySelector("#emCopy");
    const done=()=>{ btn.textContent="Copied ✓"; setTimeout(()=>btn.textContent="Copy to clipboard",1600); };
    ta.select(); ta.setSelectionRange(0,json.length);
    if(navigator.clipboard&&navigator.clipboard.writeText)
      navigator.clipboard.writeText(json).then(done).catch(()=>{ try{document.execCommand("copy");}catch(e){} done(); });
    else { try{document.execCommand("copy");}catch(e){} done(); }
  });
}
document.getElementById("fileImport").addEventListener("change", e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{
      const d=JSON.parse(r.result);
      if(d && d.rows && d.unitWidth){ S=migrateDesign(d); expandedRow=S.rows.length?S.rows.length-1:null; renderSidebar(); scheduleRebuild(); }
      else alert("This file is not a Cinewall design.");
    }catch(err){ alert("Could not read this file: "+err.message); } };
  r.readAsText(f); e.target.value="";
});
