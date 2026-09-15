import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cardNames = ['Solune', 'Moussefeu', 'Lucioles', 'Brindille', 'Cendreau', 'Nacréa', 'Floraison', 'Rocaille', 'Ondine', 'Éclat', 'Noctule', 'Sève', 'Pétaline', 'Astre', 'Fulgur', 'Myrte', 'Virevol', 'Aubépine', 'Galet', 'Rosée', 'Songe', 'Lichen', 'Orée', 'Calice', 'Braise', 'Nébule', 'Aurore', 'Épine', 'Torréa', 'Sylphe', 'Mistral', 'Lueur', 'Céleste', 'Racine', 'Ardent', 'Plumage', 'Givre', 'Lierre', 'Éclipse', 'Vesper', 'Silex', 'Poussière', 'Mirage', 'Ruisseau', 'Soleil', 'Toundra', 'Pollen', 'Comète', 'Ombrelle', 'Crique', 'Pétale', 'Quartz', 'Murmure', 'Flamme', 'Écorce', 'Alizé', 'Halo', 'Ronce', 'Opale', 'Brume', 'Vallon', 'Lunaire', 'Aube', 'Saphir', 'Cobalt', 'Vague', 'Mélodie', 'Bourgeon', 'Vitrail', 'Serein', 'Élan', 'Dahlia'];
const glyphs = ['✦','◒','✧','❋','◇','◈','✺','⬖'];
const colors = ['#ec855a','#d6a25a','#74b18b','#d7796e','#c997d2','#73a6b8','#e3c06c','#b0a384'];
let state = JSON.parse(localStorage.getItem('cardbound-state') || 'null') || { owned: {}, packs: 0, recent: [] };
let cloudUserId = null;
const hasSupabaseConfig = window.SUPABASE_CONFIG?.url && !window.SUPABASE_CONFIG.url.includes('REMPLACE');
const supabase = hasSupabaseConfig ? createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey) : null;
const $ = (selector) => document.querySelector(selector);
const cardData = (index) => ({ index, name: cardNames[index], glyph: glyphs[index % glyphs.length], color: colors[index % colors.length] });
async function save() {
	localStorage.setItem('cardbound-state', JSON.stringify(state));
	if (!supabase || !cloudUserId) return;
	await supabase.from('collections').upsert({ user_id: cloudUserId, owned: state.owned, packs: state.packs, recent: state.recent });
}
async function hydrateState() {
	if (!supabase) return;
	const { data: authData } = await supabase.auth.signInAnonymously();
	cloudUserId = authData.user?.id || null;
	if (!cloudUserId) return;
	const { data } = await supabase.from('collections').select('owned, packs, recent').eq('user_id', cloudUserId).maybeSingle();
	if (data) state = { owned: data.owned || {}, packs: data.packs || 0, recent: data.recent || [] };
	renderStats(); renderRecent(); renderBinder();
}
function ownedCount() { return Object.keys(state.owned).length; }
function randomCards() { return Array.from({ length: 5 }, () => Math.floor(Math.random() * cardNames.length)); }
function cardMarkup(index, type = 'binder') { const card = cardData(index); const found = state.owned[index]; return `<article class="${type}-card ${found ? 'found' : 'missing'}" style="--card-color:${card.color}"><span class="card-number">${String(index + 1).padStart(2, '0')}</span>${found ? '<span class="check">✓</span>' : ''}<span class="card-glyph">${card.glyph}</span><span class="card-name">${card.name}</span>${type === 'binder' && found > 1 ? `<span class="quantity">×${found}</span>` : ''}</article>`; }
function renderStats() { const count = ownedCount(); const percent = Math.round((count / cardNames.length) * 100); $('#heading-progress').textContent = count; $('#binder-progress-number').textContent = `${percent}%`; $('#binder-progress-bar').style.width = `${percent}%`; $('#binder-progress-label').textContent = `${count} / ${cardNames.length} cartes`; $('#all-count').textContent = cardNames.length; $('#found-count').textContent = count; $('#missing-count').textContent = cardNames.length - count; $('#pack-count-label').textContent = `${state.packs} pack${state.packs > 1 ? 's' : ''} ouvert${state.packs > 1 ? 's' : ''}`; }
function renderBinder(filter = 'all') { const indices = [...Array(cardNames.length).keys()].filter((index) => filter === 'all' || (filter === 'found' ? state.owned[index] : !state.owned[index])); $('#binder-grid').innerHTML = indices.map((index) => cardMarkup(index)).join(''); }
function renderRecent() { if (!state.recent.length) { $('#recent-grid').innerHTML = '<div class="empty-state">Ouvre ton premier pack pour remplir cet espace.</div>'; return; } $('#recent-grid').innerHTML = state.recent.slice(0, 5).map((index, order) => { const card = cardData(index); return `<article class="recent-card" style="--card-color:${card.color}"><span class="card-number">${String(index + 1).padStart(2, '0')}</span>${order < 2 ? '<span class="new-badge">NOUVEAU</span>' : ''}<span class="mini-art">${card.glyph}</span><span class="card-name">${card.name}</span></article>`; }).join(''); }
async function openPack() { const cards = randomCards(); state.packs += 1; cards.forEach((index) => { state.owned[index] = (state.owned[index] || 0) + 1; }); state.recent = [...cards, ...state.recent].slice(0, 5); await save(); $('#modal-pack-number').textContent = String(state.packs).padStart(2, '0'); $('#revealed-grid').innerHTML = cards.map((index) => { const card = cardData(index); return `<article class="revealed-card" style="--card-color:${card.color}"><span class="rarity">${Math.random() > .8 ? 'RARE' : 'COMMUN'}</span><span class="card-glyph">${card.glyph}</span><span class="card-name">${card.name}</span></article>`; }).join(''); $('#pack-modal').classList.add('open'); $('#pack-modal').setAttribute('aria-hidden', 'false'); renderStats(); renderRecent(); renderBinder(); }
function closeModal() { $('#pack-modal').classList.remove('open'); $('#pack-modal').setAttribute('aria-hidden', 'true'); $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 2200); }
document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item === button)); document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.dataset.viewPanel === button.dataset.view)); }));
document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', item === button)); renderBinder(button.dataset.filter); }));
$('#open-pack-button').addEventListener('click', openPack); $('#close-modal').addEventListener('click', closeModal); $('#modal-done').addEventListener('click', closeModal); $('#pack-modal').addEventListener('click', (event) => { if (event.target.id === 'pack-modal') closeModal(); });
renderStats(); renderRecent(); renderBinder(); hydrateState();