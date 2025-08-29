
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

const fmtPL = new Intl.NumberFormat('pl-PL', { style:'currency', currency:'PLN' });
function saveCart(){ localStorage.setItem('cart', JSON.stringify(state.cart)); }

/**********************
 * Inicjalizacja
 **********************/
function flattenProducts(){
  state.products = Object.values(MOCK).flat();
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
    case 'CPU': return `Socket ${p.socket}, TDP ${p.tdp}W`;
    case 'Motherboard': return `Socket ${p.socket}, RAM ${p.ramType}`;
    case 'RAM': return `${p.size}GB ${p.ramType}`;
    case 'GPU': return `TDP ${p.tdp}W, długość ${p.length}mm`;
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

function start(){
  if (document.getElementById('products')){
    flattenProducts();
    mountFilters();
    renderProducts();
  }
  mountThemeToggle();
  mountFooter();
  syncFooterHeight();
}

document.addEventListener('DOMContentLoaded', start);
window.addEventListener('resize', syncFooterHeight);
