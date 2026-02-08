const API_BASE = '/api'; 

// --- KONFIGURASI GENRE BERANDA ---
// Tambahkan atau ganti genre di sini sesuai keinginan
const HOME_SECTIONS = [
    { title: "Sedang Hangat 🔥", query: "latest" }, // Spesial: query 'latest' pakai endpoint latest
    { title: "Isekai World 🌀", query: "isekai" },
    { title: "Romance & Drama ❤️", query: "romance" },
    { title: "Action Packed ⚔️", query: "action" },
    { title: "Fantasy Magic ✨", query: "fantasy" },
    { title: "School Life 🏫", query: "school" },
    { title: "Comedy 😂", query: "comedy" }
];

// Utility
const show = (id) => document.getElementById(id).classList.remove('hidden');
const hide = (id) => document.getElementById(id).classList.add('hidden');
const loader = (state) => state ? show('loading') : hide('loading');

// --- LOAD DATA HOME (MULTI SECTION) ---
async function loadLatest() {
    loader(true);
    hide('detail-view');
    hide('watch-view');
    show('home-view');
    
    const homeContainer = document.getElementById('home-view');
    homeContainer.innerHTML = ''; // Reset konten

    try {
        // Kita loop array HOME_SECTIONS dan fetch data untuk tiap bagian
        // Menggunakan Promise.all agar loading paralel (lebih cepat)
        /* CATATAN PENTING: 
           Karena API backend tidak boleh diubah dan saya tidak tahu apakah ada endpoint khusus genre,
           saya menggunakan trik: untuk genre spesifik, saya menggunakan endpoint 'search' yang sudah ada.
        */

        for (const section of HOME_SECTIONS) {
            let data = [];
            
            if (section.query === 'latest') {
                // Fetch Endpoint Latest (Bawaan)
                const res = await fetch(`${API_BASE}/latest`);
                data = await res.json();
            } else {
                // Fetch Endpoint Search untuk simulasi Genre
                const res = await fetch(`${API_BASE}/search?q=${section.query}`);
                data = await res.json();
            }

            // Jika ada data, render sectionnya
            if (data && data.length > 0) {
                renderSection(section.title, data, homeContainer);
            }
        }

    } catch (err) {
        console.error(err);
        // alert('Gagal memuat sebagian data. Periksa koneksi internet.');
    } finally {
        loader(false);
    }
}

// Fungsi Render Satu Section (Horizontal Scroll)
function renderSection(title, data, container) {
    // Buat elemen section
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'category-section';

    // Buat Header (Judul + Tombol More)
    const headerHtml = `
        <div class="header-flex">
            <div class="section-header">
                <div class="bar-accent"></div>
                <h2>${title}</h2>
            </div>
            <a href="#" class="more-link" onclick="handleSearch('${title.split(' ')[0]}')">Lainnya</a>
        </div>
    `;

    // Buat Container Scroll Horizontal
    // Mapping data: sesuaikan properti karena output endpoint search & latest kadang beda field score/episode
    const cardsHtml = data.map(anime => {
        // Normalisasi data agar aman
        const eps = anime.episode || anime.score || '?'; 
        
        return `
        <div class="scroll-card" onclick="loadDetail('${anime.url}')">
            <div class="scroll-card-img">
                <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                <div class="ep-badge">Ep ${eps}</div>
            </div>
            <div class="scroll-card-title">${anime.title}</div>
        </div>
        `;
    }).join('');

    sectionDiv.innerHTML = headerHtml + `<div class="horizontal-scroll">${cardsHtml}</div>`;
    container.appendChild(sectionDiv);
}

// --- PENCARIAN (Menampilkan Grid) ---
async function handleSearch(manualQuery = null) {
    const searchInput = document.getElementById('searchInput');
    const query = manualQuery || searchInput.value;
    
    if (!query) return loadLatest();
    
    // Set value input jika dipanggil manual (dari tombol More)
    if(manualQuery) searchInput.value = manualQuery;

    loader(true);
    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        hide('detail-view');
        hide('watch-view');
        show('home-view');

        const homeContainer = document.getElementById('home-view');
        homeContainer.innerHTML = ''; // Hapus tampilan home scroll

        // Buat tampilan Grid untuk hasil search
        const resultSection = document.createElement('div');
        resultSection.className = 'search-results-container';
        
        resultSection.innerHTML = `
            <div class="section-header mt-large">
                <div class="bar-accent"></div>
                <h2>Hasil Pencarian: "${query}"</h2>
            </div>
            <div class="anime-grid">
                ${data.map(anime => `
                    <div class="scroll-card" onclick="loadDetail('${anime.url}')" style="min-width: auto; max-width: none;">
                        <div class="scroll-card-img">
                            <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                            <div class="ep-badge">Ep ${anime.score || '?'}</div>
                        </div>
                        <h3 class="scroll-card-title">${anime.title}</h3>
                    </div>
                `).join('')}
            </div>
        `;
        
        homeContainer.appendChild(resultSection);

    } catch (err) {
        console.error(err);
    } finally {
        loader(false);
    }
}

// --- DETAIL ANIME ---
async function loadDetail(url) {
    loader(true);
    try {
        const res = await fetch(`${API_BASE}/detail?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        
        hide('home-view');
        hide('watch-view');
        show('detail-view');

        // Render Info
        document.getElementById('anime-info').innerHTML = `
            <div class="detail-header">
                <img src="${data.image}" class="detail-poster">
                <div class="detail-text">
                    <h1>${data.title}</h1>
                    <div class="detail-meta">
                        <span>${data.info.genre || 'Anime'}</span> • <span>${data.info.status || 'Ongoing'}</span>
                    </div>
                    <p class="desc">${data.description || 'Tidak ada deskripsi.'}</p>
                </div>
            </div>
        `;

        // Render Episode Grid 
        const epGrid = document.getElementById('episode-grid');
        epGrid.innerHTML = data.episodes.map(ep => {
            let epNum = ep.title.match(/Episode\s+(\d+)/i);
            let displayTitle = epNum ? epNum[1] : ep.title.replace('Episode', '').trim();
            if(displayTitle.length > 5) displayTitle = 'Ep'; 

            return `<div class="ep-box" onclick="loadVideo('${ep.url}')">${displayTitle}</div>`;
        }).join('');

    } catch (err) {
        console.error(err);
    } finally {
        loader(false);
    }
}

// --- NONTON VIDEO ---
async function loadVideo(url) {
    loader(true);
    try {
        const res = await fetch(`${API_BASE}/watch?url=${encodeURIComponent(url)}`);
        const data = await res.json();

        hide('detail-view');
        show('watch-view');

        document.getElementById('video-title').innerText = data.title;
        
        const player = document.getElementById('video-player');
        const serverContainer = document.getElementById('server-options');

        if (data.streams.length > 0) {
            player.src = data.streams[0].url;
            
            serverContainer.innerHTML = data.streams.map((stream, index) => `
                <button class="server-tag ${index === 0 ? 'active' : ''}" 
                     onclick="changeServer('${stream.url}', this)">
                     ${stream.server}
                </button>
            `).join('');
        } else {
            alert('Maaf, stream belum tersedia untuk episode ini.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        loader(false);
    }
}

function changeServer(url, btn) {
    document.getElementById('video-player').src = url;
    document.querySelectorAll('.server-tag').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Navigasi Balik
function goHome() {
    loadLatest(); // Reload halaman utama untuk kembali ke tampilan section
}

function backToDetail() {
    hide('watch-view');
    show('detail-view');
    document.getElementById('video-player').src = ''; 
}

// --- SIDEBAR UI LOGIC ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Init
document.addEventListener('DOMContentLoaded', loadLatest);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
