window.API_BASE = localStorage.getItem('API_BASE') || 'http://127.0.0.1:8000';


function loadCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
 
  window.dispatchEvent(new CustomEvent('cart:changed', { detail: { count: cart.reduce((s,i)=>s+(i.qty||1),0) } }));
}

function addToCart(productId, qty = 1, meta = {}) {
  const cart = loadCart();
  const idx = cart.findIndex(i => i.id === productId);
  if (idx >= 0) cart[idx].qty = (cart[idx].qty || 1) + qty;
  else cart.push({ id: productId, qty, ...meta });
  saveCart(cart);
  return cart;
}


window.J4R0Bridge = {
  API_BASE: window.API_BASE,
  addToCart,
  getCart: loadCart,
  onCartChange(handler) { window.addEventListener('cart:changed', handler); }
};