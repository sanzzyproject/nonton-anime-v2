const API_BASE = '/api'; 

const HOME_SECTIONS = [
    { title: "Sedang Hangat 🔥", mode: "latest" },
    { title: "Isekai & Fantasy 🌀", queries: ["isekai", "reincarnation", "world", "maou"] },
    { title: "Action Hits ⚔️", queries: ["kimetsu", "jujutsu", "piece", "bleach", "hunter", "shingeki"] },
    { title: "Romance & Drama ❤️", queries: ["love", "kanojo", "romance", "heroine", "uso"] },
    { title: "School Life 🏫", queries: ["school", "gakuen", "classroom", "high school"] },
    { title: "Magic & Adventure ✨", queries: ["magic", "adventure", "dragon", "dungeon"] },
    { title: "Comedy & Chill 😂", queries: ["comedy", "slice of life", "bocchi", "spy"] }
];

let sliderInterval;

const show = (id) => {
    const el = document.getElementById(id);
    if(el) el.classList.remove('hidden');
};

const hide = (id) => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
    // Stop slider jika halaman home disembunyikan
    if (id === 'home-view' && sliderInterval) {
        clearInterval(sliderInterval);
    }
};

const loader = (state) => state ? show('loading') : hide('loading');

// --- FUNGSI TAB BAWAH (BOTTOM NAV) BARU ---
function switchTab(tabName) {
    // Sembunyikan semua halaman utama
    hide('home-view');
    hide('anime-view');
    hide('recent-view');
    hide('schedule-view');
    hide('profile-view');
    hide('detail-view');
    hide('watch-view');

    // Kembalikan status Bottom Nav agar muncul
    show('bottomNav');

    // Hapus efek aktif di semua tombol
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    // Aktifkan tab yang diklik
    if (tabName === 'home') {
        show('home-view');
        document.getElementById('tab-home').classList.add('active');
        
        // Auto Load Jika masih kosong
        if (document.getElementById('home-view').innerHTML === '') {
            loadLatest();
        } else {
            // Jalankan ulang animasi slider jika data sudah ada
            const wrapper = document.getElementById('heroWrapper');
            if (wrapper && !sliderInterval) {
                const totalSlides = document.querySelectorAll('.hero-slide').length;
                let currentSlide = 0;
                sliderInterval = setInterval(() => {
                    currentSlide++;
                    wrapper.style.transition = 'transform 0.5s ease-in-out';
                    wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
                    if (currentSlide >= totalSlides - 1) {
                        setTimeout(() => {
                            wrapper.style.transition = 'none';
                            currentSlide = 0;
                            wrapper.style.transform = `translateX(0)`;
                        }, 500); 
                    }
                }, 5000);
            }
        }
    } else if (tabName === 'anime') {
        show('anime-view');
        document.getElementById('tab-anime').classList.add('active');
    } else if (tabName === 'recent') {
        show('recent-view');
        document.getElementById('tab-recent').classList.add('active');
    } else if (tabName === 'schedule') {
        show('schedule-view');
        document.getElementById('tab-schedule').classList.add('active');
    } else if (tabName === 'profile') {
        show('profile-view');
        document.getElementById('tab-profile').classList.add('active');
    }
}

// --- FUNGSI LOAD HOME ---
async function loadLatest() {
    loader(true);
    const homeContainer = document.getElementById('home-view');
    homeContainer.innerHTML = ''; 

    try {
        const sliderSection = HOME_SECTIONS[0]; 
        let sliderData = [];

        try {
            const res = await fetch(`${API_BASE}/latest`);
            sliderData = await res.json();
        } catch (e) { 
            console.error("Gagal load slider", e); 
        }

        if (sliderData && sliderData.length > 0) {
            const top10 = sliderData.slice(0, 10);
            renderHeroSlider(sliderSection.title, top10, homeContainer);
            loader(false); 

            top10.forEach(async (item) => {
                try {
                    const detailRes = await fetch(`${API_BASE}/detail?url=${encodeURIComponent(item.url)}`);
                    const detailData = await detailRes.json();
                    if (detailData && detailData.info) {
                        const score = detailData.info.skor || detailData.info.score || 'N/A';
                        const type = detailData.info.tipe || detailData.info.type || 'Anime';
                        const musim = detailData.info.musim || detailData.info.season || '';
                        const rilis = detailData.info.dirilis || detailData.info.released || '';
                        const year = `${musim} ${rilis}`.trim() || 'Unknown';
                        
                        const metaElements = document.querySelectorAll(`.hero-meta[data-url="${item.url}"]`);
                        metaElements.forEach(el => {
                            el.innerHTML = `<span>⭐ ${score}</span> • <span>${type}</span> • <span>${year}</span>`;
                        });
                    }
                } catch (e) {}
            });
        } else {
            loader(false);
        }

        for (let i = 1; i < HOME_SECTIONS.length; i++) {
            const section = HOME_SECTIONS[i];
            (async () => {
                let combinedData = [];
                const promises = section.queries.map(q => 
                    fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`)
                        .then(res => res.json())
                        .catch(() => [])
                );
                const results = await Promise.all(promises);
                results.forEach(list => {
                    if(Array.isArray(list)) combinedData = [...combinedData, ...list];
                });
                combinedData = removeDuplicates(combinedData, 'url');

                if (combinedData.length > 0) {
                    if (combinedData.length < 6) combinedData = [...combinedData, ...combinedData, ...combinedData];
                    renderSection(section.title, combinedData.slice(0, 15), homeContainer);
                }
            })();
        }
    } catch (err) {
        console.error(err);
        loader(false);
    }
}

function removeDuplicates(array, key) {
    return [ ...new Map(array.map(item => [item[key], item])).values() ];
}

function renderHeroSlider(title, data, container) {
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'hero-section-container';

    const sliderDiv = document.createElement('div');
    sliderDiv.className = 'hero-slider';

    const loopData = [...data, data[0]];

    const slidesHtml = loopData.map((anime, index) => {
        const score = anime.score || 'N/A';
        const type = anime.type || 'Anime';
        const year = anime.year || 'Unknown';
        
        let epNumMatch = anime.episode ? anime.episode.match(/\d+(\.\d+)?/) : null;
        let eps = epNumMatch ? `Ep ${epNumMatch[0]}` : (anime.episode ? `Ep ${anime.episode}` : '');

        return `
            <div class="hero-slide">
                <img src="${anime.image}" class="hero-bg" alt="${anime.title}" loading="${index === 0 ? 'eager' : 'lazy'}">
                <div class="hero-overlay"></div>
                <div class="hero-content">
                    ${eps ? `<div class="hero-badge">${eps}</div>` : ''}
                    <h2 class="hero-title">${anime.title}</h2>
                    <div class="hero-meta" data-url="${anime.url}">
                        <span>⭐ ${score}</span> • <span>${type}</span> • <span>${year}</span>
                    </div>
                    <button onclick="loadDetail('${anime.url}')" class="hero-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Nonton Sekarang
                    </button>
                </div>
            </div>
        `;
    }).join('');

    sliderDiv.innerHTML = `<div class="hero-wrapper" id="heroWrapper">${slidesHtml}</div>`;
    sectionContainer.appendChild(sliderDiv);
    
    if (container.firstChild) {
        container.insertBefore(sectionContainer, container.firstChild);
    } else {
        container.appendChild(sectionContainer);
    }

    const wrapper = document.getElementById('heroWrapper');
    let currentSlide = 0;
    const totalSlides = loopData.length;

    if (sliderInterval) clearInterval(sliderInterval);

    sliderInterval = setInterval(() => {
        if (!wrapper || document.getElementById('home-view').classList.contains('hidden')) return;
        
        currentSlide++;
        wrapper.style.transition = 'transform 0.5s ease-in-out';
        wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;

        if (currentSlide === totalSlides - 1) {
            setTimeout(() => {
                if (!wrapper) return;
                wrapper.style.transition = 'none';
                currentSlide = 0;
                wrapper.style.transform = `translateX(0)`;
            }, 500); 
        }
    }, 5000); 
}

function renderSection(title, data, container) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'category-section';

    const searchKeyword = title.split(' ')[0];

    const headerHtml = `
        <div class="header-flex">
            <div class="section-header">
                <div class="bar-accent"></div>
                <h2>${title}</h2>
            </div>
            <a href="#" class="more-link" onclick="handleSearch('${searchKeyword}')">Lainnya</a>
        </div>
    `;

    const cardsHtml = data.map(anime => {
        const eps = anime.episode || anime.score || '?'; 
        const displayTitle = anime.title.length > 35 ? anime.title.substring(0, 35) + '...' : anime.title;
        
        return `
        <div class="scroll-card" onclick="loadDetail('${anime.url}')">
            <div class="scroll-card-img">
                <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                <div class="ep-badge">Ep ${eps}</div>
            </div>
            <div class="scroll-card-title">${displayTitle}</div>
        </div>
        `;
    }).join('');

    sectionDiv.innerHTML = headerHtml + `<div class="horizontal-scroll">${cardsHtml}</div>`;
    container.appendChild(sectionDiv);
}

// --- FUNGSI SEARCH YANG SUDAH DIUPDATE ---
async function handleSearch(manualQuery = null) {
    const searchInput = document.getElementById('searchInput');
    const query = manualQuery || searchInput.value;
    
    if (manualQuery) {
        searchInput.value = manualQuery;
    }
    
    // Jika input kosong, muat ulang Beranda (Home)
    if (!query) {
        switchTab('home');
        return;
    }

    // Pastikan masuk ke Tab Home saat hasil pencarian ditampilkan
    switchTab('home');

    loader(true);
    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        const homeContainer = document.getElementById('home-view');
        homeContainer.innerHTML = ''; 

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

async function loadDetail(url) {
    loader(true);
    try {
        const res = await fetch(`${API_BASE}/detail?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        
        // Sembunyikan semua & hilangkan Bottom Nav saat masuk Detail
        hide('home-view');
        hide('anime-view');
        hide('recent-view');
        hide('schedule-view');
        hide('profile-view');
        hide('watch-view');
        hide('bottomNav'); 
        show('detail-view');

        const info = data.info || {};
        const status = info.status || 'Ongoing';
        const score = info.skor || info.score || '0';
        const type = info.tipe || info.type || 'TV';
        const studio = "NimeStream"; 
        const totalEps = info.total_episode || info.episode || '?';
        const duration = info.durasi || info.duration || '0 Menit';
        const musim = info.musim || info.season || '';
        const rilis = info.dirilis || info.released || '';
        const seasonInfo = `${musim} ${rilis}`.trim() || 'Unknown Date';

        const genreText = info.genre || info.genres || '';
        const genres = genreText ? genreText.split(',').map(g => g.trim()) : ['Anime'];

        const isEpsExist = data.episodes && data.episodes.length > 0;
        const newestEpUrl = isEpsExist ? data.episodes[0].url : '';
        const oldestEpUrl = isEpsExist ? data.episodes[data.episodes.length - 1].url : '';
        
        let newestEpNum = '?';
        let totalEpCount = isEpsExist ? data.episodes.length : 0;
        
        if (isEpsExist) {
            let firstEpTitle = data.episodes[0].title;
            let match = firstEpTitle.match(/(?:Episode|Eps|Ep)\s*(\d+(\.\d+)?)/i);
            if (match) {
                newestEpNum = match[1];
            } else {
                let nums = firstEpTitle.match(/\d+/g);
                newestEpNum = nums ? nums[nums.length - 1] : totalEpCount;
            }
        }

        const playIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;

        document.getElementById('anime-info').innerHTML = `
            <div class="detail-breadcrumb">Beranda / ${data.title}</div>
            <h1 class="detail-title">${data.title}</h1>
            <div class="detail-subtitle">${info.japanese || data.title}</div>

            <div class="detail-main-layout">
                <div class="detail-poster">
                    <img src="${data.image}" alt="${data.title}">
                </div>
                
                <div class="detail-info-col">
                    <div class="detail-badges">
                        <span class="badge status">${status.replace(' ', '_')}</span>
                        <span class="badge score">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 
                            ${score}
                        </span>
                        <span class="badge type">${type}</span>
                    </div>

                    <div class="detail-genres">
                        ${genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                    </div>

                    <div class="detail-season">${seasonInfo.toUpperCase()}</div>

                    <p class="detail-synopsis">${data.description || 'Tidak ada deskripsi tersedia untuk anime ini.'}</p>

                    <div class="detail-actions">
                        <button class="btn-action" onclick="${oldestEpUrl ? `loadVideo('${oldestEpUrl}')` : `alert('Belum ada episode')`}">
                            ${playIcon} Nonton
                        </button>
                        <button class="btn-action" onclick="${newestEpUrl ? `loadVideo('${newestEpUrl}')` : `alert('Belum ada episode')`}">
                            ${playIcon} Terbaru (${newestEpNum})
                        </button>
                    </div>
                </div>
            </div>

            <div class="metadata-grid">
                <div class="meta-item">
                    <span class="meta-label">STUDIO</span>
                    <span class="meta-pill">${studio.toUpperCase()}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">TOTAL EPS</span>
                    <span class="meta-value">${totalEps}</span>
                </div>
                <div class="meta-item" style="grid-column: span 2;">
                    <span class="meta-label">DURASI</span>
                    <span class="meta-value">${duration}</span>
                </div>
            </div>
        `;

        document.getElementById('episode-header-container').innerHTML = `
            <div class="ep-header-wrapper">
                <h2 class="ep-header-title">Daftar Episode</h2>
                ${isEpsExist ? `<div class="ep-range-badge">1 - ${newestEpNum}</div>` : ''}
            </div>
        `;

        const epGrid = document.getElementById('episode-grid');
        epGrid.innerHTML = data.episodes.map(ep => {
            let displayTitle = '';
            let epNumMatch = ep.title.match(/(?:Episode|Eps|Ep)\s*(\d+(\.\d+)?)/i);
            
            if (epNumMatch) {
                displayTitle = epNumMatch[1];
            } else {
                let nums = ep.title.match(/\d+/g);
                displayTitle = nums ? nums[nums.length - 1] : ep.title;
            }
            
            if (displayTitle.length > 12) displayTitle = displayTitle.substring(0, 10) + '...';

            return `<div class="ep-box" title="${ep.title}" onclick="loadVideo('${ep.url}')">${displayTitle}</div>`;
        }).join('');

    } catch (err) {
        console.error(err);
    } finally {
        loader(false);
    }
}

async function loadVideo(url) {
    loader(true);
    try {
        const res = await fetch(`${API_BASE}/watch?url=${encodeURIComponent(url)}`);
        const data = await res.json();

        hide('detail-view');
        show('watch-view');
        hide('bottomNav'); // Pastikan Nav Bawah tetap hilang saat play video

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

function goHome() { 
    // Kembali dari Halaman Detail ke Tab Utama
    switchTab('home'); 
}

function backToDetail() {
    hide('watch-view');
    show('detail-view');
    document.getElementById('video-player').src = ''; 
}

// Inisiasi Pertama Saat Buka Web
document.addEventListener('DOMContentLoaded', () => {
    switchTab('home'); // Buka halaman Home dan otomatis load data
});

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
