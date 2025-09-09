// assets/cart_count.js
(function(){
  const API_BASE = localStorage.getItem('API_BASE') || 'http://127.0.0.1:8000';

  function setCartCount(n){
    document.querySelectorAll('#cartCount').forEach(el => el.textContent = n);
  }

  function getLocalCount(){
    try { return (JSON.parse(localStorage.getItem('cart')||'[]')||[]).length; }
    catch { return 0; }
  }

  async function ensureCartId(){
    let id = localStorage.getItem('cart_id');
    if (!id){
      const r = await fetch(`${API_BASE}/carts/`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nazwa: 'Koszyk' })
      });
      if (!r.ok) throw new Error('cart create failed');
      const cart = await r.json();
      id = cart.id_koszyka;
      localStorage.setItem('cart_id', id);
    }
    return +id;
  }

  async function getApiCount(){
    const id = await ensureCartId();
    // pobierz cały koszyk i policz ilości
    const r = await fetch(`${API_BASE}/carts/${id}`, { headers:{'Accept':'application/json'} });
    if (!r.ok) throw new Error('HTTP '+r.status);
    const data = await r.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.reduce((sum, it) => sum + (it.ilosc ?? 1), 0);
  }

  async function refreshBadge(){
    try { setCartCount(await getApiCount()); }
    catch { setCartCount(getLocalCount()); } // fallback lokalny
  }

  
  window.updateCartBadge = refreshBadge;

  document.addEventListener('DOMContentLoaded', refreshBadge);
})();