// Fungsi format Rupiah
const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka);
};

// Fungsi ambil data dari Google Sheets
async function fetchResep() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('resep-grid');

    try {
        // Menggunakan URL dari config.js
        const response = await fetch(CONFIG.SHEET_CSV_URL + "&cache=" + new Date().getTime());
        const data = await response.text();
        
        // Pecah baris CSV
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1);
        grid.innerHTML = ''; 

        rows.forEach((row) => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
            
            // Kolom: 1=Judul, 2=Deskripsi, 3=Bahan, 5=Harga, 6=Gambar, 7=Status
            if (cleanCols[7] && cleanCols[7].toLowerCase() === 'published') {
                const card = document.createElement('div');
                card.className = 'resep-card';
                card.innerHTML = `
                    <div class="card-image">
                        <img src="${cleanCols[6]}" alt="${cleanCols[1]}" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                        <div class="badge-harga">${formatRupiah(cleanCols[5]).replace('Rp', 'Rp ')}</div>
                    </div>
                    <div class="card-info">
                        <h3>${cleanCols[1]}</h3>
                        <p>${cleanCols[2]}</p>
                        <button onclick="openModal('${cleanCols[1].replace(/'/g, "\\'")}', '${cleanCols[3].replace(/'/g, "\\'")}', '${cleanCols[5]}')">
                            Lihat Detail
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            }
        });
        
        if (loader) loader.style.display = 'none';

    } catch (error) {
        console.error("Error:", error);
        if (loader) loader.innerHTML = "Gagal memuat resep. Cek koneksi atau URL Sheet.";
    }
}

// Fungsi Modal
function openModal(judul, bahan, harga) {
    const modal = document.getElementById('modalResep');
    const content = document.getElementById('detailContent');
    const listBahan = bahan.split(',').map(b => `<li>${b.trim()}</li>`).join('');

    content.innerHTML = `
        <div class="modal-header">
            <h2>${judul}</h2>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <h4>Bahan-bahan:</h4>
            <ul class="bahan-list">${listBahan}</ul>
            <button class="btn-youtube" onclick="alert('Lanjut ke Pembayaran...')">
                Tonton Video Tutorial (${formatRupiah(harga)})
            </button>
        </div>
    `;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalResep').classList.add('hidden');
}

// Jalankan fungsi saat halaman siap
window.onload = fetchResep;
