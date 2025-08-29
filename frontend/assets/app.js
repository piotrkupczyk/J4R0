
/**********************
 * Prosty store
 **********************/
const state = {
  products: [], // spłaszczone
  cart: JSON.parse(localStorage.getItem('cart')||'[]'),
  builder: { CPU:null, Motherboard:null, RAM:null, GPU:null, PSU:null, Case:null, Storage:null },
  filterType:'all',
  query:''
};

const API_BASE = localStorage.getItem('API_BASE') || 'http://127.0.0.1:8000';
// Przykład zmiany na szybko w konsoli przeglądarki:
// localStorage.setItem('API_BASE', 'http://localhost:8000'); location.reload();
const fmtPL = new Intl.NumberFormat('pl-PL', { style:'currency', currency:'PLN' });
function saveCart(){ localStorage.setItem('cart', JSON.stringify(state.cart)); }

async function fetchJSON(url){
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

function yesNo(v){
  // obsłuż: bool, '1'/'0', 't'/'f', 'y'/'n'
  if (v === true || v === '1' || v === 't' || v === 'T' || v === 'Y' || v === 'y') return 'Tak';
  return 'Nie';
}
function fmtClock(mhz){
  if (mhz == null) return null;
  return mhz >= 1000 ? `${(mhz/1000).toFixed(2)} GHz` : `${mhz} MHz`;
}

/**********************
 * Inicjalizacja
 **********************/
async function flattenProducts(){
  const status = document.getElementById('status');
  if (status) status.textContent = 'Ładowanie...';

  // dopisz/usuń ścieżki zgodnie z tym, co masz już na backendzie
  const paths = [
    '/products/gpu-joined',
    '/products/cpu-joined',
    // '/products/mobo-joined',
    // '/products/ram-joined',
    // '/products/psu-joined',
    // '/products/case-joined',
    // '/products/storage-joined',
  ];

  try {
    const results = await Promise.allSettled(
      paths.map(p => fetchJSON(`${API_BASE}${p}`))
    );

    const merged = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        merged.push(...r.value);
      } else {
        console.warn('Endpoint failed/skipped:', paths[i], r.reason?.toString?.());
      }
    });

    state.products = merged;
    if (status) status.textContent = merged.length ? '' : 'Brak produktów do wyświetlenia.';
    console.log('Loaded products:', merged.length);
  } catch (e) {
    console.warn('Błąd pobierania danych z API:', e);
    state.products = [];
    if (status) status.textContent = 'Nie udało się pobrać danych z API.';
  }
}

function mountFilters(){
  const chips = document.querySelectorAll('#typeChips .chip');
  chips.forEach(ch => ch.addEventListener('click', e=>{
    chips.forEach(c=>c.classList.remove('active'));
    ch.classList.add('active');
    state.filterType = ch.dataset.type;
    renderProducts();
  }))
  document.getElementById('q').addEventListener('input', e=>{ state.query = e.target.value.toLowerCase(); renderProducts(); })
}

function renderProducts(){
  const grid = document.getElementById('products');
  grid.innerHTML='';
  const tpl = document.getElementById('tplProduct');
  const filtered = state.products.filter(p=>{
    const typeOk = state.filterType==='all' || p.type===state.filterType;
    const qOk = !state.query || `${p.name} ${p.type}`.toLowerCase().includes(state.query);
    return typeOk && qOk;
  });
  for (const p of filtered){
    const node = tpl.content.cloneNode(true);
    node.querySelector('.title').textContent = p.name;
    node.querySelector('.price').textContent = fmtPL.format(p.price);
    node.querySelector('.meta').textContent = metaFor(p);
    node.querySelector('[data-add-single]').addEventListener('click', ()=> addToCart(p));
    node.querySelector('[data-to-builder]').addEventListener('click', ()=> toBuilder(p));
    grid.appendChild(node);
  }
}

function metaFor(p){
  switch(p.type){
    case 'CPU': {
      const parts = [];
      if (p.socket) parts.push(`Socket ${p.socket}`);
      if (p.cores || p.threads) parts.push(`${p.cores||'?'} Rdzeni/${p.threads||'?'} Wątków`);
      if (p.clock != null) parts.push(fmtClock(p.clock));
      if (p.tdp != null) parts.push(`TDP ${p.tdp}W`);
      // flagi z CHAR(1)/bool
      if (p.cooler != null) parts.push(`Chłodzenie: ${yesNo(p.cooler)}`);
      if (p.oc != null) parts.push(`OC: ${yesNo(p.oc)}`);
      if (p.integra != null) parts.push(`iGPU: ${yesNo(p.integra)}`);
      return parts.join(', ');
    }
    case 'Motherboard': return `Socket ${p.socket}, RAM ${p.ramType}`;
    case 'RAM': return `${p.size}GB ${p.ramType}`;
    case 'GPU': {
      const parts = [];
      if (p.chipset) parts.push(p.chipset);
      if (p.vram) parts.push(`${p.vram}GB`);
      if (p.gddr) parts.push(p.gddr);
      if (p.tdp) parts.push(`TDP ${p.tdp}W`);
      if (p.length) parts.push(`${p.length}mm`);
      if (p.hdmi != null) parts.push(`HDMI x${p.hdmi}`);
      if (p.dp != null) parts.push(`DP x${p.dp}`);
      return parts.join(', ');
}
    case 'PSU': return `${p.watt}W`;
    case 'Case': return `GPU max ${p.gpuMax}mm`;
    case 'Storage': return p.iface;
    default: return '';
  }
}

/**********************
 * Builder helpers (link only)
 **********************/
function toBuilder(p){
  // zapamiętaj wybór w sessionStorage, odbierz na builder.html jeśli chcesz
  sessionStorage.setItem('preselect', JSON.stringify(p));
  location.href = 'builder.html';
}

/**********************
 * Koszyk
 **********************/
function addToCart(item){
  state.cart.push(item);
  saveCart();
  renderCart();
}
function removeFromCart(index){
  state.cart.splice(index,1);
  saveCart(); renderCart();
}
function renderCart(){
  const list = document.getElementById('cartList');
  if (!list) return; // index.html nie ma koszyka
  list.innerHTML='';
  let total = 0;
  state.cart.forEach((it, idx)=>{
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `<div><strong>${it.name}</strong> <span class="muted">${it.type}</span></div><div>${fmtPL.format(it.price)}</div>`;
    row.addEventListener('dblclick', ()=> removeFromCart(idx));
    list.appendChild(row);
    total += it.price;
  })
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  if (totalEl) totalEl.textContent = fmtPL.format(total);
  if (countEl) countEl.textContent = state.cart.length;
}

/**********************
 * Footer (stable)
 **********************/
function syncFooterHeight(){
  const footer = document.querySelector('footer');
  if (!footer) return;
  const h = footer.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--footer-h', Math.ceil(h) + 'px');
}
function mountFooter(){
  const btn = document.getElementById('aboutToggle');
  const footer = document.querySelector('footer');
  if (!btn || !footer) return;
  btn.addEventListener('click', ()=>{
    footer.classList.toggle('open');
    btn.classList.toggle('open-btn');
    syncFooterHeight();
  });
}

/**********************
 * Theme & Start
 **********************/
function mountThemeToggle(){
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', ()=>{
    const meta = document.querySelector('meta[name="color-scheme"]');
    const current = meta.getAttribute('content');
    meta.setAttribute('content', current.includes('dark')? 'light dark' : 'dark light');
    document.body.animate([{opacity:.8},{opacity:1}], {duration:200, easing:'ease-out'});
  })
}

async function start(){
  if (document.getElementById('products')){
    await flattenProducts();
    mountFilters();
    renderProducts();
  }
  renderCart();        
  mountThemeToggle();
  mountFooter();
  syncFooterHeight();
}


document.addEventListener('DOMContentLoaded', start);
window.addEventListener('resize', syncFooterHeight);
