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

// localStorage.setItem('API_BASE', 'http://localhost:8000'); location.reload();
const fmtPL = new Intl.NumberFormat('pl-PL', { style:'currency', currency:'PLN' });

/* funkcja odpowiedzialna za zapisanie koszyka w localStorage */
function saveCart(){ localStorage.setItem('cart', JSON.stringify(state.cart)); }

/* funkcja odpowiedzialna za pobranie danych JSON z API */
async function fetchJSON(url, opts){
  const r = await fetch(url, {headers:{'Content-Type':'application/json'}, ...opts});
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}: ${text}`);
  return text ? JSON.parse(text) : null;
}

/* funkcja odpowiedzialna za konwersję wartości na Tak/Nie */
function yesNo(v){
  // '1'/'0', 't'/'f', 'y'/'n'
  if (v === true || v === '1' || v === 't' || v === 'T' || v === 'Y' || v === 'y') return 'Tak';
  return 'Nie';
}

/* funkcja odpowiedzialna za formatowanie częstotliwości w GHz/MHz */
function fmtClock(mhz){
  if (mhz == null) return null;
  return mhz >= 1000 ? `${(mhz/1000).toFixed(2)} GHz` : `${mhz} MHz`;
}

/* funkcja odpowiedzialna za pobranie i scalenie list produktów z API */
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
    '/products/cooler-joined',
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

/* funkcja odpowiedzialna za podłączenie filtrów i wyszukiwarki */
function mountFilters(){
  const chips = document.querySelectorAll('#typeChips .chip');

  chips.forEach(ch => ch.addEventListener('click', () => {
    // UI aktywnego chipa
    chips.forEach(c => c.classList.remove('active'));
    ch.classList.add('active');

    // zmiana filtra + RESET 
    state.filterType = ch.dataset.type;
    state.page = 1; // <= ważne!

    // przed lista decyzja czy pokazywać sekcję "Teraz na topie"
    renderFeatured();

    // refresh produkty 
    renderProducts();

    // opcjonalnie do katalogu, gdy to nie jest "Wszystko"
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
  renderFeatured();

  const grid = document.getElementById('products');
  grid.innerHTML = '';

  // filtrowanie
  const base = state.products.filter(p => {
    const typeOk = state.filterType === 'all' || p.type === state.filterType;
    const qOk = !state.query || `${p.name} ${p.type}`.toLowerCase().includes(state.query);
    const notFeatured = state.filterType !== 'all' || !(state.featuredIds || []).includes(p.id);
    return typeOk && qOk && notFeatured;
  });

  
  const slice = base; 

  const tpl = document.getElementById('tplProduct');
  for (const p of slice){
    const node = tpl.content.cloneNode(true);
    node.querySelector('.title').textContent = p.name;
    node.querySelector('.price').textContent = fmtPL.format(p.price || 0);

    
    const metaEl = node.querySelector('.meta');
    const meta = metaFor(p);
    if (meta && meta.includes('<')) metaEl.innerHTML = meta;
    else metaEl.textContent = meta;

    node.querySelector('[data-add-single]').addEventListener('click', ()=> addToCart(p));
    node.querySelector('[data-to-builder]').addEventListener('click', ()=> toBuilder(p));
    grid.appendChild(node);
  }

  
  if (state.filterType !== 'all'){
    document.getElementById('listTitle')?.scrollIntoView({ behavior:'smooth', block:'start' });
  }
}

/* funkcja odpowiedzialna za wytypowanie pozycji "na topie" */
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

/* funkcja odpowiedzialna za render sekcji "Teraz na topie" */
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


// ===== Pomocniki
const line = (label, value) =>
  (value !== undefined && value !== null && value !== '')
    ? `<div>${label}: ${value}</div>` : '';

const xqty = (label, n) =>
  (n !== undefined && n !== null) ? `<div>${label}: x${n}</div>` : '';

// ===== Opisy
function metaFor(p){
  switch (p.type) {

    case 'CPU': {
      const parts = [];
      parts.push(line('Socket', p.socket));
      if (p.cores || p.threads) parts.push(line('Rdzenie/Wątki', `${p.cores ?? '?'}/${p.threads ?? '?'}`));
      if (p.clock != null)      parts.push(line('Taktowanie', fmtClock(p.clock)));
      if (p.tdp != null)        parts.push(line('TDP', `${p.tdp} W`));
      if (p.cooler != null)     parts.push(line('Chłodzenie', yesNo(p.cooler)));
      if (p.oc != null)         parts.push(line('OC', yesNo(p.oc)));
      if (p.integra != null)    parts.push(line('iGPU', yesNo(p.integra)));
      return parts.join('');
    }

    case 'Motherboard': {
      const parts = [];
      parts.push(line('Socket', p.socket));
      parts.push(line('Format', p.formFactor));
      parts.push(line('Pamięć RAM', p.ramType));
      parts.push(xqty('Sloty RAM', p.ramSlots));
      parts.push(xqty('M.2', p.m2));
      parts.push(xqty('PCIe x16', p.pcie16));
      parts.push(xqty('USB 3.0', p.usb3));
      parts.push(xqty('USB-C', p.usbC));
      if (p.wifi != null) parts.push(line('Wi-Fi', p.wifi ? 'Tak' : 'Nie'));
      if (p.oc != null)   parts.push(line('OC', p.oc ? 'Tak' : 'Nie'));
      return parts.join('');
    }

    case 'RAM': {
      const parts = [];
      if (p.size)               parts.push(line('Pojemność', `${p.size} GB`));
      if (p.modules && p.perModule)
                                parts.push(line('Konfiguracja', `${p.modules}×${p.perModule} GB`));
      else                      parts.push(xqty('Moduły', p.modules));
      parts.push(line('Typ', p.ramType));
      if (p.mhz)                parts.push(line('Taktowanie', `${p.mhz} MHz`));
      if (p.cl)                 parts.push(line('Opóźnienie', `CL${p.cl}`));
      return parts.join('');
    }

    case 'GPU': {
      const parts = [];
      parts.push(line('Chipset', p.chipset));
      if (p.vram)               parts.push(line('VRAM', `${p.vram} GB`));
      parts.push(line('Pamięć', p.gddr));
      if (p.tdp != null)        parts.push(line('TDP', `${p.tdp} W`));
      if (p.length)             parts.push(line('Długość', `${p.length} mm`));
      parts.push(xqty('HDMI', p.hdmi));
      parts.push(xqty('DisplayPort', p.dp));
      return parts.join('');
    }

    case 'PSU': {
      const parts = [];
      if (p.watt)               parts.push(line('Moc', `${p.watt} W`));
      // próbujemy ładnie nazwać modularność; jeśli masz inne wartości – zostawimy surową
      let modular = p.modular;
      if (typeof modular === 'string') {
        const m = modular.toLowerCase();
        if (m.includes('full')) modular = 'W pełni modularny';
        else if (m.includes('semi')) modular = 'Pół-modularny';
        else if (m.includes('non') || m.includes('fixed')) modular = 'Niemodularny';
      }
      parts.push(line('Modularność', modular));
      parts.push(line('Certyfikat', p.cert)); // np. 80+ Gold
      return parts.join('');
    }

    case 'Case': {
      const parts = [];
      if (p.gpuMax)             parts.push(line('Maks. długość GPU', `${p.gpuMax} mm`));
      parts.push(line('Format', p.formFactor));
      parts.push(xqty('Wentylatory', p.fans));
      return parts.join('');
    }

    case 'Storage': {
      const parts = [];
      parts.push(line('Nośnik', p.medium));         // SSD/HDD
      parts.push(line('Format', p.formFactor));     // 2.5", M.2, 3.5"
      parts.push(line('Interfejs', p.iface));       // SATA/NVMe/PCIe
      if (p.sizeGB)             parts.push(line('Pojemność', `${p.sizeGB} GB`));
      if (p.readMBs && p.writeMBs)
                                parts.push(line('Odczyt/Zapis', `${p.readMBs}/${p.writeMBs} MB/s`));
      return parts.join('');
    }

    case 'Cooler': {
      const parts = [];
      // Rodzaj
      if (p.cooler_type){
        let rodzaj;
        switch (String(p.cooler_type).toLowerCase()){
          case 'powietrze': rodzaj = 'Chłodzenie powietrzem'; break;
          case 'aio':       rodzaj = 'Chłodzenie all in one'; break;
          case 'wodne':     rodzaj = 'Chłodzenie wodne'; break;
          default:          rodzaj = p.cooler_type;
        }
        parts.push(line('Rodzaj', rodzaj));
      }
      if (p.height)             parts.push(line('Wysokość', `${p.height} mm`));
      parts.push(xqty('Wentylatory', p.fans));
      if (Array.isArray(p.sockets) && p.sockets.length)
                                parts.push(line('Wspierane sockety', p.sockets.join('/')));
      if (p.rgb != null)        parts.push(line('RGB', p.rgb ? 'Tak' : 'Nie'));
      if (p.profile != null)    parts.push(line('Profil', Number(p.profile) === 0 ? 'Low profile' : 'High profile'));
      return parts.join('');
    }
    
    default:
      return '';
  }
}



/* funkcja odpowiedzialna za przekierowanie produktu do kreatora */
function toBuilder(p){
  // zapamiętaj wybór w sessionStorage, odbierz na builder.html jeśli chcesz
  sessionStorage.setItem('preselect', JSON.stringify(p));
  location.href = 'builder.html';
}

/**********************
 * Koszyk
 **********************/


/* funkcja odpowiedzialna za usuwanie pozycji z koszyka po indeksie (frontend) */
function removeFromCart(index){
  try{
    const removed = state.cart[index];
    state.cart.splice(index,1);
    saveCart?.(); 
    renderCart?.();

    updateCartBadge?.();
    toast(removed?.nazwa? `Usunięto: ${removed.nazwa} 🗑️` : 'Usunięto z koszyka 🗑️', 'success');
  }catch(e){
    console.warn('removeFromCart error:', e);
    toast('Nie udało się usunąć z koszyka ❌', 'error', 3000);
  }
}

/* funkcja odpowiedzialna za uzyskanie/utworzenie ID koszyka (wersja 2) */
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
  return +id;
}

/* funkcja odpowiedzialna za dodanie produktu do koszyka (backend) */
async function addToCart(p){
  try{
    const cartId = await ensureCartId();
    await fetchJSON(`${API_BASE}/carts/${cartId}/items`, {
      method:'POST',
      body: JSON.stringify({ produkty_id_prod: p.id, ilosc: 1 })
    });
    updateCartBadge?.();
    toast('Dodano do koszyka ✅', 'success');
  }catch(e){
    console.error('addToCart failed:', e);
    toast('Nie udało się dodać do koszyka ❌', 'error', 3000);
  }
}

/* funkcja odpowiedzialna za wyrenderowanie koszyka (pobranie z backendu) */
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

    (cart.items || []).forEach(it => {
      count += it.ilosc;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.dataset.name = it.nazwa;   
      row.dataset.pid  = it.product_id; 

      row.innerHTML = `
        <div class="cart-left">
          <strong>${it.nazwa}</strong> <span class="muted">${(it.typ||'').toUpperCase()}</span><br/>
          <span class="muted">${fmtPL.format(it.cena)} × ${it.ilosc} = ${fmtPL.format(it.suma)}</span>
        </div>
        <button class="btn danger cart-remove" data-rm data-pid="${it.product_id}">Usuń</button>
      `;

      list.appendChild(row);
    });

    if (totalEl) totalEl.textContent = fmtPL.format(cart.total || 0);
    if (countEl) countEl.textContent = count;

  } catch (e) {
    console.error('renderCart failed:', e);
  }
}


/* funkcja monitorująca koszyk*/

function mountCartActions(){
  const clearBtn = document.getElementById('clearCartBtn')
               || document.querySelector('[data-clear-cart]');
  if (clearBtn) {
    
    clearBtn.replaceWith(clearBtn.cloneNode(true));
    const fresh = document.getElementById('clearCartBtn')
               || document.querySelector('[data-clear-cart]');
    fresh.addEventListener('click', onClearCart);
  }
}

function toast(message, type='success', timeout=1800){
  let host = document.getElementById('toastHost');
  if (!host){
    host = document.createElement('div');
    host.id = 'toastHost';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span class="msg">${message}</span>
    <button class="close" aria-label="Zamknij">×</button>
  `;
  el.querySelector('.close').addEventListener('click', ()=> el.remove());
  host.appendChild(el);
  if (timeout){
    setTimeout(()=> el.remove(), timeout);
  }
}
/*funkcja odpowiedzialna za guzik wyczysc koszyk */

async function clearCartServer(){
  const cartId = await ensureCartId();
  const r = await fetch(`${API_BASE}/carts/${cartId}/items`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`clearCart failed: ${r.status}`);
}


async function onClearCart(){
  try {
    await clearCartServer();
    state.cart = [];           // zeruj podgląd
    saveCart();
    renderCart();
    
  } catch (e) {
    console.warn(e); alert('Nie udało się wyczyścić koszyka.');
  }
}
(document.getElementById('clearCartBtn') || document.querySelector('[data-clear-cart]'))
  ?.addEventListener('click', onClearCart);



function wireCartItemActions(){
  document.addEventListener('click', async (e)=>{
    const btn = e.target.closest('[data-rm]');
    if (!btn) return;

    e.preventDefault();
    const row = btn.closest('.cart-item');
    const name = row?.dataset?.name || 'Pozycja';

    try {
      const cartId = await ensureCartId();
      const pid = +btn.dataset.pid;
      await fetchJSON(`${API_BASE}/carts/${cartId}/items/${pid}`, { method:'DELETE' });

      toast(`Usunięto: ${name} 🗑️`, 'success');   // ⬅️ TOAST
      await renderCart();
    } catch (err) {
      console.error(err);
      toast('Nie udało się usunąć pozycji ❌', 'error', 3000);  // ⬅️ TOAST (błąd)
    }
  });
}



function wireClearCartButton(){
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('#clearCartBtn,[data-clear-cart]');
    if (!btn) return;

    e.preventDefault();

    // 1) najpierw spróbuj wyczyścić po API
    try {
      const cartId = await ensureCartId();
      const r = await fetch(`${API_BASE}/carts/${cartId}/items`, { method: 'DELETE' });
      if (!r.ok) throw new Error(`clearCart failed: ${r.status}`);

      // lokalny stan
      state.cart = [];
      saveCart?.();

      // sukces – pokaż od razu
      toast('Koszyk wyczyszczony 🧹', 'success');
    } catch (err) {
      console.error(err);
      toast('Nie udało się wyczyścić koszyka ❌', 'error', 3000);
      return; 
    }

    
    try { await renderCart?.(); } catch (e) { console.warn('renderCart() failed:', e); }
    try { updateCartBadge?.(); } catch (e) { console.warn('updateCartBadge() failed:', e); }
  });
}

async function removeCartItem(productId){
  const cartId = await ensureCartId();
  const r = await fetch(`${API_BASE}/carts/${cartId}/items/${productId}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`removeCartItem failed: ${r.status}`);
}
/**********************
 * Stopka
 **********************/


/* funkcja odpowiedzialna za synchronizację wysokości stopki w CSS */
function syncFooterHeight(){
  const footer = document.getElementById('siteFooter') || document.querySelector('footer');
  if (!footer) return;
  const h = footer.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--footer-h', Math.ceil(h) + 'px');
}

/* funkcja odpowiedzialna za obsługę przycisku rozwijania stopki */
function mountFooter(){
  const footer = document.getElementById('siteFooter') || document.querySelector('footer');
  const btn = document.getElementById('aboutToggle');
  if (!footer || !btn) return;

  btn.addEventListener('click', () => {
    footer.classList.toggle('open');
    btn.classList.toggle('open-btn');
    requestAnimationFrame(syncFooterHeight);
  });
}


/* funkcja odpowiedzialna za przełączanie motywu (light/dark) */
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



/* funkcja odpowiedzialna za inicjalizację aplikacji po załadowaniu DOM */
async function start(){
  if (document.getElementById('products')){
    await flattenProducts();
    mountFilters();
    renderProducts();
  }
   await renderCart();
   wireCartItemActions();   
   wireClearCartButton();   
  
  mountThemeToggle();
  mountFooter();
  syncFooterHeight();
}

document.addEventListener('DOMContentLoaded', start);
window.addEventListener('resize', syncFooterHeight);



