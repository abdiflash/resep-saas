const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka);
};

async function fetchResep() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('resep-grid');

    try {
        const url = CONFIG.SHEET_CSV_URL + "&cache=" + new Date().getTime();
        const response = await fetch(url);
        const data = await response.text();
        
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1);
        
        grid.innerHTML = ''; 
        let kartuDibuat = 0;

        rows.forEach((row) => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
            const status = (cleanCols[7] || "").toLowerCase();
            
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
                        <div class="badge-harga">${formatRupiah(resep.harga).replace('Rp', 'Rp ')}</div>
                    </div>
                    <div class="card-info">
                        <h3>${resep.judul}</h3>
                        <p>${resep.deskripsi}</p>
                        <button onclick="openModal('${resep.id}', '${resep.judul.replace(/'/g, "\\'")}', '${resep.bahan.replace(/'/g, "\\'")}', '${resep.harga}')">
                            Lihat Detail
                        </button>
                    </div>
                `;
                grid.appendChild(card);
                kartuDibuat++;
            }
        });
        
        if(kartuDibuat > 0) loader.classList.add('hidden');

    } catch (error) {
        console.error(error);
        loader.innerHTML = "Gagal memuat data resep.";
    }
}

function openModal(id, judul, bahan, harga) {
    const modal = document.getElementById('modalResep');
    const content = document.getElementById('detailContent');
    const listBahan = bahan.split(',').map(b => `<li>${b.trim()}</li>`).join('');

    content.innerHTML = `
        <div class="modal-header">
            <h2>${judul}</h2>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <h4 style="margin-bottom:10px;">Bahan-bahan (Gratis):</h4>
            <ul class="bahan-list">${listBahan}</ul>
            <p>Ingin melihat video tutorial rahasia?</p>
            <button class="btn-youtube" onclick="bayarResep('${id}')">
                Tonton Video Lengkap (${formatRupiah(harga)})
            </button>
        </div>
    `;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalResep').classList.add('hidden');
}

function bayarResep(id) {
    alert("Proses pembayaran untuk resep ID: " + id);
}

window.onload = fetchResep;
