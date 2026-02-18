/* =============================================
   ERASMUS DASHBOARD — Application Logic
   ============================================= */

// -------- i18n Dictionary --------
const TRANSLATIONS = {
    es: {
        header_title: "Erasmus Ljubljana 26/27",
        header_subtitle: "Visualiza los datos de los estudiantes",
        stat_students: "Estudiantes",
        stat_cities: "Ciudades",
        stat_careers: "Carreras",
        tab_dashboard: "Dashboard",
        tab_table: "Tabla de Datos",
        search_title: "Buscar Estudiantes",
        origin_city: "Ciudad de origen",
        search_city_placeholder: "Escribe una ciudad...",
        career: "Carrera",
        search_career_placeholder: "Escribe una carrera...",
        clear_filters: "Borrar filtros",
        map_title: "Mapa de Provincias",
        map_subtitle: "Pasa el ratón por las provincias para ver los estudiantes",
        add_student: "Añadir Estudiante",
        name: "Nombre",
        name_placeholder: "Nombre del estudiante",
        career_placeholder: "Carrera universitaria",
        origin: "Origen",
        origin_placeholder: "Ciudad de origen",
        phone: "Teléfono",
        phone_placeholder: "Ej: 600 000 000",
        add_btn: "Añadir Estudiante",
        table_title: "Gestión de Estudiantes",
        quick_search_placeholder: "Búsqueda rápida...",
        actions: "Acciones",
        edit_modal_title: "Editar Estudiante",
        cancel: "Cancelar",
        save_changes: "Guardar Cambios",
        footer_text: "Erasmus Ljubljana 26/27 &copy; 2026 — Datos de los estudiantes Erasmus",
        results: "Resultados",
        student_unit: "estudiante",
        students_unit: "estudiantes",
        province_label: "Provincia",
        success_add: "añadido correctamente!",
        success_add_local: "añadido localmente!",
        city_label: "Ciudad",
        career_label: "Carrera"
    },
    ca: {
        header_title: "Erasmus Ljubljana 26/27",
        header_subtitle: "Visualitza les dades dels estudiants",
        stat_students: "Estudiants",
        stat_cities: "Ciutats",
        stat_careers: "Carreres",
        tab_dashboard: "Dashboard",
        tab_table: "Taula de Dades",
        search_title: "Cerca Estudiants",
        origin_city: "Ciutat d'origen",
        search_city_placeholder: "Escriu una ciutat...",
        career: "Carrera",
        search_career_placeholder: "Escriu una carrera...",
        clear_filters: "Esborrar filtres",
        map_title: "Mapa de Províncies",
        map_subtitle: "Passa el ratolí per les províncies per veure els estudiants",
        add_student: "Afegir Estudiant",
        name: "Nom",
        name_placeholder: "Nom de l'estudiant",
        career_placeholder: "Carrera universitària",
        origin: "Origen",
        origin_placeholder: "Ciutat d'origen",
        phone: "Telèfon",
        phone_placeholder: "Ex: 600 000 000",
        add_btn: "Afegir Estudiant",
        table_title: "Gestió d'Estudiants",
        quick_search_placeholder: "Cerca ràpida...",
        actions: "Accions",
        edit_modal_title: "Editar Estudiant",
        cancel: "Cancel·lar",
        save_changes: "Guardar Canvis",
        footer_text: "Erasmus Ljubljana 26/27 &copy; 2026 — Dades dels estudiants Erasmus",
        results: "Resultats",
        student_unit: "estudiant",
        students_unit: "estudiants",
        province_label: "Província",
        success_add: "afegit correctament!",
        success_add_local: "afegit localment!",
        city_label: "Ciutat",
        career_label: "Carrera"
    }
};

let currentLang = 'es';

// -------- State --------
let students = [];
let allCities = [];
let allCareers = [];
let map = null;
let geojsonLayer = null;

// -------- City → Province mapping --------
const CITY_TO_PROVINCE = {
    'Valencia': 'València/Valencia',
    'Barcelona': 'Barcelona',
    'Pamplona': 'Navarra',
    'Valladolid': 'Valladolid',
    'Bilbao': 'Bizkaia/Vizcaya',
    'Murcia': 'Murcia',
    'Logroño': 'La Rioja',
    'Sevilla': 'Sevilla',
    'Madrid': 'Madrid',
    'Granada': 'Granada',
    'Melilla': 'Melilla',
    'Galicia': 'Galicia',
    'Salamanca': 'Salamanca',
    'San Sebastián': 'Gipuzkoa/Guipúzcoa',
    'Huelva': 'Huelva',
    'Zaragoza': 'Zaragoza',
    'Málaga': 'Málaga',
    'Albacete': 'Albacete',
    'Santander': 'Cantabria',
    'Almeria': 'Almería',
    'Oviedo': 'Asturias',
    'Alicante': 'Alacant/Alicante',
    'Mondragon': 'Gipuzkoa/Guipúzcoa',
    'Ceuta': 'Ceuta'
};

const GALICIA_PROVINCES = ['A Coruña', 'Lugo', 'Ourense', 'Pontevedra'];

// -------- Initialization --------
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadData();
    setupTabs();
    setupSearch();
    setupAddForm();
    setupTable();
    setupEditModal();
    setupLangToggle();
    initMap();
    updateStats();
    updateUI(); 
}

// -------- Language --------
function setupLangToggle() {
    const btns = document.querySelectorAll('.lang-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            if (lang === currentLang) return;
            setLanguage(lang);
        });
    });
}

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.documentElement.lang = lang;
    updateUI();
    renderTable();
    filterStudents(); 
    if (map) { map.remove(); initMap(); }
}

function updateUI() {
    const tDict = TRANSLATIONS[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (tDict[key]) el.innerHTML = tDict[key];
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const attrSpec = el.getAttribute('data-i18n-attr');
        const [attr, key] = attrSpec.split(':');
        if (tDict[key]) el.setAttribute(attr, tDict[key]);
    });
}

function t(key) { return TRANSLATIONS[currentLang][key] || key; }

// -------- Tabs --------
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${target}`).classList.add('active');
            if (target === 'dashboard' && map) { setTimeout(() => map.invalidateSize(), 100); }
        });
    });
}

// -------- Data Loading --------
async function loadData() {
    try {
        const res = await fetch('/data');
        students = await res.json();
    } catch {
        try {
            const res = await fetch('data.json');
            students = await res.json();
        } catch (e) { students = []; }
    }
    computeUniques();
    renderTable();
}

function computeUniques() {
    const citySet = new Set();
    const careerSet = new Set();
    students.forEach(s => {
        if (s.origen) citySet.add(s.origen);
        if (s.carrera) careerSet.add(s.carrera);
    });
    allCities = [...citySet].sort((a, b) => a.localeCompare(b, currentLang));
    allCareers = [...careerSet].sort((a, b) => a.localeCompare(b, currentLang));
}

function updateStats() {
    const sTotal = document.getElementById('stat-total');
    if (sTotal) sTotal.textContent = students.length;
    const sCities = document.getElementById('stat-cities');
    if (sCities) sCities.textContent = allCities.length;
    const sCareers = document.getElementById('stat-careers');
    if (sCareers) sCareers.textContent = allCareers.length;
}

// -------- Search & Filter --------
function setupSearch() {
    const cityInput = document.getElementById('search-city');
    const careerInput = document.getElementById('search-career');
    const cityAc = document.getElementById('city-autocomplete');
    const careerAc = document.getElementById('career-autocomplete');
    const btnClear = document.getElementById('btn-clear');
    if (!cityInput || !careerInput) return;
    setupAutocomplete(cityInput, cityAc, allCities, () => filterStudents());
    setupAutocomplete(careerInput, careerAc, allCareers, () => filterStudents());
    cityInput.addEventListener('input', () => filterStudents());
    careerInput.addEventListener('input', () => filterStudents());
    btnClear.addEventListener('click', () => {
        cityInput.value = ''; careerInput.value = '';
        btnClear.style.display = 'none'; hideResults(); resetMapHighlight();
    });
    document.addEventListener('click', (e) => {
        if (cityAc && !cityInput.contains(e.target) && !cityAc.contains(e.target)) cityAc.classList.remove('active');
        if (careerAc && !careerInput.contains(e.target) && !careerAc.contains(e.target)) careerAc.classList.remove('active');
    });
}

function setupAutocomplete(input, listEl, options, onSelect) {
    if (!input || !listEl) return;
    input.addEventListener('input', () => {
        const val = input.value.trim().toLowerCase();
        if (val.length === 0) { listEl.classList.remove('active'); return; }
        const filtered = options.filter(o => o.toLowerCase().includes(val));
        if (filtered.length === 0) { listEl.classList.remove('active'); return; }
        listEl.innerHTML = filtered.map(o => {
            const idx = o.toLowerCase().indexOf(val);
            const highlighted = o.slice(0, idx) + '<mark>' + o.slice(idx, idx + val.length) + '</mark>' + o.slice(idx + val.length);
            return `<div class="autocomplete-item" data-value="${o}">${highlighted}</div>`;
        }).join('');
        listEl.classList.add('active');
        listEl.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                input.value = item.dataset.value; listEl.classList.remove('active'); onSelect();
            });
        });
    });
}

function filterStudents() {
    const cityInput = document.getElementById('search-city');
    const careerInput = document.getElementById('search-career');
    const btnClear = document.getElementById('btn-clear');
    if (!cityInput || !careerInput) return;
    const cityVal = cityInput.value.trim().toLowerCase();
    const careerVal = careerInput.value.trim().toLowerCase();
    if (!cityVal && !careerVal) { if (btnClear) btnClear.style.display = 'none'; hideResults(); resetMapHighlight(); return; }
    if (btnClear) btnClear.style.display = 'flex';
    let filtered = students;
    let titleParts = [];
    if (cityVal) {
        filtered = filtered.filter(s => s.origen.toLowerCase().includes(cityVal));
        titleParts.push(`${t('city_label')}: "${cityInput.value.trim()}"`);
    }
    if (careerVal) {
        filtered = filtered.filter(s => s.carrera.toLowerCase().includes(careerVal));
        titleParts.push(`${t('career_label')}: "${careerInput.value.trim()}"`);
    }
    showResults(filtered, titleParts.join(' · '));
}

function showResults(filtered, title) {
    const section = document.getElementById('results-section');
    const grid = document.getElementById('results-grid');
    const titleEl = document.getElementById('results-title');
    const countEl = document.getElementById('results-count');
    if (!section || !grid) return;
    section.style.display = 'block';
    if (titleEl) titleEl.textContent = title || t('results');
    const unit = filtered.length === 1 ? t('student_unit') : t('students_unit');
    if (countEl) countEl.textContent = `${filtered.length} ${unit}`;
    grid.innerHTML = filtered.map((s, i) => `
    <div class="student-card" style="animation-delay: ${i * 0.04}s">
      <div class="card-name"><span class="material-icons-round">person</span>${escapeHtml(s.nom)}</div>
      <div class="card-detail"><span class="material-icons-round">school</span>${escapeHtml(s.carrera)}</div>
      <div class="card-detail"><span class="material-icons-round">place</span>${escapeHtml(s.origen)}</div>
      ${s.telefon ? `<div class="card-detail"><span class="material-icons-round">phone</span>${escapeHtml(s.telefon)}</div>` : ''}
    </div>`).join('');
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResults() {
    const section = document.getElementById('results-section');
    if (section) section.style.display = 'none';
}

function setupTable() {
    const sInput = document.getElementById('table-search');
    if (sInput) sInput.addEventListener('input', () => renderTable());
}

function renderTable() {
    const body = document.getElementById('table-body');
    const sInput = document.getElementById('table-search');
    if (!body || !sInput) return;
    const term = sInput.value.trim().toLowerCase();
    const filtered = students.filter(s =>
        s.nom.toLowerCase().includes(term) || s.carrera.toLowerCase().includes(term) ||
        s.origen.toLowerCase().includes(term) || (s.telefon && s.telefon.toLowerCase().includes(term))
    );
    body.innerHTML = filtered.map((s) => {
        const realIndex = students.indexOf(s);
        return `
        <tr>
            <td><strong>${escapeHtml(s.nom)}</strong></td>
            <td>${escapeHtml(s.carrera)}</td>
            <td>${escapeHtml(s.origen)}</td>
            <td>${escapeHtml(s.telefon || '-')}</td>
            <td><button class="btn-icon" onclick="openEditModal(${realIndex})"><span class="material-icons-round">edit</span></button></td>
        </tr>`}).join('');
}

function setupEditModal() {
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-edit');
    const form = document.getElementById('edit-form');
    if (!modal) return;
    const closeModal = () => modal.classList.remove('active');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    window.onclick = (e) => { if (e.target === modal) closeModal(); };
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const idx = parseInt(document.getElementById('edit-index').value);
            students[idx] = {
                nom: document.getElementById('edit-name').value.trim(),
                carrera: document.getElementById('edit-career').value.trim(),
                origen: document.getElementById('edit-origin').value.trim(),
                telefon: document.getElementById('edit-phone').value.trim()
            };
            await saveAllData(); computeUniques(); updateStats(); renderTable();
            if (map) { map.remove(); initMap(); }
            closeModal();
        };
    }
}

window.openEditModal = (idx) => {
    const s = students[idx];
    const modal = document.getElementById('edit-modal');
    if (!s || !modal) return;
    document.getElementById('edit-index').value = idx;
    document.getElementById('edit-name').value = s.nom;
    document.getElementById('edit-career').value = s.carrera;
    document.getElementById('edit-origin').value = s.origen;
    document.getElementById('edit-phone').value = s.telefon || '';
    modal.classList.add('active');
};

async function saveAllData() {
    try {
        await fetch('/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students })
        });
    } catch (e) { console.error('Save failed:', e); }
}

async function initMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;
    map = L.map('map-container', { center: [38.5, -3.7], zoom: 6, zoomControl: true, scrollWheelZoom: false, attributionControl: false, minZoom: 5, maxZoom: 9 });
    try {
        const res = await fetch('spain-provinces.geojson');
        let geoData = await res.json();
        geoData = shiftFeatures(geoData);
        const provinceData = {}; const galiciaStudents = [];
        students.forEach(s => {
            let provName = CITY_TO_PROVINCE[s.origen] || s.origen;
            if (s.origen === 'Galicia') { galiciaStudents.push(s); }
            else { if (!provinceData[provName]) provinceData[provName] = []; provinceData[provName].push(s); }
        });
        if (galiciaStudents.length > 0) {
            GALICIA_PROVINCES.forEach(gProv => { if (!provinceData[gProv]) provinceData[gProv] = []; provinceData[gProv].push(...galiciaStudents); });
        }
        const counts = Object.values(provinceData).map(arr => arr.length);
        const maxCount = counts.length > 0 ? Math.max(...counts) : 1;
        const legendMax = document.getElementById('legend-max');
        if (legendMax) legendMax.textContent = maxCount + '+';
        geojsonLayer = L.geoJSON(geoData, {
            style: (f) => {
                const count = (provinceData[f.properties.name] || []).length;
                return { fillColor: getProvinceColor(count, maxCount), weight: 1, opacity: 1, color: 'rgba(99, 102, 241, 0.3)', fillOpacity: 0.9 };
            },
            onEachFeature: (f, layer) => {
                const provName = f.properties.name; const studentsInProv = provinceData[provName] || []; const count = studentsInProv.length;
                layer.on({
                    mouseover: (e) => { e.target.setStyle({ weight: 2, color: '#a78bfa', fillOpacity: 1 }); e.target.bringToFront(); },
                    mouseout: (e) => geojsonLayer.resetStyle(e.target),
                    click: () => {
                        if (count > 0) {
                            const cSearch = document.getElementById('search-city');
                            const carSearch = document.getElementById('search-career');
                            if (cSearch) cSearch.value = '';
                            if (carSearch) carSearch.value = '';
                            showResults(studentsInProv, `${t('province_label')}: ${provName}`);
                            const bClear = document.getElementById('btn-clear');
                            if (bClear) bClear.style.display = 'flex';
                            const dashTab = document.querySelector('[data-tab="dashboard"]');
                            if (dashTab) dashTab.click();
                        }
                    }
                });
                if (count > 0) {
                    const unit = count === 1 ? t('student_unit') : t('students_unit');
                    let pop = `<div class="popup-title">${provName}</div><div class="popup-count">${count} ${unit}</div><div class="popup-list">`;
                    studentsInProv.forEach(s => { pop += `<div class="popup-item"><strong>${escapeHtml(s.nom)}</strong><span class="active-career">${escapeHtml(s.carrera)}</span></div>`; });
                    layer.bindPopup(pop + '</div>', { closeButton: false, className: 'custom-popup' });
                    layer.bindTooltip(`<b>${provName}</b><br>${count} ${unit}`, { direction: 'top', sticky: true, className: 'custom-tooltip' });
                }
            }
        }).addTo(map);
    } catch (err) { console.error('Map error:', err); }
}

function shiftFeatures(geoData) {
    geoData.features.forEach(f => {
        const n = f.properties.name;
        if (n === 'Ceuta' || n === 'Melilla') transformCoords(f.geometry.coordinates, -7, 3.5);
        if (n === 'Las Palmas' || n === 'Santa Cruz de Tenerife') transformCoords(f.geometry.coordinates, 3, 7.5);
    });
    return geoData;
}
function transformCoords(c, x, y) { if (typeof c[0] === 'number') { c[0] += x; c[1] += y; } else { c.forEach(cc => transformCoords(cc, x, y)); } }
function getProvinceColor(c, m) { if (c === 0) return 'var(--map-empty)'; const r = c / m; if (r < 0.2) return 'var(--map-low)'; if (r < 0.5) return 'var(--map-mid)'; if (r < 0.8) return 'var(--map-high)'; return 'var(--map-max)'; }
function resetMapHighlight() { if (map) { map.closePopup(); map.setView([38.5, -3.7], 6); } }

function setupAddForm() {
    const aForm = document.getElementById('add-form');
    if (!aForm) return;
    aForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nom = document.getElementById('add-name').value.trim();
        const carrera = document.getElementById('add-career').value.trim();
        const origen = document.getElementById('add-origin').value.trim();
        const telefon = document.getElementById('add-phone').value.trim();
        if (!nom || !carrera || !origen) return;
        const newStudent = { nom, carrera, origen, telefon };
        try {
            const res = await fetch('/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newStudent) });
            if (res.ok) {
                students.push(newStudent); computeUniques(); updateStats(); renderTable();
                if (map) { map.remove(); initMap(); }
                e.target.reset(); showFeedback('success', `✓ ${nom} ${t('success_add')}`);
            } else throw new Error();
        } catch {
            students.push(newStudent); computeUniques(); updateStats(); renderTable();
            if (map) { map.remove(); initMap(); }
            e.target.reset(); showFeedback('success', `✓ ${nom} ${t('success_add_local')}`);
        }
    });
}
function showFeedback(t, m) { const f = document.getElementById('form-feedback'); if (f) { f.className = 'form-feedback ' + t; f.textContent = m; f.style.display = 'block'; setTimeout(() => f.style.display = 'none', 4000); } }
function escapeHtml(t) { if (!t) return ''; const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
