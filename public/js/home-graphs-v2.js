(() => {
  const dateText = d => {if(!d)return '—';const [y,m,day]=String(d).split('-');return `${day}/${m}/${y}`;};
  const money = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v);
  function render(el){
    let data=[];
    try{data=JSON.parse(el.dataset.points||'[]').filter(p=>Number.isFinite(p.value));}catch{}
    if(!data.length){el.innerHTML='<div class="pch-chart-empty">Nenhum registro disponível.</div>';return;}
    const isMarket=el.dataset.kind==='market';
    const values=data.map(x=>Number(x.value));const lo=Math.min(...values),hi=Math.max(...values);const margin=Math.max((hi-lo)*.15,isMarket?Math.max(hi*.04,1):2);const min=Math.max(0,lo-margin),max=hi+margin;
    const left=24,right=502,top=26,bottom=178;
    const x=i=>data.length===1?(left+right)/2:left+(right-left)*i/(data.length-1);
    const y=v=>bottom-(v-min)/(max-min||1)*(bottom-top);
    const points=data.map((p,i)=>`${x(i)},${y(p.value)}`).join(' ');
    const area=`${x(0)},${bottom} ${points} ${x(data.length-1)},${bottom}`;
    const circles=data.map((p,i)=>`<circle class="pch-graph-point" data-index="${i}" cx="${x(i)}" cy="${y(p.value)}" r="5" fill="#c9ef76" stroke="#152114" stroke-width="2" tabindex="0" role="button" aria-label="${p.value}"></circle>`).join('');
    el.innerHTML=`<svg viewBox="0 0 526 205" aria-label="Gráfico de evolução" role="img" preserveAspectRatio="none"><line x1="24" y1="178" x2="502" y2="178" stroke="#34422e" stroke-dasharray="4 6"/><line x1="24" y1="102" x2="502" y2="102" stroke="#34422e" stroke-dasharray="4 6"/><polygon points="${area}" fill="rgba(201,239,118,.10)"/><polyline points="${points}" stroke="#c9ef76" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${circles}<text x="24" y="200" fill="#96a88b" font-size="11">${dateText(data[0].date)}</text><text x="502" y="200" text-anchor="end" fill="#96a88b" font-size="11">${dateText(data[data.length-1].date)}</text></svg><div class="pch-graph-tooltip" hidden></div>`;
    const tooltip=el.querySelector('.pch-graph-tooltip');
    function show(i){const p=data[i];const rect=el.getBoundingClientRect();const px=x(i)/526*rect.width;const py=y(p.value)/205*rect.height;tooltip.innerHTML=`<strong>${isMarket?money(p.value):p.value+' OVR'}</strong><div>${dateText(p.date)}</div><div>${p.season||'Temporada não definida'}</div>`;tooltip.hidden=false;tooltip.style.left=Math.min(Math.max(px,90),rect.width-90)+'px';tooltip.style.top=Math.max(py-4,105)+'px';}
    el.querySelectorAll('circle').forEach(c=>{const i=Number(c.dataset.index);c.addEventListener('mouseenter',()=>show(i));c.addEventListener('focus',()=>show(i));c.addEventListener('mouseleave',()=>tooltip.hidden=true);c.addEventListener('blur',()=>tooltip.hidden=true);c.addEventListener('click',()=>{if(tooltip.hidden)show(i);else tooltip.hidden=true;});});
  }
  document.querySelectorAll('.pch-interactive-chart').forEach(render);
  const photo=document.querySelector('.pch-hero-photo');if(photo){const x=Number(photo.dataset.x||50),y=Number(photo.dataset.y||50),z=Number(photo.dataset.zoom||1);photo.style.objectPosition=`${x}% ${y}%`;photo.style.transform=`scale(${z})`;photo.style.transformOrigin=`${x}% ${y}%`;}
})();
