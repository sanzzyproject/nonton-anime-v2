const API_BASE = '/api'; // Mengarah ke folder api/index.js via Vercel Rewrites
let currentAnimeDetail = null;

// Helper untuk menampilkan elemen
const show = (id) => document.getElementById(id).classList.remove('hidden');
const hide = (id) => document.getElementById(id).classList.add('hidden');
const loader = (state) => state ? show('loading') : hide('loading');

// Fungsi Utama: Load Terbaru
async function loadLatest() {
    loader(true);
    hide('detail-view');
    hide('watch-view');
    show('home-view');

    try {
        const res = await fetch(`${API_BASE}/latest`);
        const data = await res.json();
        renderGrid(data);
    } catch (err) {
        console.error(err);
        alert('Gagal memuat data. Coba refresh.');
    } finally {
        loader(false);
    }
}

// Render Kartu Anime
function renderGrid(data) {
    const grid = document.getElementById('latest-grid');
    grid.innerHTML = data.map(anime => `
        <div class="card" onclick="loadDetail('${anime.url}')">
            <img src="${anime.image}" alt="${anime.title}" loading="lazy">
            <div class="card-content">
                <h3 class="card-title">${anime.title}</h3>
                <span class="card-ep">Ep ${anime.episode || '?'}</span>
            </div>
        </div>
    `).join('');
}

// Fungsi Pencarian
async function handleSearch() {
    const query = document.getElementById('searchInput').value;
    if (!query) return loadLatest();
    
    loader(true);
    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        // Sesuaikan struktur data search yang sedikit berbeda
        const formattedData = data.map(item => ({
            title: item.title,
            image: item.image,
            url: item.url,
            episode: item.score // Search result pakai score, bukan episode
        }));
        
        hide('detail-view');
        hide('watch-view');
        show('home-view');
        document.querySelector('.section-title').innerText = `Hasil Pencarian: ${query}`;
        renderGrid(formattedData);
    } catch (err) {
        console.error(err);
    } finally {
        loader(false);
    }
}

// Load Detail Anime
async function loadDetail(url) {
    loader(true);
    try {
        const res = await fetch(`${API_BASE}/detail?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        currentAnimeDetail = data;

        hide('home-view');
        hide('watch-view');
        show('detail-view');

        // Render Info
        document.getElementById('anime-info').innerHTML = `
            <div class="detail-header">
                <img src="${data.image}" class="detail-cover">
                <div class="detail-meta">
                    <h1>${data.title}</h1>
                    <div class="detail-info">
                        <p>${data.description.substring(0, 300)}...</p>
                        <p><strong>Status:</strong> ${data.info.status || '-'}</p>
                        <p><strong>Genre:</strong> ${data.info.genre || '-'}</p>
                    </div>
                </div>
            </div>
        `;

        // Render Episodes
        const epGrid = document.getElementById('episode-grid');
        epGrid.innerHTML = data.episodes.map(ep => `
            <div class="ep-btn" onclick="loadVideo('${ep.url}')">
                ${ep.title}
            </div>
        `).join('');

    } catch (err) {
        console.error(err);
    } finally {
        loader(false);
    }
}

// Load Video Player
async function loadVideo(url) {
    loader(true);
    try {
        const res = await fetch(`${API_BASE}/watch?url=${encodeURIComponent(url)}`);
        const data = await res.json();

        hide('detail-view');
        show('watch-view');

        document.getElementById('video-title').innerText = data.title;
        
        const serverContainer = document.getElementById('server-options');
        const player = document.getElementById('video-player');

        if (data.streams.length > 0) {
            // Default putar server pertama
            player.src = data.streams[0].url;

            // Render tombol server
            serverContainer.innerHTML = data.streams.map((stream, index) => `
                <div class="server-btn ${index === 0 ? 'active' : ''}" 
                     onclick="changeServer('${stream.url}', this)">
                     ${stream.server}
                </div>
            `).join('');
        } else {
            alert('Video tidak ditemukan :(');
        }

    } catch (err) {
        console.error(err);
    } finally {
        loader(false);
    }
}

function changeServer(url, btn) {
    document.getElementById('video-player').src = url;
    document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Navigasi
function goHome() {
    document.querySelector('.section-title').innerText = 'Update Terbaru';
    loadLatest();
}

function backToDetail() {
    hide('watch-view');
    show('detail-view');
    // Hentikan video saat kembali
    document.getElementById('video-player').src = '';
}

// Init
document.addEventListener('DOMContentLoaded', loadLatest);
// Enter di search box
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
