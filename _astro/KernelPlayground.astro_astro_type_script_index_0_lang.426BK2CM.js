import{l as $,s as w,b as S,d as q}from"./gp-math.BZ02m2gx.js";const m=["#af5c35","#47684b","#9c7a2b","#4b617c"];function M(){return document.querySelector("#kernel-playground")}function b(e,t){e.value=t.toFixed(2),e.textContent=t.toFixed(2)}function v(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function F(e,t){const a=t===0?.5:(e/t+1)/2,h={r:75,g:97,b:124},d={r:249,g:244,b:235},o={r:175,g:92,b:53},r=a<.5?[h,d]:[d,o],i=a<.5?a/.5:(a-.5)/.5,g=Math.round(r[0].r+(r[1].r-r[0].r)*i),n=Math.round(r[0].g+(r[1].g-r[0].g)*i),l=Math.round(r[0].b+(r[1].b-r[0].b)*i);return`rgb(${g}, ${n}, ${l})`}function C(e,t,a){const r=a.flat(),i=Math.min(...r,-2.5),g=Math.max(...r,2.5),n=Math.max(g-i,1e-6),l=[-2,-1,0,1,2].map(c=>{const p=306-(c-i)/n*272;return`
        <line x1="34" x2="646" y1="${p}" y2="${p}" stroke="rgba(44,35,24,0.08)" />
        <text x="10" y="${p+4}" fill="#6b6257" font-size="11">${c.toFixed(0)}</text>
      `}).join(""),s=a.map((c,p)=>`<path d="${t.map((f,y)=>{const k=34+(f-t[0])/(t[t.length-1]-t[0])*612,x=306-(c[y]-i)/n*272;return`${y===0?"M":"L"} ${k.toFixed(2)} ${x.toFixed(2)}`}).join(" ")}" fill="none" stroke="${m[p%m.length]}" stroke-width="3" stroke-linecap="round" />`).join("");e.innerHTML=`
    <rect x="0" y="0" width="680" height="340" fill="transparent"></rect>
    ${l}
    <line x1="34" x2="646" y1="306" y2="306" stroke="rgba(44,35,24,0.18)" />
    <line x1="34" x2="34" y1="34" y2="306" stroke="rgba(44,35,24,0.18)" />
    ${s}
  `}function L(e,t){const o=368/t.length,r=t.flat(),i=Math.max(...r.map(n=>Math.abs(n)),1e-6),g=t.map((n,l)=>n.map((s,c)=>{const p=26+c*o,u=26+l*o;return`<rect x="${p}" y="${u}" width="${o+.5}" height="${o+.5}" fill="${F(s,i)}" />`}).join("")).join("");e.innerHTML=`
    <rect x="0" y="0" width="420" height="420" fill="transparent"></rect>
    <rect x="26" y="26" width="368" height="368" rx="18" fill="none" stroke="rgba(44,35,24,0.15)" />
    ${g}
  `}function N(e){const t=e.querySelector("#kernel-type"),a=e.querySelector("#variance"),h=e.querySelector("#length-scale"),d=e.querySelector("#periodicity"),o=e.querySelector("#bias");return{kernel:t.value,variance:Number.parseFloat(a.value),lengthScale:Number.parseFloat(h.value),periodicity:Number.parseFloat(d.value),bias:Number.parseFloat(o.value),noise:.08}}function T(){const e=M();if(!e)return;const t=e.querySelector("#kernel-sample-plot"),a=e.querySelector("#kernel-covariance-plot"),h=e.querySelector("#kernel-summary"),d=e.querySelector("#kernel-sample-caption"),o=e.querySelector("#kernel-covariance-caption");if(!t||!a||!h||!d||!o)return;const r=[["#variance","#variance-output"],["#length-scale","#length-scale-output"],["#periodicity","#periodicity-output"],["#bias","#bias-output"]],i=()=>{const n=N(e),l=$(-2.8,2.8,48),s=$(-2.4,2.4,20),c=w(l,n,4),p=S(s,n);C(t,l,c),L(a,p),d.textContent=`${n.kernel.toUpperCase()} prior draws across a one-dimensional input domain.`,o.textContent="Diagonal intensity tracks marginal variance; off-diagonal structure reveals correlation decay.",h.innerHTML=`
      <strong>${v(n.kernel.toUpperCase())} kernel:</strong>
      ${v(q(n.kernel))}
      Larger variance scales the overall vertical spread, while length scale changes how quickly nearby inputs stop influencing one another.
      ${n.kernel==="periodic"?" The periodicity slider controls the repeat interval directly.":""}
      ${n.kernel==="linear"?" The bias slider shifts the point where the linear kernel has zero covariance.":""}
    `};r.forEach(([n,l])=>{const s=e.querySelector(n),c=e.querySelector(l);!s||!c||(b(c,Number.parseFloat(s.value)),s.addEventListener("input",()=>{b(c,Number.parseFloat(s.value)),i()}))});const g=e.querySelector("#kernel-type");g&&g.addEventListener("change",i),i()}T();
