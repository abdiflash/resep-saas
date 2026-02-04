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
                const resep = {
                    id: cleanCols[0],
                    judul: cleanCols[1],
                    deskripsi: cleanCols[2],
                    bahan: cleanCols[3],
                    harga: cleanCols[5] || "0",
                    img: cleanCols[6]
                };

                const card = document.createElement('div');
                card.className = 'resep-card';
                card.innerHTML = `
                    <div class="card-image">
                        <img src="${resep.img}" alt="${resep.judul}" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
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
    const listBahan = bahan.split(',').map(b => `<li>${b.trim()}</li>`).join('');

    content.innerHTML = `
        <div class="modal-header">
            <h2>${judul}</h2>
            <button class="close-btn" onclick="tutupModal()">&times;</button>
        </div>
        <div class="modal-body">
            <h4 style="margin-bottom:10px;">Bahan-bahan:</h4>
            <ul class="bahan-list">${listBahan}</ul>
            <button class="btn-youtube" onclick="alert('Lanjut ke tutorial: ' + '${id}')">
                Tonton Video (${formatRupiah(harga)})
            </button>
        </div>
    `;
    modal.classList.remove('hidden');
}

function tutupModal() {
    document.getElementById('modalResep').classList.add('hidden');
}

window.onload = fetchResep;
