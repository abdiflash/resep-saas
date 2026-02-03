// Fungsi Utama untuk Mengambil Data dari Google Sheets
async function fetchResep() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('resep-grid');

    try {
        const response = await fetch(CONFIG.SHEET_CSV_URL);
        const data = await response.text();
        
        // Memecah CSV menjadi baris
        const rows = data.split('\n').slice(1); 
        grid.innerHTML = '';

        rows.forEach(row => {
            // Memecah kolom (asumsi pemisah koma)
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
            
            if (cols.length > 1 && cols[7]?.trim().toLowerCase() === 'published') {
                const resep = {
                    id: cols[0].trim(),
                    judul: cols[1].trim(),
                    deskripsi: cols[2].trim(),
                    bahan: cols[3].trim(),
                    video: cols[4].trim(),
                    harga: cols[5].trim(),
                    img: cols[6].trim()
                };

                // Membuat elemen Kartu Resep
                const card = document.createElement('div');
                card.className = 'resep-card';
                card.innerHTML = `
                    <div class="card-image">
                        <img src="${resep.img}" alt="${resep.judul}" onerror="this.src='https://via.placeholder.com/300x200?text=Foto+Masakan'">
                        <div class="badge-harga">Rp ${parseInt(resep.harga).toLocaleString()}</div>
                    </div>
                    <div class="card-info">
                        <h3>${resep.judul}</h3>
                        <p>${resep.deskripsi.substring(0, 60)}...</p>
                        <button onclick="openResep('${resep.id}', '${resep.judul}', '${resep.bahan.replace(/'/g, "\\'")}', '${resep.harga}', '${resep.video}')">Lihat Detail</button>
                    </div>
                `;
                grid.appendChild(card);
            }
        });

        loader.classList.add('hidden');
        grid.classList.remove('hidden');
    } catch (error) {
        console.error("Gagal load data:", error);
        loader.innerHTML = "❌ Gagal memuat data. Pastikan Google Sheet sudah 'Publish to Web'.";
    }
}

// Fungsi Membuka Modal Detail
function openResep(id, judul, bahan, harga, video) {
    const modal = document.getElementById('modalResep');
    const content = document.getElementById('detailContent');

    // Mengubah teks bahan menjadi daftar (bullet points)
    const daftarBahan = bahan.split(',').map(b => `<li>${b.trim()}</li>`).join('');

    content.innerHTML = `
        <h2 class="modal-title">${judul}</h2>
        <div class="section-title">Bahan-bahan (Gratis):</div>
        <ul class="bahan-list">${daftarBahan}</ul>
        
        <div class="paywall-section">
            <p>Ingin melihat video tutorial rahasia?</p>
            <button class="btn-bayar" onclick="bayarResep('${id}', '${harga}')">
                Buka Video (Rp ${parseInt(harga).toLocaleString()})
            </button>
        </div>
    `;
    modal.classList.remove('hidden');
}

// Fungsi Tutup Modal
function closeModal() {
    document.getElementById('modalResep').classList.add('hidden');
}

// Fungsi Integrasi Midtrans (Sistem Gembok)
function bayarResep(resepId, harga) {
    // Di sini nanti kita hubungkan dengan API Midtrans Split Payment
    alert("Memicu Pembayaran Midtrans untuk Resep ID: " + resepId + " senilai Rp " + harga);
    
    // Contoh Simulasi Jika Sukses Bayar:
    // snap.pay('SNAP_TOKEN_DARI_BACKEND', { ... logic ... });
}

// Jalankan fungsi saat halaman dimuat
window.onload = fetchResep;
