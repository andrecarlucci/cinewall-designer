"use strict";
/* =====================================================================
   ELEVATION DRAWING (2D technical sheet)
===================================================================== */
const elev=document.getElementById("elevCanvas");
function drawElevation(){
  const W=S.unitWidth, H=totalHeight(), t=S.thickness;
  const pad={l:110,r:150,t:60,b:120};
  const paneEl=document.getElementById("paneElev");
  const maxW=Math.max(560, (paneEl.clientWidth||1140)-40);
  const maxH=Math.max(430, (paneEl.clientHeight||850)-96);
  const sc=Math.min((maxW-pad.l-pad.r)/W,(maxH-pad.t-pad.b)/H);
  const cw=Math.round(W*sc+pad.l+pad.r), ch=Math.round(H*sc+pad.t+pad.b);
  elev.width=cw*2; elev.height=ch*2;
  elev.style.width=cw+"px"; elev.style.height=ch+"px";
  const g=elev.getContext("2d"); g.setTransform(2,0,0,2,0,0);
  g.fillStyle="#f5f2ea"; g.fillRect(0,0,cw,ch);

  const X=x=>pad.l+(x+W/2)*sc, Y=y=>pad.t+(H-y)*sc; // world x runs -W/2..W/2, y up
  const ink="#2b2f38", blue="#3d6f8e", light="#b9b3a6";
  g.strokeStyle=ink; g.fillStyle=ink;
  g.font="11px 'SF Mono',Consolas,monospace"; g.textAlign="center"; g.textBaseline="middle";

  /* body outline: top & bottom (vertical edges are drawn per row, since sides are toggleable) */
  g.lineWidth=1.6;
  g.beginPath();
  g.moveTo(X(-W/2),Y(H)); g.lineTo(X(W/2),Y(H));
  g.moveTo(X(-W/2),Y(S.plinth)); g.lineTo(X(W/2),Y(S.plinth));
  g.stroke();
  if(S.plinth>0.01){
    g.lineWidth=1;
    g.strokeRect(X(-W/2),Y(S.plinth),W*sc,S.plinth*sc);
  }

  /* rows / cells */
  let y=S.plinth+t;
  S.rows.forEach((row)=>{
    ensureDividers(row);
    const widths=normWidths(row), rh=row.height, n=row.cols.length;
    /* niche floor & ceiling lines (decks are always full width) */
    g.strokeStyle=ink; g.lineWidth=0.9; g.setLineDash([]);
    g.beginPath();
    g.moveTo(X(-W/2),Y(y)); g.lineTo(X(W/2),Y(y));
    g.moveTo(X(-W/2),Y(y+rh)); g.lineTo(X(W/2),Y(y+rh));
    g.stroke();
    /* walk boundaries + cells */
    let x=-W/2;
    const bounds=[{x, on:row.dividers[0]}];
    if(row.dividers[0]) x+=t;
    const cells=[];
    row.cols.forEach((col,ci)=>{
      cells.push({x, w:widths[ci], c:col.c});
      x+=widths[ci];
      if(ci<n-1){ bounds.push({x, on:row.dividers[ci+1]}); if(row.dividers[ci+1]) x+=t; }
    });
    bounds.push({x, on:row.dividers[n]});
    bounds.forEach(b=>{
      if(b.on){
        g.fillStyle=ink;
        g.fillRect(X(b.x),Y(y+rh),Math.max(1.4,t*sc),rh*sc); // panel drawn at its real thickness
      } else {
        g.strokeStyle=light; g.lineWidth=0.8; g.setLineDash([4,3]);
        g.beginPath(); g.moveTo(X(b.x),Y(y)); g.lineTo(X(b.x),Y(y+rh)); g.stroke();
        g.setLineDash([]);
      }
    });
    /* cell symbols + labels */
    cells.forEach(({x:cx0,w:cwid,c})=>{
      const rx=X(cx0), ry=Y(y+rh), rw=cwid*sc, rhh=rh*sc;
      const fpv=isFaceplate(c);
      const bdv=cellBorder(c,cwid,rh);
      if(!fpv && bdv>0.05 && SETBACK_TYPES[c.type]){ // trim frame: inner opening line
        g.strokeStyle=ink; g.lineWidth=0.8; g.setLineDash([]);
        g.strokeRect(rx+bdv*sc, ry+bdv*sc, rw-2*bdv*sc, rhh-2*bdv*sc);
      }
      if(fpv){ // face-plate section: light diagonal hatch marks the solid layer
        g.strokeStyle=light; g.lineWidth=0.7; g.setLineDash([]);
        const step=14;
        g.save(); g.beginPath(); g.rect(rx,ry,rw,rhh); g.clip();
        for(let hx=rx-rhh; hx<rx+rw; hx+=step){
          g.beginPath(); g.moveTo(hx,ry+rhh); g.lineTo(hx+rhh,ry); g.stroke();
        }
        g.restore();
        if(c.type==="tv"||c.type==="tv-panel"){ // clear the opening and outline it
          const tp=tvPanelCalc(c,cwid,rh);
          const oxw=tp.ow*sc, oxh=tp.oh*sc, txw=tp.tw*sc, txh=tp.th*sc;
          g.fillStyle="#f5f2ea";
          g.fillRect(rx+(rw-oxw)/2, ry+(rhh-oxh)/2, oxw, oxh);
          g.strokeStyle=ink; g.strokeRect(rx+(rw-oxw)/2, ry+(rhh-oxh)/2, oxw, oxh);
          g.strokeStyle="#8a867c"; g.strokeRect(rx+(rw-txw)/2, ry+(rhh-txh)/2, txw, txh);
        } else if(c.type==="fireplace"){
          const iw=(Math.max(6,cwid-2))*sc, ih=Math.min(rh-2,42)*sc;
          g.fillStyle="#f5f2ea";
          g.fillRect(rx+(rw-iw)/2, ry+(rhh-ih)/2, iw, ih);
          g.strokeStyle=ink; g.strokeRect(rx+(rw-iw)/2, ry+(rhh-ih)/2, iw, ih);
        } else { // open niche: hatch only the frame band, opening stays clear
          const f=fpFrame(c,cwid,rh);
          if(f>0.05){
            const ow2=(cwid-2*f)*sc, oh2=(rh-2*f)*sc;
            g.fillStyle="#f5f2ea";
            g.fillRect(rx+(rw-ow2)/2, ry+(rhh-oh2)/2, ow2, oh2);
            g.strokeStyle=ink; g.strokeRect(rx+(rw-ow2)/2, ry+(rhh-oh2)/2, ow2, oh2);
          } else { // no frame width set: nothing to cover, clear the hatch entirely
            g.fillStyle="#f5f2ea";
            g.fillRect(rx+0.5, ry+0.5, rw-1, rhh-1);
          }
        }
      }
      const nshv=Math.max(0,Math.floor(c.shelves||0));
      if(nshv>0 && SHELF_TYPES[c.type]){
        g.strokeStyle=light; g.lineWidth=0.8;
        if(c.type!=="open") g.setLineDash([3,3]); // hidden behind the door front
        for(let k=1;k<=nshv;k++){
          const sy=ry+rhh-rhh*k/(nshv+1);
          g.beginPath(); g.moveTo(rx+1,sy); g.lineTo(rx+rw-1,sy); g.stroke();
        }
        g.setLineDash([]);
      }
      g.strokeStyle=light; g.lineWidth=0.8; g.setLineDash([]);
      if(c.type==="door"||c.type==="door-push"){
        const hg=c.hinge||"left";
        g.beginPath(); // door swing symbol: line ends on the hinge edge, vertex at the opening edge
        if(hg==="right"){ g.moveTo(rx+rw,ry); g.lineTo(rx,ry+rhh/2); g.lineTo(rx+rw,ry+rhh); }
        else if(hg==="left"){ g.moveTo(rx,ry); g.lineTo(rx+rw,ry+rhh/2); g.lineTo(rx,ry+rhh); }
        else if(hg==="top"){ g.moveTo(rx,ry); g.lineTo(rx+rw/2,ry+rhh); g.lineTo(rx+rw,ry); }
        else { g.moveTo(rx,ry+rhh); g.lineTo(rx+rw/2,ry); g.lineTo(rx+rw,ry+rhh); }
        g.stroke();
        if(c.type==="door-push"){ // push point marker on the opening edge
          let pxx=rx+rw/2, pyy=ry+rhh/2;
          if(hg==="left") pxx=rx+rw*0.85; else if(hg==="right") pxx=rx+rw*0.15;
          else if(hg==="top") pyy=ry+rhh*0.85; else pyy=ry+rhh*0.15;
          g.beginPath(); g.arc(pxx,pyy,2.4,0,Math.PI*2); g.stroke();
        }
      } else if(c.type==="drawer"){
        g.beginPath(); g.moveTo(rx+rw*0.3,ry+rhh*0.3); g.lineTo(rx+rw*0.7,ry+rhh*0.3); g.stroke();
      } else if(c.type==="tv"){
        if(!fpv) g.strokeRect(rx+rw*0.12,ry+rhh*0.16,rw*0.76,rhh*0.6);
      } else if(c.type==="tv-panel"){
        if(!fpv){
          const tp=tvPanelCalc(c,cwid,rh);
          const oxw=tp.ow*sc, oxh=tp.oh*sc, txw=tp.tw*sc, txh=tp.th*sc;
          g.strokeRect(rx+(rw-oxw)/2, ry+(rhh-oxh)/2, oxw, oxh);   // panel opening
          g.strokeStyle="#8a867c";
          g.strokeRect(rx+(rw-txw)/2, ry+(rhh-txh)/2, txw, txh);   // TV inside the reveal
          g.strokeStyle=light;
        }
      } else if(c.type==="fireplace"){
        g.beginPath();
        for(let k=0;k<3;k++){ const fx=rx+rw*(0.3+k*0.2);
          g.moveTo(fx,ry+rhh*0.75); g.quadraticCurveTo(fx+4,ry+rhh*0.5,fx,ry+rhh*0.35); }
        g.stroke();
      } else if(c.type==="open" && (c.decor==="soundbar"||String(c.decor||"").indexOf("speaker")===0)){
        if(c.decor==="soundbar"){
          const bw2=rw*0.8, bh2=Math.min(rhh*0.32,10);
          g.strokeRect(rx+(rw-bw2)/2, ry+rhh-bh2-3, bw2, bh2);
        } else {
          const n=+c.decor.slice(-1);
          const sph=Math.max(6,rhh-8);                          // fill the niche height, small top gap
          const spw=Math.max(3,Math.min((rw-6)/n-4, sph*0.55));
          const edge2=Math.max(0,rw/2-spw/2-4);
          const xs=n===1?[0]:(n===2?[-edge2,edge2]:[-edge2,0,edge2]);
          xs.forEach((px,k)=>{
            const cch=(n===3&&k===1);
            const w2=cch?spw*1.7:spw, h2=cch?sph*0.45:sph;
            g.strokeRect(rx+rw/2+px-w2/2, ry+rhh-h2-3, w2, h2);
          });
        }
      }
      g.fillStyle=blue;
      g.fillText(fmt(cwid)+" × "+fmt(rh), rx+rw/2, ry+rhh/2-7);
      g.fillStyle="#6d6a61";
      const hgArr=HINGE_ARROW[c.hinge||"left"]||"◀";
      const decorTag={books:"BOOKS",objects:"OBJECTS",mixed:"DECOR",soundbar:"SOUNDBAR",speaker1:"1 SPEAKER",speaker2:"2 SPEAKERS L/R",speaker3:"3 SPEAKERS L/C/R"};
      const names={"open":c.decor!=="none"?("OPEN · "+(decorTag[c.decor]||"DECOR")):"OPEN","door":"DOOR "+hgArr,"door-push":"DOOR · PUSH "+hgArr,"drawer":"DRAWER","tv":"TV "+c.tv+"″","tv-panel":"TV "+c.tv+"″ · PANEL · GAP "+fmt(Math.max(0,c.tvGap!=null?+c.tvGap:5)),"fireplace":"FIREPLACE"};
      let nm=names[c.type];
      const sbv=cellSetback(c);
      if(sbv>0.05 && SETBACK_TYPES[c.type]) nm+=" · SB "+fmt(sbv);
      if(!fpv && bdv>0.05 && SETBACK_TYPES[c.type]) nm+=" · BD "+fmt(bdv);
      if(fpv) nm+=" · FACE PLATE";
      g.fillText(nm, rx+rw/2, ry+rhh/2+8);
    });
    y+=rh+t;
  });

  /* dimension helpers */
  function dimH(x1,x2,yy,label){ // horizontal dim line at canvas y
    g.strokeStyle=blue; g.fillStyle=blue; g.lineWidth=0.9;
    g.beginPath(); g.moveTo(x1,yy); g.lineTo(x2,yy); g.stroke();
    [[x1,1],[x2,-1]].forEach(([xx,s])=>{ g.beginPath();
      g.moveTo(xx,yy); g.lineTo(xx+6*s,yy-3); g.moveTo(xx,yy); g.lineTo(xx+6*s,yy+3); g.stroke(); });
    g.beginPath(); g.moveTo(x1,yy-5); g.lineTo(x1,yy+5); g.moveTo(x2,yy-5); g.lineTo(x2,yy+5); g.stroke();
    g.fillText(label,(x1+x2)/2,yy-9);
  }
  function dimV(y1,y2,xx,label){
    g.strokeStyle=blue; g.fillStyle=blue; g.lineWidth=0.9;
    g.beginPath(); g.moveTo(xx,y1); g.lineTo(xx,y2); g.stroke();
    [[y1,1],[y2,-1]].forEach(([yy,s])=>{ g.beginPath();
      g.moveTo(xx,yy); g.lineTo(xx-3,yy+6*s); g.moveTo(xx,yy); g.lineTo(xx+3,yy+6*s); g.stroke(); });
    g.beginPath(); g.moveTo(xx-5,y1); g.lineTo(xx+5,y1); g.moveTo(xx-5,y2); g.lineTo(xx+5,y2); g.stroke();
    g.save(); g.translate(xx-10,(y1+y2)/2); g.rotate(-Math.PI/2); g.fillText(label,0,0); g.restore();
  }
  /* overall */
  dimH(X(-W/2),X(W/2),Y(0)+28, fmt(W)+" cm");
  dimV(Y(H),Y(0),X(-W/2)-30, fmt(H)+" cm");
  /* row heights on left */
  let yy=S.plinth+t;
  S.rows.forEach(r=>{ dimV(Y(yy+r.height),Y(yy),X(-W/2)-8, fmt(r.height)); yy+=r.height+t; });
  /* row names on right */
  g.textAlign="left"; g.font="600 11px 'Avenir Next','Segoe UI',sans-serif";
  yy=S.plinth+t;
  S.rows.forEach((r,ri)=>{
    g.fillStyle="#4c4a44";
    g.fillText(rowName(ri).toUpperCase(), X(W/2)+12, Y(yy+r.height/2));
    yy+=r.height+t;
  });
  g.font="11px 'SF Mono',Consolas,monospace"; g.textAlign="center";

  /* title block */
  const tbW=230,tbH=116,tbX=cw-tbW-20,tbY=ch-tbH-14;
  g.strokeStyle=ink; g.lineWidth=1; g.strokeRect(tbX,tbY,tbW,tbH);
  g.textAlign="left"; g.fillStyle=ink;
  g.font="600 12px 'Avenir Next','Segoe UI',sans-serif";
  g.fillText("CINEWALL — FRONT ELEVATION",tbX+10,tbY+16);
  g.font="10.5px 'SF Mono',Consolas,monospace"; g.fillStyle="#4c4a44";
  g.fillText("Overall  "+fmt(W)+" × "+fmt(H)+" × "+fmt(S.depth)+" cm",tbX+10,tbY+33);
  g.fillText("Panels   "+fmt(t*10)+" mm",tbX+10,tbY+47);
  g.fillText("Plinth   "+fmt(S.plinth)+" cm · recess "+fmt(plinthRecess())+" cm",tbX+10,tbY+61);
  g.fillText("Date     "+new Date().toISOString().slice(0,10),tbX+10,tbY+75);
  g.strokeStyle="#c9c5bb"; g.lineWidth=0.7;
  g.beginPath(); g.moveTo(tbX+8,tbY+83); g.lineTo(tbX+tbW-8,tbY+83); g.stroke();
  g.font="10px 'Avenir Next','Segoe UI',sans-serif"; g.fillStyle="#4c4a44";
  g.fillText("by André Carlucci",tbX+10,tbY+95);
  g.font="8px 'Avenir Next','Segoe UI',sans-serif"; g.fillStyle="#8a867c";
  g.fillText('Provided "AS IS" without warranty of any kind.',tbX+10,tbY+107);
  g.textAlign="center";
}
document.getElementById("btnElevPng").addEventListener("click",()=>{
  const btn=document.getElementById("btnElevPng");
  const fail=()=>{ btn.textContent="Blocked — open file directly"; setTimeout(()=>btn.textContent="Download PNG",2600); };
  try{
    elev.toBlob(b=>{
      if(!b){ fail(); return; }
      try{
        const url=URL.createObjectURL(b);
        const a=document.createElement("a");
        a.href=url; a.download="cinewall-elevation.png";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),2000);
      }catch(e){ fail(); }
    });
  }catch(e){ fail(); }
});
