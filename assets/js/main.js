// Fungsi Utama untuk Mengambil Data dari Google Sheets
async function fetchResep() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('resep-grid');

    try {
        // Tambahkan timestamp agar browser tidak mengambil data lama (cache)
        const response = await fetch(CONFIG.SHEET_CSV_URL + "&cache=" + new Date().getTime());
        const data = await response.text();
        
        // Memecah CSV menjadi baris dan membersihkan baris kosong
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1); 
        grid.innerHTML = '';

        if (rows.length === 0) {
            loader.innerHTML = "⚠️ Belum ada resep yang dipublikasikan.";
            return;
        }

        rows.forEach(row => {
            // Regex khusus untuk menangani koma di dalam teks yang diapit tanda kutip
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
            
            // Membersihkan tanda kutip ekstra yang sering ditambahkan Google Sheets
            const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());

            // Cek apakah kolom Status (H) berisi 'published'
            if (cleanCols.length > 1 && cleanCols[7]?.toLowerCase() === 'published') {
                const resep = {
                    id: cleanCols[0],
                    judul: cleanCols[1],
                    deskripsi: cleanCols[2],
                    bahan: cleanCols[3],
                    video: cleanCols[4],
                    harga: cleanCols[5] || "0",
                    img: cleanCols[6]
                };

                const card = document.createElement('div');
                card.className = 'resep-card';
                card.innerHTML = `
                    <div class="card-image">
                        <img src="${resep.img}" alt="${resep.judul}" onerror="this.src='https://via.placeholder.com/300x200?text=Foto+Masakan'">
                        <div class="badge-harga">Rp ${parseInt(resep.harga).toLocaleString('id-ID')}</div>
                    </div>
                    <div class="card-info">
                        <h3>${resep.judul}</h3>
                        <p>${resep.deskripsi.substring(0, 60)}...</p>
                        <button onclick="openResep('${resep.id}', '${resep.judul.replace(/'/g, "\\'")}', '${resep.bahan.replace(/'/g, "\\'")}', '${resep.harga}', '${resep.video}')">Lihat Detail</button>
                    </div>
                `;
                grid.appendChild(card);
            }
        });

        loader.classList.add('hidden');
        grid.classList.remove('hidden');
    } catch (error) {
        console.error("Gagal load data:", error);
        loader.innerHTML = "❌ Koneksi gagal. Pastikan link CSV di config.js sudah benar.";
    }
}

// Fungsi Membuka Modal Detail
function openResep(id, judul, bahan, harga, video) {
    const modal = document.getElementById('modalResep');
    const content = document.getElementById('detailContent');

    // Mengubah teks bahan menjadi daftar
    const daftarBahan = bahan.split(',').map(b => `<li>${b.trim()}</li>`).join('');

    content.innerHTML = `
        <h2 class="modal-title">${judul}</h2>
        <div class="section-title">Bahan-bahan (Gratis):</div>
        <ul class="bahan-list">${daftarBahan}</ul>
        
        <div class="paywall-section">
            <p>Ingin melihat video tutorial rahasia?</p>
            <button class="btn-bayar" onclick="bayarResep('${id}', '${harga}')">
                Buka Video (Rp ${parseInt(harga).toLocaleString('id-ID')})
            </button>
        </div>
    `;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalResep').classList.add('hidden');
}

function bayarResep(resepId, harga) {
    alert("Memicu Pembayaran Midtrans untuk Resep ID: " + resepId + " senilai Rp " + parseInt(harga).toLocaleString('id-ID'));
}

window.onload = fetchResep;
