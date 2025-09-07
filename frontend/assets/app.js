const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('cart')||'[]'),
  builder: { CPU:null, Motherboard:null, RAM:null, GPU:null, PSU:null, Case:null, Storage:null },
  filterType:'all',
  query:'',
  featuredIds: [],
  page: 1,
  pageSize: 8,
       
};

const API_BASE = localStorage.getItem('API_BASE') || 'http://127.0.0.1:8000';
// Przykład zmiany na szybko w konsoli przeglądarki:
// localStorage.setItem('API_BASE', 'http://localhost:8000'); location.reload();
const fmtPL = new Intl.NumberFormat('pl-PL', { style:'currency', currency:'PLN' });
function saveCart(){ localStorage.setItem('cart', JSON.stringify(state.cart)); }

async function fetchJSON(url, opts){
  const r = await fetch(url, {headers:{'Content-Type':'application/json'}, ...opts});
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}: ${text}`);
  return text ? JSON.parse(text) : null;
}

function yesNo(v){
  // '1'/'0', 't'/'f', 'y'/'n'
  if (v === true || v === '1' || v === 't' || v === 'T' || v === 'Y' || v === 'y') return 'Tak';
  return 'Nie';
}
function fmtClock(mhz){
  if (mhz == null) return null;
  return mhz >= 1000 ? `${(mhz/1000).toFixed(2)} GHz` : `${mhz} MHz`;
}


async function flattenProducts(){
  const status = document.getElementById('status');
  if (status) status.textContent = 'Ładowanie...';

 
  const paths = [
    '/products/gpu-joined',
    '/products/cpu-joined',
    '/products/mobo-joined',
    '/products/ram-joined',
    '/products/psu-joined',
    '/products/case-joined',
    '/products/storage-joined',
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

  chips.forEach(ch => ch.addEventListener('click', () => {
    // UI aktywnego chipa
    chips.forEach(c => c.classList.remove('active'));
    ch.classList.add('active');

    // zmiana filtra + RESET paginacji
    state.filterType = ch.dataset.type;
    state.page = 1; // <= ważne!

    // PRZED listą zdecyduj, czy pokazywać sekcję "Teraz na topie"
    renderFeatured();

    // odśwież produkty (paginacja wykorzysta state.page)
    renderProducts();

    // opcjonalnie przewiń do katalogu, gdy to nie jest "Wszystko"
    if (state.filterType !== 'all'){
      document.getElementById('listTitle')?.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  }));

  // Wyszukiwarka: reset strony i odśwież
  const q = document.getElementById('q');
  if (q){
    q.addEventListener('input', e => {
      state.query = e.target.value.toLowerCase();
      state.page = 1;        // <= ważne przy nowym zapytaniu
      renderFeatured();      // jeśli filtr != all, ukryje sekcję
      renderProducts();
    });
  }
}

function renderProducts(){
  // sekcja featured ma własną logikę widoczności
  renderFeatured();

  const grid = document.getElementById('products');
  grid.innerHTML='';

  // filtrowanie
  const base = state.products.filter(p=>{
  const typeOk = state.filterType==='all' || p.type===state.filterType;
  const qOk = !state.query || `${p.name} ${p.type}`.toLowerCase().includes(state.query);
  const notFeatured = state.filterType !== 'all' || !(state.featuredIds||[]).includes(p.id);
  return typeOk && qOk && notFeatured;
});


  
  const end = state.page * state.pageSize;     
  const slice = base;

  const tpl = document.getElementById('tplProduct');
  for (const p of slice){
    const node = tpl.content.cloneNode(true);
    node.querySelector('.title').textContent = p.name;
    node.querySelector('.price').textContent = fmtPL.format(p.price || 0);
    node.querySelector('.meta').textContent = metaFor(p);
    node.querySelector('[data-add-single]').addEventListener('click', ()=> addToCart(p));
    node.querySelector('[data-to-builder]').addEventListener('click', ()=> toBuilder(p));
    grid.appendChild(node);
  }





if (state.filterType !== 'all'){
  document.getElementById('listTitle')?.scrollIntoView({behavior:'smooth', block:'start'});
}
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

function computeFeatured(){
  // Preferuj GPU; gdyby było ich mało, bierz cały pool
  let pool = state.products.filter(p => p.type === 'GPU');
  if (pool.length < 5) pool = state.products.slice();

  // Najdroższy jako BIG + kilka następnych
  const sorted = pool.slice().sort((a,b)=>(b.price||0)-(a.price||0));
  const picks = [sorted[0], ...sorted.slice(1,5)].filter(Boolean);
  state.featuredIds = picks.map(p => p.id);
  return picks;
}


function renderFeatured(){
  const wrap = document.getElementById('featuredGrid');
  const section = wrap?.closest('.card');
  if (!wrap || !section) return;

  // Tylko dla „Wszystko”
  if (state.filterType !== 'all') {
    section.style.display = 'none';
    state.featuredIds = [];
    return;
  } else {
    section.style.display = '';
  }

  const picks = computeFeatured();
  wrap.innerHTML = '';
  picks.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'featured-card ' + (idx===0 ? 'big' : ['s1','s2','s3','s4'][idx-1] || 's1');
    card.innerHTML = `
      <div class="row-flex">
        <div class="featured-title">${p.name}</div>
        <span class="space"></span>
        <strong>${fmtPL.format(p.price||0)}</strong>
      </div>
      <div class="featured-meta">${metaFor(p)}</div>
      <div class="featured-actions">
        <button class="btn" data-fadd>Do koszyka</button>
        <button class="btn" data-fbuilder>Do kreatora</button>
      </div>
    `;
    card.querySelector('[data-fadd]').addEventListener('click', ()=> addToCart(p));
    card.querySelector('[data-fbuilder]').addEventListener('click', ()=> toBuilder(p));
    wrap.appendChild(card);
  });
}


function metaFor(p){
  switch(p.type){
    case 'CPU': {
      const parts = [];
      if (p.socket) parts.push(`Socket ${p.socket}`);
      if (p.cores || p.threads) parts.push(`${p.cores||'?'} Rdzeni/${p.threads||'?'} Wątków`);
      if (p.clock != null) parts.push(fmtClock(p.clock));
      if (p.tdp != null) parts.push(`TDP ${p.tdp}W`);
      if (p.cooler != null) parts.push(`Chłodzenie: ${yesNo(p.cooler)}`);
      if (p.oc != null) parts.push(`OC: ${yesNo(p.oc)}`);
      if (p.integra != null) parts.push(`iGPU: ${yesNo(p.integra)}`);
      return parts.join(', ');
    }
      case 'Motherboard': {
        const parts = [];
            if (p.socket) parts.push(`Socket ${p.socket}`);
            if (p.ramType) parts.push(`RAM ${p.ramType}`);
            if (p.formFactor) parts.push(p.formFactor);
            if (p.ramSlots != null) parts.push(`RAM slots x${p.ramSlots}`);
            if (p.m2 != null) parts.push(`M.2 x${p.m2}`);
            if (p.pcie16 != null) parts.push(`PCIe x16 x${p.pcie16}`);
            if (p.usb3 != null) parts.push(`USB 3.0 x${p.usb3}`);
            if (p.usbC != null) parts.push(`USB-C x${p.usbC}`);
            if (p.wifi != null) parts.push(`Wi-Fi: ${p.wifi?'tak':'nie'}`);
            if (p.oc != null) parts.push(`OC: ${p.oc?'tak':'nie'}`);
            return parts.join(', ');
            }
        case 'RAM': {
          const parts = [];
          if (p.size) parts.push(`${p.size}GB`);
          if (p.modules) parts.push(`${p.modules}x${p.perModule||'?'}GB`);
          if (p.ramType) parts.push(p.ramType);
          if (p.mhz) parts.push(`${p.mhz}MHz`);
          if (p.cl) parts.push(`CL${p.cl}`);
          return parts.join(', ');
          }

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
        case 'PSU': {
          const parts = [];
          if (p.watt) parts.push(`${p.watt}W`);
          if (p.modular) parts.push(p.modular);   
          if (p.cert) parts.push(p.cert);
          return parts.join(', ');
        }

        case 'Case': {
          const parts = [];
          if (p.gpuMax) parts.push(`GPU max ${p.gpuMax}mm`);
          if (p.formFactor) parts.push(p.formFactor);
          if (p.fans != null) parts.push(`went. x${p.fans}`);
          return parts.join(', ');
        }

          case 'Storage': {
            const parts = [];
            if (p.medium) parts.push(p.medium);
            if (p.formFactor) parts.push(p.formFactor);
            if (p.iface) parts.push(p.iface);
            if (p.sizeGB) parts.push(`${p.sizeGB}GB`);
            if (p.readMBs && p.writeMBs) parts.push(`${p.readMBs}/${p.writeMBs} Mb/s`);
            return parts.join(', ');
    }

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
async function ensureCartId(){
  let id = localStorage.getItem('cartId');
  if (id) return +id;
  const data = await fetchJSON(`${API_BASE}/carts/`, { method:'POST', body: JSON.stringify({}) });
  localStorage.setItem('cartId', data.id_koszyka);
  return data.id_koszyka;
}

function removeFromCart(index){
  state.cart.splice(index,1);
  saveCart(); renderCart();
}

async function ensureCartId(){
  let id = localStorage.getItem('cart_id');
  if (!id){
    const cart = await fetchJSON(`${API_BASE}/carts/`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ nazwa: 'Koszyk' })
    });
    id = cart.id_koszyka;
    localStorage.setItem('cart_id', id);
  }
  return id;
}

async function addToCart(p){
  try{
    const cartId = await ensureCartId();
    await fetchJSON(`${API_BASE}/carts/${cartId}/items`, {
      method:'POST',
      body: JSON.stringify({ produkty_id_prod: p.id, ilosc: 1 })
    });
    // opcjonalnie: pokaż powiadomienie
  }catch(e){
    console.error('addToCart failed:', e);
    alert('Nie udało się dodać do koszyka:\n' + e.message);
  }
}

async function renderCart(){
  const list = document.getElementById('cartList');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  if (!list) return;

  try {
    const cartId = await ensureCartId();
    const cart = await fetchJSON(`${API_BASE}/carts/${cartId}`);

    list.innerHTML = '';
    let count = 0;

    cart.items.forEach(it=>{
      count += it.ilosc;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div>
          <strong>${it.nazwa}</strong> <span class="muted">${it.typ}</span>
        </div>
        <div>${fmtPL.format(it.cena)} × ${it.ilosc} = ${fmtPL.format(it.suma)}</div>
      `;
      // szybkie usuwanie pozycji (double click)
      row.addEventListener('dblclick', async ()=>{
        await fetchJSON(`${API_BASE}/carts/${cartId}/items/${it.product_id}`, { method:'DELETE' });
        renderCart();
      });
      list.appendChild(row);
    });

    if (totalEl) totalEl.textContent = fmtPL.format(cart.total);
    if (countEl) countEl.textContent = count;

  } catch (e) {
    console.error('renderCart failed:', e);
  }
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
  await renderCart(); 
  mountThemeToggle();
  mountFooter();
  syncFooterHeight();
}



document.addEventListener('DOMContentLoaded', start);
window.addEventListener('resize', syncFooterHeight);
