"use strict";
/* =====================================================================
   3D SCENE
===================================================================== */
const canvas=document.getElementById("canvas3d");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(42,1,1,5000);
const unitGroup=new THREE.Group();  scene.add(unitGroup);
const roomGroup=new THREE.Group();  scene.add(roomGroup);
const dimGroup=new THREE.Group();   scene.add(dimGroup);
const selGroup=new THREE.Group();   scene.add(selGroup); // click-highlight overlay

/* lights */
const hemi=new THREE.HemisphereLight(0xfff5e8,0x2a2620,0.75); scene.add(hemi);
const key=new THREE.DirectionalLight(0xfff1dd,1.0);
key.position.set(180,320,260); key.castShadow=true;
key.shadow.mapSize.set(2048,2048);
scene.add(key);
const fill=new THREE.DirectionalLight(0xbcd2e8,0.28); fill.position.set(-220,140,120); scene.add(fill);

/* ---------- materials ---------- */
function woodCanvas(base,streak){
  const cv=document.createElement("canvas"); cv.width=cv.height=256;
  const g=cv.getContext("2d");
  g.fillStyle=base; g.fillRect(0,0,256,256);
  for(let i=0;i<70;i++){
    g.strokeStyle=streak; g.globalAlpha=0.06+Math.random()*0.10;
    g.lineWidth=1+Math.random()*2.5;
    const y=Math.random()*256; g.beginPath();
    g.moveTo(0,y);
    g.bezierCurveTo(85,y+(Math.random()*10-5),170,y+(Math.random()*10-5),256,y+(Math.random()*8-4));
    g.stroke();
  }
  g.globalAlpha=1;
  const tx=new THREE.CanvasTexture(cv);
  tx.wrapS=tx.wrapT=THREE.RepeatWrapping;
  return tx;
}
function slatCanvas(){ // vertical acoustic wood slats on a dark backing
  const cv=document.createElement("canvas"); cv.width=cv.height=256;
  const g=cv.getContext("2d");
  g.fillStyle="#181310"; g.fillRect(0,0,256,256);
  const slat=12, gapp=4, tones=["#5d4230","#654936","#57402e","#6b4d38"];
  for(let x=0;x<256;x+=slat+gapp){
    g.fillStyle=tones[Math.floor(Math.random()*tones.length)];
    g.fillRect(x,0,slat,256);
    g.strokeStyle="#2b1e14";
    for(let i=0;i<3;i++){
      g.globalAlpha=0.25; g.lineWidth=0.8;
      const gx=x+2+Math.random()*(slat-4);
      g.beginPath(); g.moveTo(gx,0); g.lineTo(gx+(Math.random()*2-1)*3,256); g.stroke();
    }
    g.globalAlpha=1;
  }
  const tx=new THREE.CanvasTexture(cv);
  tx.wrapS=tx.wrapT=THREE.RepeatWrapping;
  return tx;
}
function concreteCanvas(){ // mottled microcement
  const cv=document.createElement("canvas"); cv.width=cv.height=256;
  const g=cv.getContext("2d");
  g.fillStyle="#9b9b98"; g.fillRect(0,0,256,256);
  for(let i=0;i<380;i++){
    const v=140+Math.floor(Math.random()*40);
    g.fillStyle=`rgb(${v},${v},${v-2})`;
    g.globalAlpha=0.05+Math.random()*0.07;
    g.beginPath(); g.arc(Math.random()*256,Math.random()*256,4+Math.random()*18,0,Math.PI*2); g.fill();
  }
  g.globalAlpha=1;
  for(let i=0;i<60;i++){ // fine speckles
    g.fillStyle="rgba(90,90,88,0.25)";
    g.fillRect(Math.random()*256,Math.random()*256,1.2,1.2);
  }
  const tx=new THREE.CanvasTexture(cv);
  tx.wrapS=tx.wrapT=THREE.RepeatWrapping;
  return tx;
}
function marbleCanvas(){ // white marble with soft grey veining
  const cv=document.createElement("canvas"); cv.width=cv.height=256;
  const g=cv.getContext("2d");
  g.fillStyle="#eae8e3"; g.fillRect(0,0,256,256);
  for(let i=0;i<9;i++){
    g.strokeStyle=i%3===0?"#a9a59b":"#c8c5bd";
    g.lineWidth=0.7+Math.random()*1.6;
    g.globalAlpha=0.35+Math.random()*0.3;
    const y=Math.random()*256, drift=()=>Math.random()*70-35;
    g.beginPath(); g.moveTo(-10,y);
    g.bezierCurveTo(70,y+drift(),150,y+drift(),266,y+drift());
    g.stroke();
  }
  g.globalAlpha=1;
  const tx=new THREE.CanvasTexture(cv);
  tx.wrapS=tx.wrapT=THREE.RepeatWrapping;
  return tx;
}
const FIN={
  oak:   ()=>new THREE.MeshStandardMaterial({map:woodCanvas("#a97b50","#7a5433"),roughness:.62,metalness:.03}),
  walnut:()=>new THREE.MeshStandardMaterial({map:woodCanvas("#5d4230","#3a281c"),roughness:.58,metalness:.03}),
  black: ()=>new THREE.MeshStandardMaterial({color:0x24262a,roughness:.5,metalness:.08}),
  white: ()=>new THREE.MeshStandardMaterial({color:0xe9e6df,roughness:.55,metalness:.02}),
  smoked:()=>new THREE.MeshStandardMaterial({map:woodCanvas("#6b4a2f","#452e1c"),roughness:.6,metalness:.03}),
  ash:   ()=>new THREE.MeshStandardMaterial({map:woodCanvas("#d6bd97","#b39a72"),roughness:.62,metalness:.02}),
  slats: ()=>new THREE.MeshStandardMaterial({map:slatCanvas(),roughness:.72,metalness:.02}),
  concrete:()=>new THREE.MeshStandardMaterial({map:concreteCanvas(),roughness:.88,metalness:0}),
  marble:()=>new THREE.MeshStandardMaterial({map:marbleCanvas(),roughness:.28,metalness:.02}),
  travertine:()=>new THREE.MeshStandardMaterial({map:woodCanvas("#d8c9ae","#b8a685"),roughness:.8,metalness:0}),
  anthracite:()=>new THREE.MeshStandardMaterial({color:0x3a3d42,roughness:.55,metalness:.06}),
  greige:()=>new THREE.MeshStandardMaterial({color:0xb8b0a4,roughness:.65,metalness:.02}),
  sage:  ()=>new THREE.MeshStandardMaterial({color:0x76866f,roughness:.6,metalness:.02}),
  navy:  ()=>new THREE.MeshStandardMaterial({color:0x2e3a52,roughness:.55,metalness:.04})
};
const techMat=new THREE.MeshStandardMaterial({color:0xd8d5cc,roughness:.9,metalness:0});
function finMatFor(key){ // secondary-surface material: back panel / plinth
  if(isTech()) return techMat.clone();
  if(key==="match") return FIN[S.finish]();
  if(FIN[key]) return FIN[key]();
  return new THREE.MeshStandardMaterial({color:0x26241f,roughness:.9}); // "dark" shadow default
}
const edgeMat=new THREE.LineBasicMaterial({color:0x2a3c48});
const handleMat=new THREE.MeshStandardMaterial({color:0x8a8a8a,roughness:.35,metalness:.8});
let flames=[]; // emissive flame materials for flicker

function panel(w,h,d,mat,castRecv){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  if(castRecv!==false){ m.castShadow=true; m.receiveShadow=true; }
  if(isTech()){
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),edgeMat);
    m.add(e);
  }
  return m;
}
function isTech(){ return document.getElementById("chkTech").checked; }
function showDims(){ return document.getElementById("chkDims").checked; }

/* seeded random for stable decor */
function rng(seed){ let a=seed>>>0; return function(){ a|=0;a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296; }; }

/* ---------- text sprite for dimensions ---------- */
function textSprite(text,color){
  const cv=document.createElement("canvas");
  const g=cv.getContext("2d");
  g.font="600 44px 'SF Mono',Consolas,monospace";
  const w=Math.ceil(g.measureText(text).width)+34;
  cv.width=w; cv.height=72;
  const g2=cv.getContext("2d");
  g2.fillStyle="rgba(21,22,26,0.82)";
  g2.beginPath(); g2.roundRect ? g2.roundRect(0,0,w,72,12) : g2.rect(0,0,w,72); g2.fill();
  g2.font="600 44px 'SF Mono',Consolas,monospace";
  g2.fillStyle=color||"#6fa8c9"; g2.textBaseline="middle";
  g2.fillText(text,17,38);
  const tx=new THREE.CanvasTexture(cv);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:false}));
  const sc=0.14; sp.scale.set(w*sc,72*sc,1);
  return sp;
}

/* ---------- build unit ---------- */
function clearGroup(gp){
  while(gp.children.length){
    const o=gp.children.pop();
    o.traverse(c=>{ if(c.geometry)c.geometry.dispose();
      if(c.material){ (Array.isArray(c.material)?c.material:[c.material]).forEach(m=>{ if(m.map)m.map.dispose(); m.dispose(); }); } });
  }
}

function rebuild(){
  if(!FIN[S.finish]) S.finish="oak"; // guard for designs saved with an unknown finish
  clearGroup(unitGroup); clearGroup(roomGroup); clearGroup(dimGroup); clearGroup(selGroup);
  flames=[]; animFronts=[];
  const t=S.thickness, W=S.unitWidth, D=S.depth, H=totalHeight();
  const mat = isTech()? techMat.clone() : FIN[S.finish]();

  /* room (styled only) */
  if(!isTech()){
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(W*4,600),
      new THREE.MeshStandardMaterial({color:0x35302b,roughness:.92}));
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; roomGroup.add(floor);
    const wall=new THREE.Mesh(new THREE.PlaneGeometry(W*4,H*3),
      new THREE.MeshStandardMaterial({color:0x4a4640,roughness:.95}));
    wall.position.set(0,H*1.2,-D/2-0.6); wall.receiveShadow=true; roomGroup.add(wall);
  }

  /* plinth */
  if(S.plinth>0.01){
    const pr=plinthRecess();
    const p=panel(W, S.plinth, Math.max(1,D-pr), finMatFor(S.plinthFinish||"dark"));
    p.position.set(0, S.plinth/2, -pr/2); unitGroup.add(p);
  }
  const y0=S.plinth;

  /* horizontal decks: full width — bottom, between rows, top */
  let y=y0;
  const deck=(yc)=>{ const d=panel(W,t,D,mat); d.position.set(0,yc,0); unitGroup.add(d); };
  deck(y+t/2); y+=t;
  const rowBase=[];
  S.rows.forEach(r=>{ rowBase.push(y); y+=r.height; deck(y+t/2); y+=t; });
  pickInfo={rowBase:rowBase.slice()};

  /* back panel */
  if(S.backPanel){
    const b=panel(W, H-y0-2*t, 0.6, finMatFor(S.backFinish||"dark"));
    b.position.set(0, y0+t+(H-y0-2*t)/2, -D/2+0.3); unitGroup.add(b);
  }

  /* rows: side segments, dividers + cell contents (all vertical panels toggleable) */
  S.rows.forEach((row,ri)=>{
    ensureDividers(row);
    const widths=normWidths(row), yb=rowBase[ri], rh=row.height;
    let x=-W/2;
    if(row.dividers[0]){ // left outer side segment
      const s=panel(t,rh,D,mat); s.position.set(x+t/2, yb+rh/2, 0); unitGroup.add(s); x+=t;
    }
    row.cols.forEach((col,ci)=>{
      const cw=widths[ci];
      buildCell(col.c, x, yb, cw, rh, D, t, ri, ci);
      x+=cw;
      if(ci<row.cols.length-1 && row.dividers[ci+1]){
        const dv=panel(t,rh,D,mat); dv.position.set(x+t/2, yb+rh/2, 0); unitGroup.add(dv);
        x+=t;
      }
    });
    if(row.dividers[row.cols.length]){ // right outer side segment
      const s=panel(t,rh,D,mat); s.position.set(x+t/2, yb+rh/2, 0); unitGroup.add(s);
    }
  });

  /* overall dimension labels */
  if(showDims()){
    const lw=textSprite(fmt(W)+" cm"); lw.position.set(0,-6,D/2+4); dimGroup.add(lw);
    const lh=textSprite(fmt(H)+" cm"); lh.position.set(W/2+16,H/2,D/2); dimGroup.add(lh);
    const ld=textSprite(fmt(D)+" cm deep","#9a978f"); ld.position.set(-W/2-16,6,0); dimGroup.add(ld);
    if(isTech()){ // niche labels
      S.rows.forEach((row,ri)=>{
        const widths=normWidths(row);
        let x=-W/2+(row.dividers[0]?t:0);
        row.cols.forEach((col,ci)=>{
          const s=textSprite(fmt(widths[ci])+"×"+fmt(row.height),"#e8e4dc");
          s.position.set(x+widths[ci]/2, rowBase[ri]+row.height/2, D/2+2);
          s.scale.multiplyScalar(0.7);
          dimGroup.add(s);
          x+=widths[ci]+((ci<row.cols.length-1 && row.dividers[ci+1])?t:0);
        });
      });
    }
  }
  fitCameraIfFirst();
  drawElevation();
  renderCutList();
}

/* full-bleed face-plate strips around an opening (no reveals — reads as one continuous layer) */
function fpStrips(cx,cy,cw,rh,ow,oh,D,t){
  const zF=D/2-t/2, m=()=>isTech()?techMat.clone():FIN[S.finish]();
  const sw=(cw-ow)/2, th2=(rh-oh)/2;
  if(sw>0.05){
    let p=panel(sw,rh,t,m()); p.position.set(cx-ow/2-sw/2,cy,zF); unitGroup.add(p);
    p=panel(sw,rh,t,m());     p.position.set(cx+ow/2+sw/2,cy,zF); unitGroup.add(p);
  }
  if(th2>0.05){
    let p=panel(ow,th2,t,m()); p.position.set(cx,cy+oh/2+th2/2,zF); unitGroup.add(p);
    p=panel(ow,th2,t,m());     p.position.set(cx,cy-oh/2-th2/2,zF); unitGroup.add(p);
  }
}

function buildCell(c, x, yb, cw, rh, D, t, ri, ci){
  const cx=x+cw/2, cy=yb+rh/2;
  const gap=0.4;
  const frontMat=isTech()?techMat.clone():FIN[S.finish]();
  const sb=cellSetback(c);
  const fp=isFaceplate(c);
  if(sb>0.05 && SETBACK_TYPES[c.type]){
    // false back in the finish material — brings the niche recess forward by the setback
    const fb=panel(cw,rh,t, isTech()?techMat.clone():FIN[S.finish]());
    fb.position.set(cx,cy,-D/2+sb-t/2); unitGroup.add(fb);
  }
  const bd=cellBorder(c,cw,rh);
  if(!fp && bd>0.05 && SETBACK_TYPES[c.type]){
    // fixed trim frame around the opening, flush with the other fronts
    const bMat=()=>isTech()?techMat.clone():FIN[S.finish]();
    const zF=D/2-t/2;
    let p=panel(bd,rh,t,bMat()); p.position.set(cx-cw/2+bd/2,cy,zF); unitGroup.add(p);
    p=panel(bd,rh,t,bMat());     p.position.set(cx+cw/2-bd/2,cy,zF); unitGroup.add(p);
    const iw=cw-2*bd;
    if(iw>0.05){
      p=panel(iw,bd,t,bMat()); p.position.set(cx,yb+rh-bd/2,zF); unitGroup.add(p);
      p=panel(iw,bd,t,bMat()); p.position.set(cx,yb+bd/2,zF); unitGroup.add(p);
    }
  }
  /* internal horizontal shelves */
  const nsh=Math.max(0,Math.floor(c.shelves||0));
  if(nsh>0 && SHELF_TYPES[c.type]){
    const backZ=-D/2+(SETBACK_TYPES[c.type]?sb:0);
    const frontZ=(c.type==="open") ? ((bd>0.05||fp)? D/2-t-0.2 : D/2-0.2) : D/2-t-0.3;
    const sd=Math.max(2,frontZ-backZ), szc=(frontZ+backZ)/2;
    for(let k=1;k<=nsh;k++){
      const sh=panel(cw,t,sd, isTech()?techMat.clone():FIN[S.finish]());
      sh.position.set(cx, yb+rh*k/(nsh+1), szc);
      unitGroup.add(sh);
    }
  }
  if(c.type==="door"||c.type==="door-push"){
    const hg=c.hinge||"left";
    const cwd=cw-gap, rhd=rh-gap;
    const pivot=new THREE.Group();
    let ox=0, oy=0; // door center offset from the hinge pivot
    if(hg==="left"){ pivot.position.set(cx-cw/2,cy,D/2-t/2); ox=cwd/2; }
    else if(hg==="right"){ pivot.position.set(cx+cw/2,cy,D/2-t/2); ox=-cwd/2; }
    else if(hg==="top"){ pivot.position.set(cx,yb+rh,D/2-t/2); oy=-rhd/2; }
    else { pivot.position.set(cx,yb,D/2-t/2); oy=rhd/2; }
    const d=panel(cwd,rhd,t,frontMat); d.position.set(ox,oy,0); pivot.add(d);
    if(c.type==="door"){ // handle opposite the hinge, swings with the door
      let hnd;
      if(hg==="left"||hg==="right"){
        hnd=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,Math.min(11,rh*0.4),12),handleMat);
        hnd.position.set(hg==="left"?cwd-3.2:-cwd+3.2, 0, t/2+0.6);
      } else {
        hnd=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,Math.min(11,cw*0.4),12),handleMat);
        hnd.rotation.z=Math.PI/2;
        hnd.position.set(0, hg==="top"?-rhd+3.2:rhd-3.2, t/2+0.6);
      }
      pivot.add(hnd);
    }
    unitGroup.add(pivot);
    registerFront("door",pivot,hg,ri,ci);
  }
  else if(c.type==="drawer"){
    const grp=new THREE.Group();
    grp.position.set(cx,cy,0);
    const d=panel(cw-gap,rh-gap,t,frontMat); d.position.set(0,0,D/2-t/2); grp.add(d);
    const hnd=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,Math.min(cw*0.45,26),12),handleMat);
    hnd.rotation.z=Math.PI/2;
    hnd.position.set(0,rh*0.22,D/2+0.6); grp.add(hnd);
    // simple drawer box, visible when the drawer slides open
    const boxMat=isTech()?techMat.clone():new THREE.MeshStandardMaterial({color:0xcbb38a,roughness:.85});
    const bw=cw-gap-1.6, bdp=Math.max(6,D-4), bh=Math.max(4,Math.min(rh-gap-2,rh*0.55));
    const byb=-rh/2+gap/2+1;  // box floor offset from drawer centre
    let p=panel(bw,1,bdp,boxMat); p.position.set(0,byb+0.5,D/2-t-bdp/2); grp.add(p);
    p=panel(1,bh,bdp,boxMat); p.position.set(-bw/2+0.5,byb+bh/2,D/2-t-bdp/2); grp.add(p);
    p=panel(1,bh,bdp,boxMat); p.position.set( bw/2-0.5,byb+bh/2,D/2-t-bdp/2); grp.add(p);
    p=panel(bw,bh,1,boxMat); p.position.set(0,byb+bh/2,D/2-t-bdp+0.5); grp.add(p);
    unitGroup.add(grp);
    registerFront("drawer",grp,null,ri,ci);
  }
  else if(c.type==="tv-panel"){
    const {gap,tw,th,ow,oh}=tvPanelCalc(c,cw,rh);
    // inset like door fronts normally; full-bleed (no reveals) when part of the face plate layer
    const pw=fp?cw:cw-0.4, ph=fp?rh:rh-0.4;
    const sideW=(pw-ow)/2, topH=(ph-oh)/2;
    const zP=D/2-t/2;                                      // flush with the rest of the fronts
    const pMat=()=>isTech()?techMat.clone():FIN[S.finish]();
    if(sideW>0.05){
      let p=panel(sideW,ph,t,pMat()); p.position.set(cx-ow/2-sideW/2,cy,zP); unitGroup.add(p);
      p=panel(sideW,ph,t,pMat());     p.position.set(cx+ow/2+sideW/2,cy,zP); unitGroup.add(p);
    }
    if(topH>0.05){
      let p=panel(ow,topH,t,pMat()); p.position.set(cx,cy+oh/2+topH/2,zP); unitGroup.add(p);
      p=panel(ow,topH,t,pMat());     p.position.set(cx,cy-oh/2-topH/2,zP); unitGroup.add(p);
    }
    if(!isTech()){
      const tvd=3;
      const tv=new THREE.Mesh(new THREE.BoxGeometry(tw,th,tvd),
        new THREE.MeshStandardMaterial({color:0x0a0a0c,roughness:.4,metalness:.3}));
      tv.castShadow=true;
      tv.position.set(cx,cy,D/2-tvd/2);                    // screen sits on the front plane
      unitGroup.add(tv);
      const scr=new THREE.Mesh(new THREE.PlaneGeometry(tw-2,th-2),
        new THREE.MeshStandardMaterial({color:0x111726,emissive:0x1c2a45,emissiveIntensity:.55,roughness:.25}));
      scr.position.set(0,0,tvd/2+0.05); tv.add(scr);
    } else {
      const s=textSprite("TV "+c.tv+"″ · gap "+fmt(gap),"#6fa8c9");
      s.position.set(cx, cy, D/2+2); dimGroup.add(s);
    }
  }
  else if(c.type==="tv"){
    if(fp){
      const tp=tvPanelCalc(c,cw,rh);
      fpStrips(cx,cy,cw,rh,tp.ow,tp.oh,D,t);
      if(!isTech()){
        const tv=new THREE.Mesh(new THREE.BoxGeometry(tp.tw,tp.th,3),
          new THREE.MeshStandardMaterial({color:0x0a0a0c,roughness:.4,metalness:.3}));
        tv.castShadow=true;
        tv.position.set(cx, cy, -D/2+sb+2); // wall-mounted behind the face plate opening
        unitGroup.add(tv);
        const scr=new THREE.Mesh(new THREE.PlaneGeometry(tp.tw-2.4,tp.th-2.4),
          new THREE.MeshStandardMaterial({color:0x111726,emissive:0x1c2a45,emissiveIntensity:.55,roughness:.25}));
        scr.position.set(0,0,1.6); tv.add(scr);
      } else {
        const s=textSprite("TV "+c.tv+"″ · FACE PLATE","#6fa8c9");
        s.position.set(cx, cy, D/2+2); dimGroup.add(s);
      }
    }
    else if(!isTech()){
      const diag=c.tv*2.54, tw=Math.min(diag*0.872,cw-2*bd-6), th=Math.min(diag*0.49,rh-2*bd-6);
      const tv=new THREE.Mesh(new THREE.BoxGeometry(tw,th,3),
        new THREE.MeshStandardMaterial({color:0x0a0a0c,roughness:.4,metalness:.3}));
      tv.castShadow=true;
      tv.position.set(cx, yb+Math.min(rh/2, th/2+8), -D/2+sb+3.5);
      unitGroup.add(tv);
      const scr=new THREE.Mesh(new THREE.PlaneGeometry(tw-2.4,th-2.4),
        new THREE.MeshStandardMaterial({color:0x111726,emissive:0x1c2a45,emissiveIntensity:.55,roughness:.25}));
      scr.position.set(0,0,1.6); tv.add(scr);
    } else {
      const s=textSprite("TV "+c.tv+"″","#6fa8c9");
      s.position.set(cx, yb+rh-8, D/2+2); dimGroup.add(s);
    }
  }
  else if(c.type==="fireplace"){
    const insetW=Math.max(6,cw-2*bd-2), insetH=Math.min(rh-2*bd-2,42);
    const fbD=Math.max(6, D-sb-2); // firebox fills the recess depth (1 cm clearance front & back)
    const wall=1.2, bez=2.2;
    const yc=yb+insetH/2+(rh-insetH)/2;
    const caseMat=isTech()?techMat.clone():new THREE.MeshStandardMaterial({color:0x0d0d0f,roughness:.55,metalness:.3});
    const grp=new THREE.Group();
    // open casing: back + top + bottom + sides (front stays open to see inside)
    let p=panel(insetW,insetH,wall,caseMat); p.position.set(0,0,-fbD/2+wall/2); grp.add(p);
    p=panel(insetW,wall,fbD,caseMat); p.position.set(0, insetH/2-wall/2,0); grp.add(p);
    p=panel(insetW,wall,fbD,caseMat); p.position.set(0,-insetH/2+wall/2,0); grp.add(p);
    p=panel(wall,insetH,fbD,caseMat); p.position.set(-insetW/2+wall/2,0,0); grp.add(p);
    p=panel(wall,insetH,fbD,caseMat); p.position.set( insetW/2-wall/2,0,0); grp.add(p);
    // front frame: timber face plate strips when face-plated, otherwise the black bezel
    if(fp){ fpStrips(cx,yc,cw,rh,insetW,insetH,D,t); }
    else {
      p=panel(insetW,bez,1,caseMat); p.position.set(0, insetH/2-bez/2,fbD/2-0.5); grp.add(p);
      p=panel(insetW,bez,1,caseMat); p.position.set(0,-insetH/2+bez/2,fbD/2-0.5); grp.add(p);
      p=panel(bez,insetH,1,caseMat); p.position.set(-insetW/2+bez/2,0,fbD/2-0.5); grp.add(p);
      p=panel(bez,insetH,1,caseMat); p.position.set( insetW/2-bez/2,0,fbD/2-0.5); grp.add(p);
    }
    if(!isTech()){
      // glowing ember bed on the firebox floor, reaching toward the back
      const ember=new THREE.MeshStandardMaterial({color:0x2a0f04,emissive:0xff5a12,emissiveIntensity:.9,roughness:.8});
      const bed=new THREE.Mesh(new THREE.BoxGeometry(insetW-2*wall-1,1.6,fbD*0.55),ember);
      bed.position.set(0,-insetH/2+wall+0.8,-fbD*0.12); grp.add(bed); flames.push(ember);
      // ceramic logs stacked on the embers
      const logMat=new THREE.MeshStandardMaterial({color:0x2e1c10,roughness:.9});
      for(let k=0;k<3;k++){
        const lg=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,Math.max(6,insetW*0.5),10),logMat);
        lg.rotation.z=Math.PI/2; lg.rotation.y=(k-1)*0.25;
        lg.position.set(0,-insetH/2+wall+2.2+k*0.6,-fbD*0.12+(k-1)*1.5);
        lg.castShadow=true; grp.add(lg);
      }
      // two flame planes at different depths for a sense of volume
      const fm=new THREE.MeshStandardMaterial({color:0x1c0b02,emissive:0xff7a1e,emissiveIntensity:1.0,
        roughness:.6,transparent:true,opacity:.92,side:THREE.DoubleSide});
      const fl=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(4,insetW-2*wall-2),insetH*0.6),fm);
      fl.position.set(0,-insetH*0.12,-fbD*0.2); grp.add(fl); flames.push(fm);
      const fm2=fm.clone(); fm2.emissiveIntensity=.7; fm2.opacity=.7;
      const fl2=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(3,(insetW-2*wall)*0.7),insetH*0.45),fm2);
      fl2.position.set(0,-insetH*0.16,-fbD*0.34); grp.add(fl2); flames.push(fm2);
      const glow=new THREE.PointLight(0xff8c33,0.9,110);
      glow.position.set(0,0,fbD*0.25); grp.add(glow); flames.push(glow);
    }
    grp.position.set(cx, yc, D/2-1-fbD/2); // anchored to the front; setback shortens it toward the back
    unitGroup.add(grp);
  }
  else { // open niche + decor
    if(fp){ // face-plate frame: covers only the perimeter (framing, wiring, fixings) — niche stays open
      const f=fpFrame(c,cw,rh);
      fpStrips(cx,cy,cw,rh,Math.max(4,cw-2*f),Math.max(4,rh-2*f),D,t);
    }
    if(!isTech() && c.decor!=="none"){
      const R=rng(1000*ri+ci+7);
      const compH=rh/(Math.max(0,Math.floor(c.shelves||0))+1)-((c.shelves||0)>0?t:0); // fit under the first shelf
      const g=new THREE.Group();
      const addBooks=(x0,count)=>{ let bx=x0;
        for(let k=0;k<count;k++){
          const bw=1.4+R()*1.4, bh=Math.max(1.5,Math.min(compH-1.5, 14+R()*9)), bd=Math.min((D-sb)*0.55,16+R()*5);
          const hue=[0x8a4b3a,0x3e5a68,0x6e6a44,0x74513f,0x54636e,0x9c7b4f][Math.floor(R()*6)];
          const b=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),
            new THREE.MeshStandardMaterial({color:hue,roughness:.8}));
          b.castShadow=true;
          b.position.set(bx+bw/2, bh/2, 0); g.add(b); bx+=bw+0.25;
        } return bx; };
      const addObjects=(x0)=>{
        const vh=Math.max(2,Math.min(compH-2,Math.min(rh*0.5,12+R()*6)));
        const vase=new THREE.Mesh(new THREE.CylinderGeometry(2.6,3.4,vh,18),
          new THREE.MeshStandardMaterial({color:0xcfc7b8,roughness:.5}));
        vase.castShadow=true; vase.position.set(x0+4,vh/2,0); g.add(vase);
        const ball=new THREE.Mesh(new THREE.SphereGeometry(2.6,18,14),
          new THREE.MeshStandardMaterial({color:0x8f9aa4,roughness:.3,metalness:.4}));
        ball.castShadow=true; ball.position.set(x0+12,2.6,2); g.add(ball);
        return x0+18; };
      const addSoundbar=()=>{
        const w=Math.min(cw-2,Math.max(6,cw-8));
        const h=Math.max(3,Math.min(compH-1.5,Math.min(rh*0.45,9)));
        const dep=Math.max(4,Math.min((D-sb)*0.5,10));
        const bar=new THREE.Mesh(new THREE.BoxGeometry(w,h,dep),
          new THREE.MeshStandardMaterial({color:0x141416,roughness:.6,metalness:.15}));
        bar.castShadow=true; bar.position.set(0,h/2,0); g.add(bar);
        const gr=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(2,w-2),Math.max(1,h-1.6)),
          new THREE.MeshStandardMaterial({color:0x2a2a2e,roughness:.95}));
        gr.position.set(0,0,dep/2+0.05); bar.add(gr);
        const led=new THREE.Mesh(new THREE.CircleGeometry(0.35,10),
          new THREE.MeshStandardMaterial({color:0x113322,emissive:0x2fbf71,emissiveIntensity:1.2}));
        led.position.set(w/2-2.5,0,dep/2+0.1); bar.add(led);
      };
      const addSpeakers=(n)=>{
        const cabMat=new THREE.MeshStandardMaterial({color:0x1a1a1d,roughness:.7});
        const coneMat=new THREE.MeshStandardMaterial({color:0x35353a,roughness:.45,metalness:.25});
        const domeMat=new THREE.MeshStandardMaterial({color:0x8a8f94,roughness:.3,metalness:.6});
        const topGap=2.5; // small clearance above the cabinets
        const sh=Math.max(6, compH-topGap);                     // fill the niche (or compartment) height
        const sw=Math.max(4, Math.min((cw-4)/n-3, sh*0.55));    // width follows niche & speaker proportions
        const sd=Math.max(5, Math.min(D-sb-3, sh*0.5, 25));
        const edge=Math.max(0,cw/2-sw/2-3);
        const xs = n===1 ? [0] : (n===2 ? [-edge,edge] : [-edge,0,edge]);
        xs.forEach((px,k)=>{
          const centerCh = (n===3 && k===1); // horizontal centre channel
          const bw=centerCh?Math.min(cw*0.42,sw*1.9):sw;
          const bh=centerCh?Math.max(5,sh*0.45):sh;
          const cab=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,sd),cabMat);
          cab.castShadow=true; cab.position.set(px,bh/2,0); g.add(cab);
          const woof=new THREE.Mesh(new THREE.CylinderGeometry(Math.min(bw,bh)*0.3,Math.min(bw,bh)*0.3,0.5,20),coneMat);
          woof.rotation.x=Math.PI/2;
          woof.position.set(centerCh?-bw*0.22:0, centerCh?0:-bh*0.18, sd/2+0.2); cab.add(woof);
          const tw=new THREE.Mesh(new THREE.CylinderGeometry(Math.min(bw,bh)*0.13,Math.min(bw,bh)*0.13,0.4,16),domeMat);
          tw.rotation.x=Math.PI/2;
          tw.position.set(centerCh?bw*0.22:0, centerCh?0:bh*0.22, sd/2+0.2); cab.add(tw);
        });
      };
      let cursor=-cw/2+2.5;
      if(c.decor==="books") addBooks(cursor, Math.max(2,Math.floor((cw-6)/2.1)));
      else if(c.decor==="objects") addObjects(cursor);
      else if(c.decor==="soundbar") addSoundbar();
      else if(c.decor==="speaker1") addSpeakers(1);
      else if(c.decor==="speaker2") addSpeakers(2);
      else if(c.decor==="speaker3") addSpeakers(3);
      else { cursor=addBooks(cursor, Math.max(2,Math.floor((cw-24)/2.2))); addObjects(cursor+1); }
      g.position.set(cx, yb, sb/2);
      unitGroup.add(g);
    }
  }
}

/* ---------- click-to-locate: pick a niche in 3D, flash its section in the sidebar ---------- */
let pickInfo={rowBase:[]};
let flashTimer=0;
const raycaster=new THREE.Raycaster(), pickV=new THREE.Vector2();

/* ---------- openable fronts: doors pivot on their hinge, drawers slide out ---------- */
const openCells=new Set(); // "ri:ci" keys of currently-open fronts (view state, not saved)
let animFronts=[];
function registerFront(kind,obj,hinge,ri,ci){
  const key=ri+":"+ci;
  obj.userData.cellKey=key; obj.userData.ri=ri; obj.userData.ci=ci;
  const f={key,kind,obj,hinge,t:openCells.has(key)?1:0};
  f.target=f.t;
  animFronts.push(f);
  applyFront(f);
}
function applyFront(f){
  if(f.kind==="drawer"){ f.obj.position.z = f.t * S.depth*0.6; return; }
  const flap=(f.hinge==="top"||f.hinge==="bottom");
  const max=flap?1.35:1.85;
  const sign=(f.hinge==="right"||f.hinge==="bottom")?1:-1;
  if(flap) f.obj.rotation.x=sign*max*f.t;
  else f.obj.rotation.y=sign*max*f.t;
}
function toggleFront(ri,ci){
  const key=ri+":"+ci;
  if(openCells.has(key)) openCells.delete(key); else openCells.add(key);
  animFronts.forEach(f=>{ if(f.key===key) f.target=openCells.has(key)?1:0; });
}
function cellRectFor(ri,ci){
  const row=S.rows[ri]; ensureDividers(row);
  const widths=normWidths(row), t=S.thickness;
  let x=-S.unitWidth/2; if(row.dividers[0]) x+=t;
  for(let k=0;k<ci;k++){
    x+=widths[k];
    if(k<row.cols.length-1 && row.dividers[k+1]) x+=t;
  }
  return {ci, x0:x, w:widths[ci]};
}

function findRowAt(py){
  const rb=pickInfo.rowBase; if(!rb.length) return null;
  let best=0, bestD=Infinity;
  rb.forEach((yb,ri)=>{
    const h=S.rows[ri]?S.rows[ri].height:0;
    const d = py<yb ? yb-py : (py>yb+h ? py-(yb+h) : 0);
    if(d<bestD){ bestD=d; best=ri; }
  });
  return bestD<8 ? best : (py<rb[0]?0:(py>rb[rb.length-1]+(S.rows[S.rows.length-1]||{height:0}).height? S.rows.length-1 : best));
}
function findCellAt(row, px){
  ensureDividers(row);
  const widths=normWidths(row), t=S.thickness;
  let x=-S.unitWidth/2;
  if(row.dividers[0]) x+=t;
  for(let ci=0;ci<row.cols.length;ci++){
    if(px<=x+widths[ci]+t/2) return {ci, x0:x, w:widths[ci]};
    x+=widths[ci];
    if(ci<row.cols.length-1 && row.dividers[ci+1]) x+=t;
  }
  const lci=row.cols.length-1;
  return {ci:lci, x0:x-widths[lci], w:widths[lci]};
}
function pickAt(clientX,clientY){
  const r=canvas.getBoundingClientRect();
  pickV.x=((clientX-r.left)/r.width)*2-1;
  pickV.y=-((clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(pickV,camera);
  const hits=raycaster.intersectObjects(unitGroup.children,true);
  if(!hits.length) return;
  const p=hits[0].point;
  // prefer the tagged front (a swung-open door reports odd coordinates)
  let o=hits[0].object, meta=null;
  while(o && o!==unitGroup){ if(o.userData && o.userData.cellKey){ meta=o.userData; break; } o=o.parent; }
  let ri, cell;
  if(meta){ ri=meta.ri; cell=cellRectFor(ri,meta.ci); }
  else {
    ri=findRowAt(p.y);
    if(ri==null || !S.rows[ri]) return;
    cell=findCellAt(S.rows[ri], p.x);
  }
  if(ri==null || !S.rows[ri] || !cell) return;
  const cc=S.rows[ri].cols[cell.ci];
  if(cc && (cc.c.type==="door"||cc.c.type==="door-push"||cc.c.type==="drawer"))
    toggleFront(ri,cell.ci);
  showPickOverlay(ri,cell);
  flashSidebar(ri,cell.ci);
}
function showPickOverlay(ri,cell){
  clearGroup(selGroup);
  const row=S.rows[ri], yb=pickInfo.rowBase[ri];
  const m=new THREE.Mesh(
    new THREE.BoxGeometry(cell?cell.w+0.6:S.unitWidth+0.6, row.height+0.6, S.depth+2),
    new THREE.MeshBasicMaterial({color:0xd9a05b,transparent:true,opacity:0.18,depthWrite:false}));
  m.position.set(cell?cell.x0+cell.w/2:0, yb+row.height/2, 0);
  selGroup.add(m);
}
function flashSidebar(ri,ci){
  if(expandedRow!==ri){ expandedRow=ri; renderSidebar(); } // open the picked row's card
  document.querySelectorAll(".rowcard.flash,.cell.flash").forEach(el=>el.classList.remove("flash"));
  const card=document.querySelector(`.rowcard[data-row="${ri}"]`);
  if(!card) return;
  card.classList.add("flash");
  if(ci!=null){
    const cells=card.querySelectorAll(".cell");
    if(cells[ci]) cells[ci].classList.add("flash");
  }
  card.scrollIntoView({behavior:"smooth",block:"nearest"});
  clearTimeout(flashTimer);
  flashTimer=setTimeout(()=>{
    document.querySelectorAll(".rowcard.flash,.cell.flash").forEach(el=>el.classList.remove("flash"));
    clearGroup(selGroup);
  },2600);
}

/* ---------- camera & controls (custom orbit) ---------- */
let firstFit=true;
const target=new THREE.Vector3();
let sph={r:600, th:Math.PI*0.12, ph:Math.PI/2.35};
function fitCameraIfFirst(){
  const H=totalHeight();
  target.set(0,H/2,0);
  if(firstFit){ sph.r=Math.max(S.unitWidth,H)*1.9; firstFit=false; }
  applyCam();
}
function applyCam(){
  sph.ph=Math.min(Math.max(sph.ph,0.12),Math.PI/2.02);
  camera.position.set(
    target.x + sph.r*Math.sin(sph.ph)*Math.sin(sph.th),
    target.y + sph.r*Math.cos(sph.ph),
    target.z + sph.r*Math.sin(sph.ph)*Math.cos(sph.th));
  camera.lookAt(target);
}
let dragging=false, panning=false, px=0, py=0;
const ptrs=new Map(); let pinchD=0;
canvas.addEventListener("pointerdown",e=>{
  canvas.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1){ dragging=true; panning=(e.button===2||e.shiftKey); px=e.clientX; py=e.clientY;
    clickStart={x:e.clientX,y:e.clientY,moved:0,fromCanvas:true}; }
  else clickStart=null;
  if(ptrs.size===2){ const a=[...ptrs.values()]; pinchD=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); }
});
canvas.addEventListener("pointermove",e=>{
  if(!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2){
    const a=[...ptrs.values()];
    const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
    sph.r*=pinchD/d; sph.r=Math.min(Math.max(sph.r,60),4000); pinchD=d;
    const mx=(a[0].x+a[1].x)/2, my=(a[0].y+a[1].y)/2;
    doPan((mx-px)*0.6,(my-py)*0.6); px=mx; py=my; applyCam(); return;
  }
  if(!dragging) return;
  const dx=e.clientX-px, dy=e.clientY-py; px=e.clientX; py=e.clientY;
  if(clickStart) clickStart.moved+=Math.abs(dx)+Math.abs(dy);
  if(panning) doPan(dx,dy);
  else { sph.th-=dx*0.0055; sph.ph-=dy*0.0055; }
  applyCam();
});
function doPan(dx,dy){
  const s=sph.r*0.0012;
  const right=new THREE.Vector3(); camera.getWorldDirection(right);
  const dir=right.clone();
  right.cross(camera.up).normalize();
  const up=right.clone().cross(dir).normalize().negate();
  target.addScaledVector(right,-dx*s);
  target.addScaledVector(up,-dy*s);
}
let clickStart=null;
window.addEventListener("pointerup",e=>{
  const wasCanvasTap = clickStart && clickStart.fromCanvas && clickStart.moved<6 && ptrs.size===1;
  ptrs.delete(e.pointerId);
  if(ptrs.size===0){dragging=false;panning=false;}
  if(wasCanvasTap && e.button!==2){ pickAt(e.clientX,e.clientY); }
  if(ptrs.size===0) clickStart=null;
});
canvas.addEventListener("wheel",e=>{ e.preventDefault();
  sph.r*=1+e.deltaY*0.0012; sph.r=Math.min(Math.max(sph.r,60),4000); applyCam(); },{passive:false});
canvas.addEventListener("contextmenu",e=>e.preventDefault());

/* ---------- resize & loop ---------- */
function resize(){
  const p=document.getElementById("view3d");
  const w=p.clientWidth||1, h=p.clientHeight||1;
  renderer.setSize(w,h,false);
  camera.aspect=w/h; camera.updateProjectionMatrix();
  const pe=document.getElementById("paneElev");
  if(pe && pe.classList.contains("active")) drawElevation();
}
window.addEventListener("resize",resize);
new ResizeObserver(resize).observe(document.getElementById("view3d"));

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
function animate(tms){
  requestAnimationFrame(animate);
  if(!reduceMotion){
    const tt=tms*0.006;
    flames.forEach((f,i)=>{
      const v=0.85+0.3*Math.sin(tt*2.1+i*1.7)+0.12*Math.sin(tt*5.3+i);
      if(f.isMaterial) f.emissiveIntensity=v;
      else f.intensity=0.6*v;
    });
  }
  animFronts.forEach(f=>{
    if(Math.abs(f.t-f.target)>0.001){
      f.t = reduceMotion ? f.target : f.t+(f.target-f.t)*0.14;
      if(Math.abs(f.t-f.target)<=0.001) f.t=f.target;
      applyFront(f);
    }
  });
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

let rafRebuild=0;
function scheduleRebuild(){ cancelAnimationFrame(rafRebuild); rafRebuild=requestAnimationFrame(rebuild); saveState(); scheduleHistory(); }
document.getElementById("chkTech").addEventListener("change",scheduleRebuild);
document.getElementById("chkDims").addEventListener("change",scheduleRebuild);
