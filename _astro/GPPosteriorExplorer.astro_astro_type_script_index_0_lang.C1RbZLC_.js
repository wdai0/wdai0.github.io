import{l as P,g as N,d as T,c as g}from"./gp-math.BZ02m2gx.js";const x=720,p=360,a=34,f=-4,q=4,h=-3,m=3;function E(){return document.querySelector("#gp-posterior-explorer")}function F(e,o){e.value=o.toFixed(2),e.textContent=o.toFixed(2)}function d(e){return a+(e-f)/(q-f)*(x-a*2)}function y(e){return p-a-(e-h)/(m-h)*(p-a*2)}function X(e,o){const i=e.getBoundingClientRect(),c=g((o.clientX-i.left)/i.width,0,1),t=g((o.clientY-i.top)/i.height,0,1);return{x:f+c*(q-f),y:m-t*(m-h)}}function w(e,o){return e.map((i,c)=>{const t=d(i),s=y(o[c]);return`${c===0?"M":"L"} ${t.toFixed(2)} ${s.toFixed(2)}`}).join(" ")}function j(e,o,i){const c=e.map((s,l)=>`${l===0?"M":"L"} ${d(s)} ${y(i[l])}`).join(" "),t=[...e].reverse().map((s,l)=>`L ${d(s)} ${y(o[o.length-1-l])}`).join(" ");return`${c} ${t} Z`}function M(){return[{x:-2.3,y:-1.1},{x:-.9,y:.25},{x:.6,y:1.05},{x:2.2,y:.45}]}function I(){return[{x:-3,y:.15},{x:-1.8,y:1.05},{x:-.6,y:-.95},{x:.8,y:.8},{x:2.1,y:-1}]}function Y(e,o,i,c,t){const s=i.map((r,n)=>g(r+2*Math.sqrt(c[n]),h,m)),l=i.map((r,n)=>g(r-2*Math.sqrt(c[n]),h,m)),v=[-2,-1,0,1,2].map(r=>{const n=y(r);return`
        <line x1="${a}" x2="${x-a}" y1="${n}" y2="${n}" stroke="rgba(44,35,24,0.08)" />
        <text x="8" y="${n+4}" fill="#6b6257" font-size="11">${r.toFixed(0)}</text>
      `}).join(""),b=[-4,-2,0,2,4].map(r=>{const n=d(r);return`
        <line x1="${n}" x2="${n}" y1="${a}" y2="${p-a}" stroke="rgba(44,35,24,0.05)" />
        <text x="${n-6}" y="${p-10}" fill="#6b6257" font-size="11">${r.toFixed(0)}</text>
      `}).join(""),k=t.map(r=>`<circle cx="${d(r.x)}" cy="${y(r.y)}" r="5.2" fill="#af5c35" stroke="#fff8f1" stroke-width="2" />`).join(""),u=t.length===0?`<text x="${x/2}" y="${p/2}" text-anchor="middle" fill="#6b6257" font-size="14">
           Click to add observations
         </text>`:"";e.innerHTML=`
    <rect x="0" y="0" width="${x}" height="${p}" fill="transparent"></rect>
    ${v}
    ${b}
    <line x1="${a}" x2="${x-a}" y1="${y(0)}" y2="${y(0)}" stroke="rgba(44,35,24,0.18)" />
    <line x1="${d(0)}" x2="${d(0)}" y1="${a}" y2="${p-a}" stroke="rgba(44,35,24,0.18)" />
    <path d="${j(o,l,s)}" fill="rgba(175,92,53,0.18)" stroke="none" />
    <path d="${w(o,i)}" fill="none" stroke="#8d472b" stroke-width="3" stroke-linecap="round" />
    ${k}
    ${u}
  `}function _(e){return{kernel:e.querySelector("#posterior-kernel").value,variance:Number.parseFloat(e.querySelector("#posterior-variance").value),lengthScale:Number.parseFloat(e.querySelector("#posterior-length-scale").value),periodicity:Number.parseFloat(e.querySelector("#posterior-periodicity").value),bias:Number.parseFloat(e.querySelector("#posterior-bias").value),noise:Number.parseFloat(e.querySelector("#posterior-noise").value)}}function H(){const e=E();if(!e)return;const o=e.querySelector("#posterior-plot"),i=e.querySelector("#posterior-summary");if(!o||!i)return;const c=[["#posterior-variance","#posterior-variance-output"],["#posterior-length-scale","#posterior-length-scale-output"],["#posterior-periodicity","#posterior-periodicity-output"],["#posterior-bias","#posterior-bias-output"],["#posterior-noise","#posterior-noise-output"]];let t=M();const s=()=>{const u=_(e),r=P(f,q,180),n=t.map(S=>S.x),$=t.map(S=>S.y),L=N(n,$,r,u);Y(o,r,L.mean,L.variance,t),i.innerHTML=`
      <strong>${t.length}</strong> observation${t.length===1?"":"s"} loaded.
      ${T(u.kernel)}
      Increasing observation noise keeps the posterior band wider near the observed points, while a shorter length scale makes the fit more local and more reactive.
    `};c.forEach(([u,r])=>{const n=e.querySelector(u),$=e.querySelector(r);!n||!$||(F($,Number.parseFloat(n.value)),n.addEventListener("input",()=>{F($,Number.parseFloat(n.value)),s()}))});const l=e.querySelector("#posterior-kernel");l&&l.addEventListener("change",s),o.addEventListener("click",u=>{const r=X(o,u);t=[...t,r].slice(-16),s()});const v=e.querySelector("#load-smooth"),b=e.querySelector("#load-periodic"),k=e.querySelector("#clear-points");v?.addEventListener("click",()=>{t=M(),s()}),b?.addEventListener("click",()=>{t=I(),s()}),k?.addEventListener("click",()=>{t=[],s()}),s()}H();
