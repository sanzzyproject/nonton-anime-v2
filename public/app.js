const API_BASE = '/api'; 

// Utility
const show = (id) => document.getElementById(id).classList.remove('hidden');
const hide = (id) => document.getElementById(id).classList.add('hidden');
const loader = (state) => state ? show('loading') : hide('loading');

// --- LOAD DATA UTAMA ---
async function loadLatest() {
    loader(true);
    hide('detail-view');
    hide('watch-view');
    show('home-view');
    
    // Reset konten
    document.getElementById('trending-list').innerHTML = '';
    document.getElementById('latest-grid').innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/latest`);
        const data = await res.json();
        
        // Membagi data untuk UI: 5 item pertama jadi "Trending", sisanya "Grid"
        const trendingData = data.slice(0, 5); 
        const latestData = data; 

        renderTrending(trendingData);
        renderGrid(latestData);

    } catch (err) {
        console.error(err);
        alert('Gagal memuat data. Periksa koneksi internet.');
    } finally {
        loader(false);
    }
}

// Render Bagian Trending (Horizontal Scroll)
function renderTrending(data) {
    const container = document.getElementById('trending-list');
    container.innerHTML = data.map(anime => `
        <div class="trending-card" onclick="loadDetail('${anime.url}')">
            <img src="${anime.image}" alt="${anime.title}" loading="lazy">
            <div class="trending-overlay">
                <div class="trending-title">${anime.title}</div>
            </div>
        </div>
    `).join('');
}

// Render Bagian Grid (Rilisan Terbaru)
function renderGrid(data) {
    const container = document.getElementById('latest-grid');
    container.innerHTML = data.map(anime => `
        <div class="anime-card" onclick="loadDetail('${anime.url}')">
            <div class="card-image-wrapper">
                <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                <div class="ep-badge">Ep ${anime.episode || '?'}</div>
            </div>
            <h3 class="card-title">${anime.title}</h3>
        </div>
    `).join('');
}

// --- PENCARIAN ---
async function handleSearch() {
    const query = document.getElementById('searchInput').value;
    if (!query) return loadLatest();
    
    loader(true);
    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        hide('detail-view');
        hide('watch-view');
        show('home-view');

        // Kosongkan trending saat mode cari
        document.getElementById('trending-list').innerHTML = '';
        document.querySelector('.section-header').classList.add('hidden'); 
        
        // Ubah judul grid
        const gridHeader = document.querySelectorAll('.section-header')[1];
        gridHeader.querySelector('h2').innerText = `Hasil: "${query}"`;
        
        // Format data search agar cocok dengan grid
        const formattedData = data.map(item => ({
            title: item.title,
            image: item.image,
            url: item.url,
            episode: item.score 
        }));

        renderGrid(formattedData);
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
    document.querySelector('.section-header').classList.remove('hidden');
    document.querySelectorAll('.section-header')[1].querySelector('h2').innerText = 'Rilisan Terbaru';
    loadLatest();
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
    
    // Toggle class active
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Init
document.addEventListener('DOMContentLoaded', loadLatest);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
