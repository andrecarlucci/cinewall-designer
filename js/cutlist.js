"use strict";
/* =====================================================================
   CUT LIST
===================================================================== */
function buildCutList(){
  const t=S.thickness, W=S.unitWidth, D=S.depth, H=totalHeight(), y0=S.plinth;
  const parts=[];
  const add=(name,w,h,th,note)=>{
    const key=name+"|"+fmt(w)+"|"+fmt(h)+"|"+fmt(th);
    const ex=parts.find(p=>p.key===key);
    if(ex) ex.qty++;
    else parts.push({key,name,w,h,th,note:note||"",qty:1});
  };
  add("Bottom deck",W,D,t,"full width");
  S.rows.slice(0,-1).forEach(()=>add("Shelf (row divider)",W,D,t,"full-width horizontal"));
  add("Top deck",W,D,t,"full width");
  S.rows.forEach((row,ri)=>{
    ensureDividers(row);
    if(row.dividers[0]) add("End panel — "+rowName(ri),D,row.height,t,"outer side");
    if(row.dividers[row.cols.length]) add("End panel — "+rowName(ri),D,row.height,t,"outer side");
    for(let k=1;k<row.cols.length;k++)
      if(row.dividers[k]) add("Vertical divider — "+rowName(ri),D,row.height,t,"");
  });
  if(S.backPanel) add("Back panel",W,H-y0-2*t,0.6,"6 mm MDF/HDF, rebated · finish: "+finLabel(S.backFinish||"dark"));
  if(S.plinth>0.01){
    const pr=plinthRecess();
    add("Plinth front",W,S.plinth,t,(pr>0.01 ? "set back "+fmt(pr)+" cm from front" : "flush with fronts")+" · finish: "+finLabel(S.plinthFinish||"dark"));
  }
  S.rows.forEach((row,ri)=>{
    const widths=normWidths(row);
    row.cols.forEach((col,ci)=>{
      const c=col.c, cw=widths[ci];
      const hg=c.hinge||"left";
      const fp=isFaceplate(c);
      const hgNote = hg==="top" ? "hinge top (lift-up flap, gas stays)" :
                     hg==="bottom" ? "hinge bottom (drop-down flap, stays)" : "hinge "+hg;
      if(c.type==="door")
        add("Door front",cw-0.4,row.height-0.4,t,rowName(ri)+" · inset, 4 mm gap · "+hgNote);
      if(c.type==="door-push")
        add("Door front",cw-0.4,row.height-0.4,t,rowName(ri)+" · inset · push-to-open catch, no handle · "+hgNote);
      if(c.type==="tv-panel"){
        const tp=tvPanelCalc(c,cw,row.height);
        if(fp)
          add("Face plate",cw,row.height,t,
            rowName(ri)+" · full-bleed, continuous with face plate layer · cutout "+fmt(tp.ow)+" × "+fmt(tp.oh)+" cm centered (TV "+c.tv+"″ + "+fmt(tp.gap)+" cm reveal) · route cables behind");
        else
          add("TV panel front",cw-0.4,row.height-0.4,t,
            rowName(ri)+" · fixed, flush with fronts · cutout "+fmt(tp.ow)+" × "+fmt(tp.oh)+" cm centered (TV "+c.tv+"″ + "+fmt(tp.gap)+" cm reveal) · route cables behind");
      }
      if(fp){
        if(c.type==="open"){
          const f=fpFrame(c,cw,row.height);
          if(f>0.05)
            add("Face plate",cw,row.height,t,
              rowName(ri)+" · cutout "+fmt(cw-2*f)+" × "+fmt(row.height-2*f)+" cm centered ("+fmt(f)+" cm frame) · covers framing, wiring & fixings at the edges");
        }
        else if(c.type==="tv"){
          const tp=tvPanelCalc(c,cw,row.height);
          add("Face plate",cw,row.height,t,
            rowName(ri)+" · cutout "+fmt(tp.ow)+" × "+fmt(tp.oh)+" cm centered (TV "+c.tv+"″ + "+fmt(tp.gap)+" cm reveal) · hides wall mount & cables");
        } else if(c.type==="fireplace"){
          const iw=Math.round(Math.max(6,cw-2)*10)/10, ih=Math.round(Math.min(row.height-2,42)*10)/10;
          add("Face plate",cw,row.height,t,
            rowName(ri)+" · cutout "+fmt(iw)+" × "+fmt(ih)+" cm centered for fireplace insert · check insert clearance specs");
        }
      }
      const sb=cellSetback(c);
      if(sb>0.05 && SETBACK_TYPES[c.type])
        add("Niche false back",cw,row.height,t,
          rowName(ri)+" · set "+fmt(sb)+" cm forward from unit back (recess depth "+fmt(D-sb)+" cm)");
      const bd=cellBorder(c,cw,row.height);
      if(!fp && bd>0.05 && SETBACK_TYPES[c.type]){
        add("Front border strip",bd,row.height,t,rowName(ri)+" · vertical trim, flush with fronts");
        add("Front border strip",bd,row.height,t,rowName(ri)+" · vertical trim, flush with fronts");
        const iw=cw-2*bd;
        if(iw>0.05){
          add("Front border strip",iw,bd,t,rowName(ri)+" · horizontal trim, flush with fronts");
          add("Front border strip",iw,bd,t,rowName(ri)+" · horizontal trim, flush with fronts");
        }
      }
      const nsh=Math.max(0,Math.floor(c.shelves||0));
      if(nsh>0 && SHELF_TYPES[c.type]){
        const shD = c.type==="open"
          ? Math.round((D-sb-((bd>0.05||fp)?t+0.2:0.2))*10)/10
          : Math.round((D-t-0.3)*10)/10;
        for(let k=0;k<nsh;k++)
          add("Niche shelf",cw,shD,t,rowName(ri)+" · internal horizontal, evenly spaced ("+fmt(row.height/(nsh+1))+" cm compartments)");
      }
      if(c.type==="drawer")
        add("Drawer front",cw-0.4,row.height-0.4,t,rowName(ri)+" · inset · drawer box + runners by maker");
    });
  });
  return parts;
}

function renderCutList(){
  const parts=buildCutList();
  const t=S.thickness;
  let area=0;
  parts.forEach(p=>{ if(Math.abs(p.th-t)<0.01) area+=p.w*p.h*p.qty/10000; });
  const rows=parts.map(p=>`<tr>
      <td>${p.name}</td><td class="num">${p.qty}</td>
      <td class="num">${fmt(p.w)} × ${fmt(p.h)}</td>
      <td class="num">${fmt(p.th*10)} mm</td>
      <td style="color:var(--muted)">${p.note}</td></tr>`).join("");
  document.getElementById("cutContent").innerHTML=`
    <h3>Cut list — ${fmt(S.unitWidth)} × ${fmt(totalHeight())} × ${fmt(S.depth)} cm unit</h3>
    <table class="cut">
      <thead><tr><th>Part</th><th style="text-align:right">Qty</th>
        <th style="text-align:right">W × H (cm)</th><th style="text-align:right">Thick.</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="cutnote">
      Approx. ${fmt(area*10)/10} m² of ${fmt(t*10)} mm panel material (excluding back panel and waste — add 10–15% for cutting).
      Widths listed are grain-agnostic; agree grain direction, edge banding, and drawer hardware with your woodworker.
      All niche openings are interior clear sizes; fronts are drawn inset with 4 mm reveals.
    </div>
    <div class="btnrow">
      <button class="primary" id="btnCopyCut">Copy cut list</button>
    </div>
    <div class="cutnote" style="margin-top:18px;padding-top:12px;border-top:1px solid var(--line);font-size:11.5px">
      by <a href="https://www.linkedin.com/in/andrecarlucci" target="_blank" rel="noopener noreferrer"
        style="color:var(--oak);text-decoration:none;font-weight:600">André Carlucci</a><br>
      <span style="font-size:10px;opacity:.75">This software is provided "AS IS" without warranty of any kind. Verify all measurements before cutting.</span>
    </div>`;
  document.getElementById("btnCopyCut").addEventListener("click",()=>{
    const txt=["Part\tQty\tW (cm)\tH (cm)\tThickness (mm)\tNotes",
      ...parts.map(p=>[p.name,p.qty,fmt(p.w),fmt(p.h),fmt(p.th*10),p.note].join("\t"))].join("\n");
    const done=()=>{ const b=document.getElementById("btnCopyCut"); b.textContent="Copied ✓";
      setTimeout(()=>b.textContent="Copy cut list",1600); };
    if(navigator.clipboard&&navigator.clipboard.writeText)
      navigator.clipboard.writeText(txt).then(done).catch(()=>fallback());
    else fallback();
    function fallback(){ const ta=document.createElement("textarea"); ta.value=txt;
      document.body.appendChild(ta); ta.select();
      try{document.execCommand("copy");}catch(e){}
      ta.remove(); done(); }
  });
}
