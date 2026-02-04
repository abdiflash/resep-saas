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
                
                // --- OTOMATISASI LINK DROPBOX (0 ke 1 via raw=1) ---
                let finalImg = cleanCols[6]; // Mengambil data kolom G
                if (finalImg && typeof finalImg === 'string' && finalImg.includes('dropbox.com')) {
                    // Teknik mengganti karakter belakang secara otomatis
                    finalImg = finalImg.replace(/dl=0/g, 'raw=1').replace(/dl=1/g, 'raw=1');
                    
                    // Memastikan parameter raw=1 ada jika link tidak punya parameter
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
                        <img src="${resep.img}" alt="${resep.judul}" onerror="this.src='https://via.placeholder.com/300?text=Warisan+Dapur'">
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
        
        if (loader) loader.style.display = 'none';
    } catch (error) {
        if (loader) loader.innerHTML = "Gagal memuat data.";
    }
}

function bukaModalDetail(id, judul, bahan, harga) {
    const modal = document.getElementById('modalResep');
    const content = document.getElementById('detailContent');
    const listBahan = bahan.split(',').map(b => `<li>${b.trim()}</li>`).join('');

    content.innerHTML = `
        <div class="modal-header">
            <h2 style="color: #3d2b1f;">${judul}</h2>
            <button class="close-btn" onclick="tutupModal()">&times;</button>
        </div>
        <div class="modal-body">
            <h4 style="margin-bottom:10px; color: #3d2b1f;">Bahan-bahan:</h4>
            <ul class="bahan-list">${listBahan}</ul>
            
            <button class="btn-youtube" onclick="window.open('https://wa.me/628123456789?text=Saya+ingin+resep+${judul}')">
                Tonton Video (${formatRupiah(harga)})
            </button>
            
            <div style="height: 30px;"></div> 
        </div>
    `;
    modal.classList.remove('hidden');
    // Tambahkan ini agar setiap dibuka, scroll selalu balik ke atas
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTop = 0;
}

function tutupModal() {
    document.getElementById('modalResep').classList.add('hidden');
}

window.onload = fetchResep;
