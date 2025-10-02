
function togglePassword(id, el){
  const input = document.getElementById(id);
  if(!input) return;
  if(input.type === 'password'){ input.type = 'text'; el.textContent = '🙈'; }
  else { input.type = 'password'; el.textContent = '👁️'; }
}

function isValidEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function showFormMessage(elementId, message, isSuccess = false) {
  const msg = document.getElementById(elementId);
  if (!msg) return;
  
  msg.innerText = message;
  if (isSuccess) {
    msg.style.background = 'rgba(16, 185, 129, 0.9)'; // Success green
  } else {
    msg.style.background = 'rgba(0, 0, 0, 0.6)'; // Default dark
  }
}

function handleRegister(){
  const email = document.getElementById('regEmail').value?.trim();
  const pw = document.getElementById('regPassword').value || '';
  const msgId = 'registerMsg';
  
  showFormMessage(msgId, ''); // Clear message
  
  if(!email) {
    showFormMessage(msgId, 'Please enter your email.');
    return;
  }
  
  if(!isValidEmail(email)){ 
    showFormMessage(msgId, 'Please enter a valid email.');
    return;
  }
  
  if(!pw) {
    showFormMessage(msgId, 'Please enter a password.');
    return;
  }
  
  if(pw.length < 8){ 
    showFormMessage(msgId, 'Password must be at least 8 characters.');
    return;
  }
  
  localStorage.setItem('user_' + email, pw);
  showFormMessage(msgId, 'Registration successful! Please sign in.', true);
  setTimeout(() => showLogin(), 1500);
}

function handleLogin(){
  const email = document.getElementById('loginEmail').value?.trim();
  const pw = document.getElementById('loginPassword').value || '';
  const msgId = 'loginMsg';
  
  showFormMessage(msgId, ''); // Clear message
  
  if(!email) {
    showFormMessage(msgId, 'Please enter your email.');
    return;
  }
  
  if(!pw) {
    showFormMessage(msgId, 'Please enter your password.');
    return;
  }
  
  const stored = localStorage.getItem('user_' + email);
  if(stored && stored === pw){
    localStorage.setItem('wb_current_user', email);
    showFormMessage(msgId, 'Signed in! Redirecting...', true);
    setTimeout(() => window.location.href = 'dashboard.html', 700);
  } else {
    showFormMessage(msgId, 'Invalid email or password.');
  }
}

function showRegister(){ 
  document.getElementById('loginCard').classList.add('hidden');
  document.getElementById('registerCard').classList.remove('hidden');
}

function showLogin(){ 
  document.getElementById('registerCard').classList.add('hidden');
  document.getElementById('loginCard').classList.remove('hidden');
}

function initHamburger(){
  const ham = document.getElementById('hamburger');
  const nav = document.getElementById('topnav');
  if(!ham || !nav) return;
  
  ham.addEventListener('click', (e) => {
    e.stopPropagation();
    nav.classList.toggle('show');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !ham.contains(e.target)) {
      nav.classList.remove('show');
    }
  });

  // Prevent menu from closing when clicking inside it
  nav.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Hide menu on window resize
  window.addEventListener('resize', () => { 
    if(window.innerWidth > 900) {
      nav.classList.remove('show');
    }
  });
}

const GLOBAL_MONTHLY_LIMIT = 50000; // ZMW
const boothLocations = {"Wina1":"Lusaka CPD","Wina2":"Libala","Wina3":"Kabwata","Wina4":"Mandevu","Wina5":"Woodlands","Wina6":"Matero East"};
const boothServices = {
  "Wina1":["Airtel Money","MTN Money","Zamtel Money","Zanaco","FNB"],
  "Wina2":["Airtel Money","MTN Money","Zamtel Money","FNB"],
  "Wina3":["Airtel Money","MTN Money","Zamtel Money","Zanaco","FNB"],
  "Wina4":["Airtel Money","MTN Money","Zamtel Money"],
  "Wina5":["Airtel Money","MTN Money","Zanaco","FNB"],
  "Wina6":["Airtel Money","MTN Money","Zamtel Money"]
};
const serviceRevenue = {"Airtel Money":0.05,"MTN Money":0.06,"Zamtel Money":0.045,"Zanaco":0.035,"FNB":0.04};
const palette = ["#2563eb","#06b6d4","#f59e0b","#10b981","#ef4444","#8b5cf6"];

let transactions = [];

async function loadTransactions(){
  try{
    const resp = await fetch('data/sample_transactions.json');
    if(!resp.ok) throw new Error('no file');
    const data = await resp.json();
    transactions = Array.isArray(data) ? data.slice() : [];
  } catch(e){
    transactions = [
      {"TransactionID":"WB0000001","MobileBooth":"Wina1","Location":"Lusaka CPD","Service":"Airtel Money","RevenuePerKwacha":0.05,"TransactionAmount":964},
      {"TransactionID":"WB0000002","MobileBooth":"Wina2","Location":"Libala","Service":"MTN Money","RevenuePerKwacha":0.06,"TransactionAmount":582},
      {"TransactionID":"WB0000003","MobileBooth":"Wina3","Location":"Kabwata","Service":"Zamtel Money","RevenuePerKwacha":0.045,"TransactionAmount":349}
    ];
  }
  const added = JSON.parse(localStorage.getItem('wb_added_txns') || '[]');
  if(Array.isArray(added) && added.length) transactions = transactions.concat(added);
}

async function initDashboard(){
  await loadTransactions();
  renderSummary();
  renderTable();
  renderPieChart();
  renderBoothBar();
}

function renderSummary(){
  const totalRevenue = transactions.reduce((s,t)=> s + ((t.TransactionAmount||0)*(t.RevenuePerKwacha||serviceRevenue[t.Service]||0)), 0);
  const totalTax = transactions.reduce((s,t)=> s + ((t.TransactionAmount||0)*0.10), 0);
  const totalAmount = transactions.reduce((s,t)=> s + (t.TransactionAmount||0), 0);
  document.getElementById('totalRev').innerText = totalRevenue.toFixed(2);
  document.getElementById('txnCount').innerText = transactions.length;
  document.getElementById('totalTax').innerText = totalTax.toFixed(2);
  const remaining = Math.max(0, GLOBAL_MONTHLY_LIMIT - totalAmount);
  document.getElementById('remainingLimit').innerText = remaining.toFixed(2);
}

function renderTable(){
  const tbody = document.querySelector('#txnTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  const recent = transactions.slice(-50).reverse();
  recent.forEach(t=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${t.TransactionID||''}</td><td>${t.MobileBooth||''}</td><td>${t.Service||''}</td><td>${t.TransactionAmount||0}</td>`;
    tbody.appendChild(tr);
  });
}

let pieChart=null, barChart=null;
function renderPieChart(){
  if(!document.getElementById('servicePie')) return;
  if(!transactions.length){ if(pieChart) pieChart.destroy(); return; }
  const byService = {};
  transactions.forEach(t=>{ const s=t.Service||'Unknown'; const rev=(t.TransactionAmount||0)*(t.RevenuePerKwacha||serviceRevenue[s]||0); byService[s]=(byService[s]||0)+rev; });
  const labels=Object.keys(byService), data=labels.map(l=>byService[l]), colors=labels.map((_,i)=>palette[i%palette.length]);
  if(pieChart) pieChart.destroy();
  pieChart=new Chart(document.getElementById('servicePie').getContext('2d'),{type:'pie',data:{labels,datasets:[{data,backgroundColor:colors}]},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});
}

function renderBoothBar(){
  if(!document.getElementById('boothBar')) return;
  if(!transactions.length){ if(barChart) barChart.destroy(); return; }
  const byBooth={}; transactions.forEach(t=>{ const b=t.MobileBooth||'Unknown'; const rev=(t.TransactionAmount||0)*(t.RevenuePerKwacha||serviceRevenue[t.Service]||0); byBooth[b]=(byBooth[b]||0)+rev; });
  const labels=Object.keys(byBooth), data=labels.map(l=>byBooth[l]), colors=labels.map((_,i)=>palette[i%palette.length]);
  if(barChart) barChart.destroy();
  barChart=new Chart(document.getElementById('boothBar').getContext('2d'),{type:'bar',data:{labels,datasets:[{label:'Revenue (ZMW)',data,backgroundColor:colors}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
}

function updateLocationAndServices(){
  const b=document.getElementById('booth')?.value||''; const loc=document.getElementById('location'); const svc=document.getElementById('service');
  if(loc) loc.innerText=b?(boothLocations[b]||'-'):'-';
  if(svc){ svc.innerHTML='<option value="">-- Select --</option>'; if(b&&boothServices[b]) boothServices[b].forEach(s=> svc.innerHTML+=`<option value="${s}">${s}</option>`); }
  const rev=document.getElementById('revenue'); if(rev) rev.innerText='-';
}
function updateRevenue(){ const s=document.getElementById('service')?.value||''; const rev=document.getElementById('revenue'); if(rev) rev.innerText=s?(serviceRevenue[s]||'-'):'-'; calculateTax(); }
function calculateTax(){ const amt=parseFloat(document.getElementById('amount')?.value)||0; const tax=amt*0.10; const net=amt-tax; if(document.getElementById('tax')) document.getElementById('tax').innerText=tax.toFixed(2); if(document.getElementById('net')) document.getElementById('net').innerText=net.toFixed(2); }

function saveTransaction(){
  const booth=document.getElementById('booth')?.value||''; const service=document.getElementById('service')?.value||''; const amt=parseFloat(document.getElementById('amount')?.value)||0;
  const msgEl = document.getElementById('txnMsg');
  if(msgEl) msgEl.innerText = '';
  if(!booth||!service||!amt){ if(msgEl) msgEl.innerText='Please fill booth, service and amount'; return; }
  const id='WB'+String(Date.now()).slice(-7);
  const txn={TransactionID:id,MobileBooth:booth,Location:boothLocations[booth]||'',Service:service,RevenuePerKwacha:serviceRevenue[service]||0,TransactionAmount:amt};
  const added=JSON.parse(localStorage.getItem('wb_added_txns')||'[]'); added.push(txn); localStorage.setItem('wb_added_txns',JSON.stringify(added));
  if(typeof transactions!=='undefined'){ transactions.push(txn); }
  if(msgEl) msgEl.innerText = 'Transaction saved successfully! Redirecting...';
  setTimeout(()=> window.location.href='dashboard.html', 1000);
}

function exportCSV(){ if(!transactions.length){ alert('No transactions to export'); return; } const headers=["TransactionID","MobileBooth","Location","Service","RevenuePerKwacha","TransactionAmount"]; let csv=headers.join(',')+'\n'; transactions.forEach(t=>{ csv+=headers.map(h=> (t[h]!==undefined?String(t[h]).replace(/,/g,''):'')).join(',')+'\n'; }); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='wina_transactions.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }

function refreshDashboard(){ initDashboard(); }
function handleLogout(){ localStorage.removeItem('wb_current_user'); window.location.href='index.html'; }

window.addEventListener('DOMContentLoaded',()=>{ 
  initHamburger(); 
  if(location.pathname.endsWith('dashboard.html')) initDashboard(); 
  if(location.pathname.endsWith('transaction.html')) loadTransactions(); 
});
