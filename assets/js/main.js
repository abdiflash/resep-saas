// --- main.js FINAL: SEARCH + FILTER + CARA MEMBUAT ---

let semuaResep = [];
let kategoriAktif = 'all'; 

// 1. FETCH DATA (MENGAMBIL DATA DARI SHEET)
async function fetchResep() {
    const loader = document.getElementById('loader');
    
    try {
        const response = await fetch(CONFIG.SHEET_CSV_URL + "&cache=" + new Date().getTime());
        const data = await response.text();
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1);
        
        semuaResep = []; 

        rows.forEach((row) => {
            // Regex pemisah koma (aman untuk koma dalam kutip)
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
            
            // --- UPDATED INDEX MAPPING (KARENA ADA KOLOM BARU) ---
            // A=0: ID
            // B=1: Judul
            // C=2: Deskripsi
            // D=3: Bahan
            // E=4: Cara Membuat (BARU)
            // F=5: Link Video
            // G=6: Kategori/Label
            // H=7: Gambar
            // I=8: Status
            
            // Cek Status di Kolom I (Index 8)
            const status = cleanCols[8] ? cleanCols[8].toLowerCase() : "";
            
            if (cleanCols.length > 1 && status === 'published') {
                
                // Fix Link Gambar Dropbox (Kolom H -> Index 7)
                let finalImg = cleanCols[7]; 
                if (finalImg && finalImg.includes('dropbox.com')) {
                    finalImg = finalImg.replace(/dl=0/g, 'raw=1').replace(/dl=1/g, 'raw=1');
                }

                const resep = {
                    id: cleanCols[0],          
                    judul: cleanCols[1],       
                    deskripsi: cleanCols[2],   
                    bahan: cleanCols[3],
                    
                    // KOLOM BARU (Index 4)
                    caraMembuat: cleanCols[4] || "Panduan belum tersedia.", 
                    
                    // GESER INDEX (+1)
                    linkVideo: cleanCols[5] || "#",  // Video skrg di Index 5 (Kolom F)
                    labelInfo: cleanCols[6] || "Umum", // Kategori skrg di Index 6 (Kolom G)
                    img: finalImg // Thumbnail skrg di Index 7 (Kolom H)
                };
                semuaResep.push(resep);
            }
        });
        
        if (loader) loader.style.display = 'none';

        // TAMPILKAN SEMUA DATA PERTAMA KALI
        tampilkanResep(semuaResep);

    } catch (error) {
        console.error(error);
        if (loader) loader.innerHTML = "Gagal memuat konten. Cek koneksi internet.";
    }
}

// 2. RENDER (MENAMPILKAN KARTU RESEP KE LAYAR)
function tampilkanResep(dataResep) {
    const grid = document.getElementById('resep-grid');
    if (!grid) return;

    grid.innerHTML = ''; 

    // Jika hasil pencarian kosong
    if (dataResep.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">
                <h3>Yah, resep tidak ditemukan 😢</h3>
                <p>Coba cari dengan kata kunci lain ya, Bunda!</p>
            </div>`;
        return;
    }

    dataResep.forEach(resep => {
        const card = document.createElement('div');
        card.className = 'resep-card';
        card.innerHTML = `
            <div class="card-image">
                <img src="${resep.img}" alt="${resep.judul}" onerror="this.src='https://via.placeholder.com/300?text=Resep+Mama'">
                <div class="badge-harga">
                    ${resep.labelInfo}
                </div>
            </div>
            <div class="card-info">
                <h3>${resep.judul}</h3>
                <p>${resep.deskripsi}</p>
                <button onclick="bukaModalDetail('${resep.id}')">
                    Mulai Masak
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 3. LOGIKA FILTER (PENCARIAN & KATEGORI)
function filterResep() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    const hasilFilter = semuaResep.filter(resep => {
        // Cek Judul
        const matchJudul = resep.judul.toLowerCase().includes(searchInput);
        
        // Cek Kategori (Tombol)
        const matchKategori = (kategoriAktif === 'all') || 
                              (resep.labelInfo.toLowerCase().includes(kategoriAktif));

        return matchJudul && matchKategori;
    });

    tampilkanResep(hasilFilter);
}

// Fungsi saat tombol kategori diklik
function filterKategori(kategori, elemenTombol) {
    kategoriAktif = kategori;
    
    // Update warna tombol aktif
    const buttons = document.querySelectorAll('.btn-filter');
    buttons.forEach(btn => btn.classList.remove('active'));
    elemenTombol.classList.add('active');

    // Jalankan filter ulang
    filterResep();
}

// 4. MODAL DETAIL (DENGAN CARA MEMBUAT)
function bukaModalDetail(id) {
    const resep = semuaResep.find(r => r.id === id);
    if (!resep) return;

    const modal = document.getElementById('modalResep');
    const modalHeaderTitle = modal.querySelector('.modal-header h2');
    const modalBody = modal.querySelector('.modal-body');

    modalHeaderTitle.textContent = resep.judul;
    
    // Format List Bahan
    const listBahanHTML = resep.bahan.split(',')
        .map(b => `<li>${b.trim()}</li>`)
        .join('');
    
    // Format Cara Membuat (Ubah baris baru excel jadi paragraf HTML)
    const caraMembuatHTML = resep.caraMembuat.replace(/\n/g, '<br><br>');

    modalBody.innerHTML = `
        <div class="body-wrapper">
            <div style="margin-bottom: 20px;">${buatVideoPlayer(resep.linkVideo)}</div>
            
            <div style="background: #fff4e6; padding: 12px; border-radius: 12px; margin-bottom: 20px; font-size: 14px; color: #8d5d2b; border: 1px solid #ffe8cc;">
                <strong>📂 Kategori:</strong> ${resep.labelInfo}
            </div>

            <div class="resep-split-content">
                <div class="bahan-section">
                    <h4 style="margin-bottom:15px; color: #3d2b1f; border-bottom: 2px solid #e67e22; display:inline-block; padding-bottom:5px;">🛒 Bahan-bahan:</h4>
                    <ul class="bahan-list">${listBahanHTML}</ul>
                </div>
                
                <hr style="margin: 25px 0; border: 0; border-top: 1px dashed #ccc;">

                <div class="cara-section">
                    <h4 style="margin-bottom:15px; color: #3d2b1f; border-bottom: 2px solid #e67e22; display:inline-block; padding-bottom:5px;">👩‍🍳 Cara Membuat:</h4>
                    <div style="line-height: 1.8; color: #444; font-size: 15px;">
                        ${caraMembuatHTML}
                    </div>
                </div>
            </div>
            
            <div style="height: 30px;"></div>
        </div>
    `;
    modal.classList.remove('hidden');
}

// 5. VIDEO PLAYER
function buatVideoPlayer(link) {
    if (!link || link === '#' || link.length < 5) {
        return `<div style="padding: 40px; text-align:center; background:#f8fafc; border-radius:12px; border: 1px dashed #cbd5e1;"><p>🔒 Video belum tersedia.</p></div>`;
    }
    if (link.includes('youtube.com') || link.includes('youtu.be')) {
        let videoId = '';
        try {
            const urlObj = new URL(link);
            if (link.includes('/shorts/')) {
                const pathSegments = urlObj.pathname.split('/');
                const shortsIndex = pathSegments.indexOf('shorts');
                if (shortsIndex !== -1 && pathSegments[shortsIndex + 1]) videoId = pathSegments[shortsIndex + 1];
            } else if (link.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
            } else {
                videoId = urlObj.searchParams.get('v');
            }
        } catch (e) { console.error("Gagal parsing URL Youtube:", e); }

        if (videoId) {
            return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background: #000;">
                <iframe src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" allowfullscreen></iframe>
            </div>`;
        }
    }
    return `<a href="${link}" target="_blank" class="btn-youtube">▶ Putar Video Tutorial</a>`;
}

function tutupModal() {
    document.getElementById('modalResep').classList.add('hidden');
}

// Jalankan saat halaman siap
window.onload = fetchResep;
