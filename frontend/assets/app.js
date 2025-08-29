
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
 * Builder
 **********************/
function mountBuilder(){
  // wypełnij selecty
  fillSelect('selCPU', MOCK.CPU);
  fillSelect('selMB', MOCK.Motherboard);
  fillSelect('selRAM', MOCK.RAM);
  fillSelect('selGPU', MOCK.GPU);
  fillSelect('selPSU', MOCK.PSU);
  fillSelect('selCase', MOCK.Case);
  fillSelect('selStorage', MOCK.Storage);

  document.querySelectorAll('[data-add]').forEach(btn=>{
    btn.addEventListener('click',()=>{ syncFooterHeight(); 
      const type = btn.getAttribute('data-add');
      const sel = document.getElementById('sel'+(type==='Motherboard'?'MB':type));
      const id = sel.value;
      const item = [...MOCK[type]].find(x=>x.id===id);
      state.builder[type] = item || null;
      updateCompatUI();
    })
  })

  document.getElementById('addSet').addEventListener('click', ()=>{
    const parts = Object.values(state.builder).filter(Boolean);
    if (!parts.length) return;
    const setItem = { id: 'set-'+Date.now(), type:'SET', name:'Zestaw (kreator)', items:parts, price: parts.reduce((s,x)=>s+x.price,0) };
    addToCart(setItem);
  })
}

function fillSelect(id, items){
  const sel = document.getElementById(id);
  sel.innerHTML = items.map(i=>`<option value="${i.id}">${i.name} – ${fmtPL.format(i.price)}</option>`).join('');
}

function toBuilder(p){
  state.builder[p.type] = p;
  const map = {CPU:'selCPU', Motherboard:'selMB', RAM:'selRAM', GPU:'selGPU', PSU:'selPSU', Case:'selCase', Storage:'selStorage'};
  const selId = map[p.type];
  if (selId){
    const sel = document.getElementById(selId);
    if (sel) sel.value = p.id;
  }
  updateCompatUI();
  document.getElementById('builder').scrollIntoView({behavior:'smooth'});
}

function updateCompatUI(){
  const { ok, msgs } = checkCompatibilityState(state.builder);
  const dot = document.getElementById('compatDot');
  const text = document.getElementById('compatText');
  dot.className = 'dot ' + (ok? 'ok' : 'bad');
  text.textContent = ok ? 'Zestaw kompatybilny ✅' : `Problemy: ${ msgs.join(' • ') }`;
  return ok;
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
  list.innerHTML='';
  let total = 0;
  state.cart.forEach((it, idx)=>{
    const row = document.createElement('div');
    row.className = 'cart-item';
    const title = document.createElement('div');
    title.innerHTML = `<strong>${it.name}</strong> <span class="muted">${it.type}</span>`;
    if (it.type==='SET'){
      const ul = document.createElement('ul'); ul.className='muted'; ul.style.margin='6px 0 0 18px';
      it.items.forEach(p=>{
        const li=document.createElement('li'); li.textContent = `${p.type}: ${p.name}`; ul.appendChild(li);
      })
      title.appendChild(ul);
    }
    const price = document.createElement('div'); price.textContent = fmtPL.format(it.price);
    row.appendChild(title); row.appendChild(price);
    row.addEventListener('dblclick', ()=> removeFromCart(idx));
    list.appendChild(row);
    total += it.price;
  })
  document.getElementById('cartTotal').textContent = fmtPL.format(total);
  document.getElementById('cartCount').textContent = state.cart.length;
}

/**********************
 * Motyw + Footer + Checkout
 **********************/
function mountThemeToggle(){
  const btn = document.getElementById('themeToggle');
  btn.addEventListener('click', ()=>{
    const meta = document.querySelector('meta[name="color-scheme"]');
    const current = meta.getAttribute('content');
    meta.setAttribute('content', current.includes('dark')? 'light dark' : 'dark light');
    document.body.animate([{opacity:.8},{opacity:1}], {duration:200, easing:'ease-out'});
  })
}


function syncFooterHeight(){
  const footer = document.querySelector('footer');
  if (!footer) return;
  const h = footer.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--footer-h', Math.ceil(h) + 'px');
}

function mountFooter(){
  const btn = document.getElementById('aboutToggle');
  const cont = document.getElementById('aboutContent');
  const footer = document.querySelector('footer');
  btn.addEventListener('click',()=>{ syncFooterHeight(); 
    footer.classList.toggle('open');
    btn.classList.toggle('open-btn');
    syncFooterHeight();
    syncFooterHeight();
  })
}

function mountCheckout(){
  document.getElementById('clearCart').addEventListener('click', ()=>{ state.cart=[]; saveCart(); renderCart(); })
  document.getElementById('checkout').addEventListener('click', ()=>{
    alert('Checkout demo. Tu podłączymy endpoint zamówienia.');
  })
}

/**********************
 * Start
 **********************/
function start(){
  flattenProducts();
  mountFilters();
  renderProducts();
  mountBuilder();
  mountThemeToggle();
  mountCheckout();
  renderCart();
  mountFooter();
}

document.addEventListener('DOMContentLoaded', ()=>{ start(); syncFooterHeight(); });

window.addEventListener('resize', syncFooterHeight);
