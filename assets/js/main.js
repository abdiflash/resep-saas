// Konfigurasi Rupiah
const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka);
};

// Fungsi Utama
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

                // STRUKTUR HTML DISESUAIKAN DENGAN CSS ANDA
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
                        <button onclick="bukaModalDetail('${resep.id}', '${escapeHtml(resep.judul)}', '${escapeHtml(resep.bahan)}', '${resep.harga}')">
                            Lihat Resep
                        </button>
                    </div>
                `;
                grid.appendChild(card);
                kartuDibuat++;
            }
        });
        
        if(kartuDibuat > 0) loader.style.display = 'none';

    } catch (error) {
        console.error(error);
        loader.innerHTML = "Gagal memuat data.";
    }
}

// Fungsi Buka Modal (Disesuaikan dengan struktur CSS Modal UX Baru)
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
            
            <button class="btn-youtube" onclick="bayarResep('${id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                Buka Video Tutorial (${formatRupiah(harga)})
            </button>
        </div>
    `;
    modal.classList.remove('hidden');
}

function tutupModal() {
    document.getElementById('modalResep').classList.add('hidden');
}

function bayarResep(id) {
    alert("Fitur bayar untuk ID: " + id);
}

function escapeHtml(text) {
    return text.replace(/'/g, "&#039;").replace(/"/g, "&quot;");
}

window.onload = fetchResep;
