// --- main.js VERSI MEMBER AREA (NETFLIX STYLE) ---

let semuaResep = [];

// Fungsi Format Text (Opsional, untuk merapikan)
const capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// 1. FETCH DATA
async function fetchResep() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('resep-grid'); 

    try {
        // Ambil data dari CSV
        const response = await fetch(CONFIG.SHEET_CSV_URL + "&cache=" + new Date().getTime());
        const data = await response.text();
        
        // Hapus header dan baris kosong
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1);
        
        if(grid) grid.innerHTML = ''; 
        semuaResep = [];

        rows.forEach((row) => {
            // Pemisah koma (Regex agar koma dalam kutip aman)
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
            
            // Kolom H (Index 7) = Status (Published)
            const status = cleanCols[7] ? cleanCols[7].toLowerCase() : "";
            
            if (cleanCols.length > 1 && status === 'published') {
                
                // Fix Link Gambar Dropbox
                let finalImg = cleanCols[6]; 
                if (finalImg && finalImg.includes('dropbox.com')) {
                    finalImg = finalImg.replace(/dl=0/g, 'raw=1').replace(/dl=1/g, 'raw=1');
                }

                // DATA MAPPING
                const resep = {
                    id: cleanCols[0],          // Col A
                    judul: cleanCols[1],       // Col B
                    deskripsi: cleanCols[2],   // Col C
                    bahan: cleanCols[3],       // Col D
                    // Col F (Index 5) DULU HARGA -> SEKARANG JADI LABEL (Kategori/Durasi)
                    labelInfo: cleanCols[5] || "Umum", 
                    img: finalImg,             // Col G
                    // Col E (Index 4) -> LINK YOUTUBE (Wajib ada di Sheet kolom I)
                    linkVideo: cleanCols[4] || "#"
                };

                semuaResep.push(resep);

                // TAMPILAN CARD (Grid Depan)
                if(grid) {
                    const card = document.createElement('div');
                    card.className = 'resep-card';
                    card.innerHTML = `
                        <div class="card-image">
                            <img src="${resep.img}" alt="${resep.judul}" onerror="this.src='https://via.placeholder.com/300?text=Resep+Spesial'">
                            
                            <div class="badge-harga" style="background:#e67e22; font-size: 12px;">
                                ${resep.labelInfo}
                            </div>
                        </div>
                        <div class="card-info">
                            <h3>${resep.judul}</h3>
                            <p>${resep.deskripsi}</p>
                            <button onclick="bukaModalDetail('${resep.id}')">
                                Tonton Video
                            </button>
                        </div>
                    `;
                    grid.appendChild(card);
                }
            }
        });
        
        if (loader) loader.style.display = 'none';

    } catch (error) {
        console.error(error);
        if (loader) loader.innerHTML = "Gagal memuat konten. Coba refresh.";
    }
}

// 2. BUKA MODAL (DETAIL RESEP)
function bukaModalDetail(id) {
    const resep = semuaResep.find(r => r.id === id);
    if (!resep) return;

    const modal = document.getElementById('modalResep');
    const modalHeaderTitle = modal.querySelector('.modal-header h2');
    const modalBody = modal.querySelector('.modal-body');

    modalHeaderTitle.textContent = resep.judul;

    const listBahanHTML = resep.bahan.split(',')
        .map(b => `<li>${b.trim()}</li>`)
        .join('');

    // RENDER ISI MODAL (Video di Atas)
    modalBody.innerHTML = `
        <div class="body-wrapper">
            
            <div style="margin-bottom: 20px;">
               ${buatVideoPlayer(resep.linkVideo)}
            </div>

            <div style="background: #fff4e6; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 14px; color: #8d5d2b;">
                <strong>Kategori:</strong> ${resep.labelInfo}
            </div>

            <h4 style="margin-bottom:10px; color: #3d2b1f; font-weight: bold;">Bahan-bahan:</h4>
            <ul class="bahan-list">
                ${listBahanHTML}
            </ul>
            
            <div style="height: 20px;"></div>
        </div>
    `;

    modal.classList.remove('hidden');
}

// 3. LOGIKA PLAYER VIDEO (Youtube Embed)
// FUNGSI UPDATE: Support Youtube Shorts, Video Biasa, & Link Pendek
function buatVideoPlayer(link) {
    if (!link || link === '#' || link.length < 5) {
        return `
            <div style="padding: 40px; text-align:center; background:#f0f0f0; border-radius:10px;">
                <p>🔒 Video belum tersedia.</p>
            </div>`;
    }

    // Deteksi apakah ini link YouTube (Biasa / Shorts / youtu.be)
    if (link.includes('youtube.com') || link.includes('youtu.be')) {
        let videoId = '';

        try {
            const urlObj = new URL(link);

            if (link.includes('/shorts/')) {
                // KASUS 1: Youtube Shorts
                // Ambil ID setelah kata "/shorts/"
                // Contoh: youtube.com/shorts/t1p0S_8vV-Y?si=... -> t1p0S_8vV-Y
                const pathSegments = urlObj.pathname.split('/');
                const shortsIndex = pathSegments.indexOf('shorts');
                if (shortsIndex !== -1 && pathSegments[shortsIndex + 1]) {
                    videoId = pathSegments[shortsIndex + 1];
                }
            } else if (link.includes('youtu.be')) {
                // KASUS 2: Link Pendek (youtu.be/ID)
                videoId = urlObj.pathname.slice(1);
            } else {
                // KASUS 3: Youtube Biasa (watch?v=ID)
                videoId = urlObj.searchParams.get('v');
            }
        } catch (e) {
            console.error("Gagal parsing URL Youtube:", e);
        }

        // Jika ID ditemukan, tampilkan Player
        if (videoId) {
            return `
            <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius:10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background: #000;">
                <iframe src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" 
                allowfullscreen></iframe>
            </div>`;
        }
    }

    // Jika Link Google Drive / Dropbox / Lainnya
    return `
        <a href="${link}" target="_blank" class="btn-youtube" style="display:block; text-align:center; text-decoration:none;">
            ▶ Putar Video Tutorial
        </a>
    `;
}

function tutupModal() {
    const modal = document.getElementById('modalResep');
    modal.classList.add('hidden');
}

window.onload = fetchResep;
