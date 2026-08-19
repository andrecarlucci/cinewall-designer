"use strict";
/* =====================================================================
   TABS
===================================================================== */
document.querySelectorAll("#tabs .tab").forEach(b=>{
  b.addEventListener("click",()=>{
    document.querySelectorAll("#tabs .tab").forEach(x=>x.classList.toggle("active",x===b));
    document.querySelectorAll(".pane").forEach(p=>p.classList.toggle("active",p.id===b.dataset.pane));
    document.getElementById("tool3d").style.visibility = b.dataset.pane==="view3d" ? "visible" : "hidden";
    if(b.dataset.pane==="view3d") resize();
    if(b.dataset.pane==="paneElev") drawElevation();
  });
});

/* boot */
(async function boot(){
  try{
    await loadDemoState();
  }catch(e){
    controls.innerHTML = `<div class="section"><h2>Couldn't load demo.json</h2>
      <p style="color:var(--muted);font-size:12px;line-height:1.5">Serve this folder over HTTP instead of opening the file
      directly — e.g. <code>python3 -m http.server</code> — then reload.</p></div>`;
    return;
  }
  S = loadSaved() || defaultState();
  expandedRow = S.rows.length ? S.rows.length-1 : null;
  renderSidebar();
  resize();
  rebuild();
})();
