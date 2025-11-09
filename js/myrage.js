(function(){
  try {
    var cleanUrl = window.location.origin + window.location.pathname;
    var can = document.getElementById('canonicalLink');
    if (can) can.setAttribute('href', cleanUrl);
    var og = document.getElementById('ogUrl');
    if (og) og.setAttribute('content', cleanUrl);
  } catch(e) {}
})();

let fieldCount = 1;

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

window.addEventListener('load', () => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
});

document.addEventListener('mousemove', (e) => {
  document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
  document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
});

function addContentField() {
  fieldCount++;
  const fields = document.getElementById('content-fields');
  const newField = document.createElement('div');
  newField.className = 'field-group';
  newField.innerHTML = `
    <span class="field-number">${String(fieldCount).padStart(2, '0')}</span>
    <div class="field-input-wrapper">
      <input type="text" class="content-input" placeholder="URL ou message secret">
    </div>
    <button class="remove-button" onclick="removeField(this)">×</button>
  `;
  fields.appendChild(newField);
}

function removeField(button) {
  button.parentElement.remove();
  updateFieldNumbers();
}

function updateFieldNumbers() {
  const groups = document.querySelectorAll('.field-group');
  fieldCount = groups.length;
  groups.forEach((group, index) => {
    group.querySelector('.field-number').textContent = String(index + 1).padStart(2, '0');
  });
}

function generatePassword() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const base64 = btoa(String.fromCharCode(...array));
  document.getElementById('password').value = base64;
  navigator.clipboard.writeText(base64).then(() => {
    const btn = document.querySelector('.gen-button');
    const originalText = btn.textContent;
    btn.textContent = 'Copié ✓';
    setTimeout(() => btn.textContent = originalText, 2000);
  }).catch(err => { alert('Erreur lors de la copie : ' + err); });
}

async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits","deriveKey"]);
  return crypto.subtle.deriveKey({ name:"PBKDF2", salt, iterations:100000, hash:"SHA-256" }, keyMaterial, { name:"AES-GCM", length:256 }, true, ["encrypt","decrypt"]);
}

async function encrypt(text, password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, encoder.encode(text));
  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
  combined.set(salt, 0); combined.set(iv, salt.length); combined.set(encryptedArray, salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(encryptedBase64, password) {
  const decoder = new TextDecoder();
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name:"AES-GCM", iv }, key, encrypted);
  return decoder.decode(decrypted);
}

const hash = window.location.hash.substring(1);
const createSection = document.getElementById('create-section');
const viewSection = document.getElementById('view-section');
const messageDisplay = document.getElementById('message-display');
const errorMessage = document.getElementById('error-message');
const shareLink = document.getElementById('share-link');

if (hash) { createSection.classList.add('hidden'); viewSection.classList.remove('hidden'); }

async function generateLink() {
  const title = document.getElementById('title').value;
  const inputs = document.querySelectorAll('.content-input');
  let content = '';
  inputs.forEach(input => { if (input.value.trim()) content += input.value.trim() + '\n'; });
  content = content.trim();
  const password = document.getElementById('password').value;
  const expiration = document.getElementById('expiration').value;
  if (!content || !password) { alert('Veuillez remplir au moins un contenu et le mot de passe.'); return; }
  const data = { title, content, expiration, timestamp: Date.now() };
  const encrypted = await encrypt(JSON.stringify(data), password);
  const link = window.location.href.split('#')[0] + '#' + encrypted;
  document.getElementById('resultContent').innerHTML = `<div class="result-url">${link}</div><button class="copy-btn" onclick="copyLink('${link}', this)">Copier le lien</button>`;
  shareLink.classList.add('show');
}

function copyLink(link, button) {
  navigator.clipboard.writeText(link).then(() => {
    const originalText = button.textContent; button.textContent = 'Copié ✓'; setTimeout(() => button.textContent = originalText, 2000);
  }).catch(err => { alert('Erreur lors de la copie : ' + err); });
}

document.addEventListener('click', function(e){
  var el = e.target;
  if (el && el.classList && el.classList.contains('result-url')) {
    try { var range = document.createRange(); range.selectNodeContents(el); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); } catch(e) {}
  }
});

function copyUrl(url) { navigator.clipboard.writeText(url).then(() => { alert('URL copiée dans le presse-papiers !'); }).catch(err => { alert('Erreur lors de la copie : ' + err); }); }
function openUrl(url) { window.open(url, '_blank'); }

async function decryptAndShow() {
  const password = document.getElementById('view-password').value; errorMessage.textContent = '';
  try {
    const decryptedJson = await decrypt(hash, password);
    const data = JSON.parse(decryptedJson);
    if (data.expiration === '10min') { const elapsed = Date.now() - data.timestamp; if (elapsed > 10 * 60 * 1000) { throw new Error('Ce lien a expiré.'); } }
    let html = '';
    if (data.title) { html += `<h3 style="margin-bottom: 20px; opacity: 0.8;">${data.title}</h3>`; }
    const lines = data.content.split('\n');
    lines.forEach(line => {
      line = line.trim(); if (line) {
        if (line.includes('http')) {
          html += `<div class="url-item"><span>${line}</span><div class="url-item-buttons"><button onclick="copyUrl('${line}')">Copier</button><button onclick="openUrl('${line}')">Ouvrir</button></div></div>`;
        } else {
          html += `<div style="padding: 10px; border: 1px solid var(--border); margin-bottom: 10px;">${line}</div>`;
        }
      }
    });
    document.getElementById('passwordPrompt').style.display = 'none';
    document.getElementById('contentDisplay').style.display = 'block';
    messageDisplay.innerHTML = html;
    if (data.expiration === '1view') { history.replaceState(null, '', window.location.pathname); }
  } catch (error) {
    errorMessage.innerHTML = '<div class="error">Mot de passe incorrect ou lien expiré</div>';
  }
}

function showAbout() { document.getElementById('aboutModal').classList.add('active'); }
function showSecurity() { document.getElementById('securityModal').classList.add('active'); }
function closeModal() { document.querySelectorAll('.about-modal').forEach(modal => { modal.classList.remove('active'); }); }

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); } });
