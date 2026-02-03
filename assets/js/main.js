// Helper: Format Rupiah
const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka);
};

// Fungsi Utama: Ambil Data dari Google Sheet
async function fetchResep() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('resep-grid');

    try {
        // Tambah cache busting agar data selalu baru
        const url = CONFIG.SHEET_CSV_URL + "&cache=" + new Date().getTime();
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Gagal mengambil data");
        
        const data = await response.text();
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1);
        
        grid.innerHTML = ''; // Bersihkan area
        let jumlahResep = 0;

        rows.forEach((row) => {
            // Pemisahan kolom CSV yang aman
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());

            // Pastikan status Published
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

                // Buat Kartu Resep HTML
                const card = document.createElement('div');
                card.className = 'resep-card';
                card.innerHTML = `
                    <div class="card-image">
                        <img src="${resep.img}" alt="${resep.judul}" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${resep.judul}</h3>
                        <p class="card-desc">${resep.deskripsi}</p>
                        <div class="card-price">🏷️ ${formatRupiah(resep.harga)}</div>
                        <button class="btn-detail" onclick="bukaModalDetail('${resep.id}', '${escapeHtml(resep.judul)}', '${escapeHtml(resep.bahan)}', '${resep.harga}')">
                            Lihat Detail
                        </button>
                    </div>
                `;
                grid.appendChild(card);
                jumlahResep++;
            }
        });

        // Hilangkan tulisan "Sedang memuat..." jika data sudah ada
        if (jumlahResep > 0) {
            loader.style.display = 'none';
        } else {
            loader.innerHTML = "Belum ada resep yang tersedia.";
        }

    } catch (error) {
        console.error("Error:", error);
        loader.innerHTML = "Gagal memuat data. Cek koneksi atau link Google Sheet.";
    }
}

// Fungsi Buka Modal (Popup)
function bukaModalDetail(id, judul, bahan, harga) {
    const modal = document.getElementById('modalResep');
    const content = document.getElementById('detailContent');
    
    // Format bahan menjadi list
    const listBahan = bahan.split(',').map(item => `<li>${item.trim()}</li>`).join('');

    content.innerHTML = `
        <div class="modal-header">
            <h2>${judul}</h2>
            <button class="close-btn" onclick="tutupModal()">&times;</button>
        </div>
        <div class="modal-body">
            <h4>Bahan-bahan:</h4>
            <ul>${listBahan}</ul>
            <div class="modal-action">
                <p>Ingin lihat tutorial lengkapnya?</p>
                <button class="btn-youtube" onclick="bayarResep('${id}')">
                    Buka Video (${formatRupiah(harga)})
                </button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

// Fungsi Tutup Modal
function tutupModal() {
    document.getElementById('modalResep').classList.add('hidden');
}

// Fungsi Bayar (Placeholder)
function bayarResep(id) {
    alert("Fitur pembayaran untuk ID: " + id + " akan segera hadir!");
}

// Helper: Mencegah error tanda kutip pada HTML
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Jalankan saat halaman siap
window.onload = fetchResep;
