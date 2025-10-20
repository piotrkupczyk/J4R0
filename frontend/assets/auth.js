const API_BASE = localStorage.getItem('API_BASE') || 'http://127.0.0.1:8000';

async function postJSON(url, body){
  const r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  if (!r.ok){
    const txt = await r.text().catch(()=> '');
    throw new Error(`${r.status} ${r.statusText} – ${txt}`);
  }
  return r.json();
}

function info(msg){ document.getElementById('msg').textContent = msg; }

async function onRegister(){
  try{
    const payload = {
      imie:      document.getElementById('imie').value || null,
      nazwisko:  document.getElementById('nazwisko').value || null,
      email:     document.getElementById('email').value,
      telefon:   document.getElementById('telefon').value || null,
      adres:     document.getElementById('adres').value || null,
      password:  document.getElementById('password').value,
    };
    const user = await postJSON(`${API_BASE}/auth/register`, payload);
    localStorage.setItem('user_id', user.id_klienta);
    localStorage.setItem('user_email', user.email);
    info(`Konto utworzone dla: ${user.email}`);
  }catch(e){ info(`Rejestracja nie powiodła się: ${e.message}`); }
}

async function onLogin(){
  try{
    const payload = {
      email:    document.getElementById('login_email').value,
      password: document.getElementById('login_password').value,
    };
    const res = await postJSON(`${API_BASE}/auth/login`, payload);
    localStorage.setItem('user_id', res.id_klienta);
    localStorage.setItem('user_email', res.email);
    info(`Zalogowano: ${res.email}`);
  }catch(e){ info(`Logowanie nie powiodło się: ${e.message}`); }
}

document.getElementById('btnRegister')?.addEventListener('click', onRegister);
document.getElementById('btnLogin')?.addEventListener('click', onLogin);
