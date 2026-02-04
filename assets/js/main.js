const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka);
};

async function fetchResep() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('resep-grid');

    try {
        const response = await fetch(CONFIG.SHEET_CSV_URL + "&cache=" + new Date().getTime());
        const data = await response.text();
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1);
        
        grid.innerHTML = ''; 

        rows.forEach((row) => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
            const status = cleanCols[7] ? cleanCols[7].toLowerCase() : "";
            
            if (cleanCols.length > 1 && status === 'published') {
                
                // --- TEKNIK RAW=1 DROPBOX ---
                let finalImg = cleanCols[6]; // Kolom G (Thumbnail)
                if (finalImg && typeof finalImg === 'string' && finalImg.includes('dropbox.com')) {
                    // Mengganti dl=0 atau dl=1 menjadi raw=1 agar direct link
                    finalImg = finalImg.replace(/dl=0/g, 'raw=1').replace(/dl=1/g, 'raw=1');
                    if (!finalImg.includes('raw=1')) {
                        finalImg += finalImg.includes('?') ? '&raw=1' : '?raw=1';
                    }
                }

                const resep = {
                    id: cleanCols[0],
                    judul: cleanCols[1],
                    deskripsi: cleanCols[2],
                    bahan: cleanCols[3],
                    harga: cleanCols[5] || "0",
                    img: finalImg
                };

                const card = document.createElement('div');
                card.className = 'resep-card';
                card.innerHTML = `
                    <div class="card-image">
                        <img src="${resep.img}" alt="${resep.judul}" onerror="this.src='https://via.placeholder.com/300?text=Foto+Mama+Love'">
                        <div class="badge-harga">${formatRupiah(resep.harga).replace('Rp', '').trim()}</div>
                    </div>
                    <div class="card-info">
                        <h3>${resep.judul}</h3>
                        <p>${resep.deskripsi}</p>
                        <button onclick="bukaModalDetail('${resep.id}', '${resep.judul.replace(/'/g, "\\'")}', '${resep.bahan.replace(/'/g, "\\'")}', '${resep.harga}')">
                            Lihat Resep
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            }
        });
        
        loader.style.display = 'none';
    } catch (error) {
        loader.innerHTML = "Gagal memuat data.";
    }
}

function bukaModalDetail(id, judul, bahan, harga) {
    const modal = document.getElementById('modalResep');
    const content = document.getElementById('detailContent');
    
    // Menangani daftar bahan agar lebih rapi
    const listBahan = bahan.split(',').map(b => `<li>${b.trim()}</li>`).join('');

    content.innerHTML = `
        <div class="modal-header">
            <h2>${judul}</h2>
            <button class="close-btn" onclick="tutupModal()">&times;</button>
        </div>
        <div class="modal-body">
            <h4 style="margin-bottom:10px;">Bahan-bahan:</h4>
            <ul class="bahan-list">${listBahan}</ul>
            
            <div style="margin-top:20px; padding:15px; background:#fdf8f5; border-radius:12px; text-align:center;">
                <p style="font-size:0.8rem; color:#666; margin-bottom:10px;">Ingin melihat tutorial lengkapnya?</p>
                <button class="btn-youtube" onclick="konfirmasiWA('${judul}', '${harga}')">
                    Buka Video (${formatRupiah(harga)})
                </button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

// Fungsi Tambahan: Chat WA otomatis untuk konfirmasi
function konfirmasiWA(judul, harga) {
    const noWA = "628123456789"; // GANTI DENGAN NOMOR ANDA
    const pesan = `Halo Warisan Dapur Mama Love, saya ingin membeli akses video resep: *${judul}* seharga ${formatRupiah(harga)}.`;
    window.open(`https://wa.me/${noWA}?text=${encodeURIComponent(pesan)}`, '_blank');
}

function tutupModal() {
    document.getElementById('modalResep').classList.add('hidden');
}

window.onload = fetchResep;
