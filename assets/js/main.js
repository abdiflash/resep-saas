// Konfigurasi Format Rupiah
const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka);
};

async function fetchResep() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('resep-grid');

    try {
        // Cache busting agar data selalu fresh
        const url = CONFIG.SHEET_CSV_URL + "&cache=" + new Date().getTime();
        const response = await fetch(url);
        const data = await response.text();
        
        // Parsing CSV
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1);
        
        grid.innerHTML = ''; // Bersihkan loader
        let kartuDibuat = 0;

        rows.forEach((row) => {
            // Regex cerdas untuk memisahkan koma dalam CSV tapi mengabaikan koma dalam tanda kutip
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());

            // Pastikan data ada isinya dan status Published
            const status = cleanCols[7] ? cleanCols[7].toLowerCase() : "";
            
            if (cleanCols.length > 1 && status === 'published') {
                const resep = {
                    id: cleanCols[0],
                    judul: cleanCols[1],
                    deskripsi: cleanCols[2],
                    bahan: cleanCols[3],
                    video: cleanCols[4],
                    harga: cleanCols[5] || "0",
                    img: cleanCols[6]
                };

                // BUAT KARTU HTML (Sesuai Desain Baru)
                const card = document.createElement('div');
                card.className = 'resep-card';
                card.innerHTML = `
                    <div class="card-image">
                        <img src="${resep.img}" alt="${resep.judul}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${resep.judul}</h3>
                        <p class="card-desc">${resep.deskripsi}</p>
                        
                        <div class="card-price">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            ${formatRupiah(resep.harga)}
                        </div>

                        <button class="btn-detail" onclick="openResep('${resep.id}', '${resep.judul.replace(/'/g, "\\'")}', '${resep.bahan.replace(/'/g, "\\'")}', '${resep.harga}')">
                            Lihat Detail
                        </button>
                    </div>
                `;
                grid.appendChild(card);
                kartuDibuat++;
            }
        });

        if (kartuDibuat === 0) {
             loader.innerHTML = "Belum ada resep yang dipublish.";
        } else {
             loader.classList.add('hidden'); // Sembunyikan loader jika ada data
        }

    } catch (error) {
        console.error("Error:", error);
        loader.innerHTML = "Gagal memuat data. Cek koneksi internet.";
    }
}

// Fungsi Modal Popup (Sama seperti sebelumnya)
function openResep(id, judul, bahan, harga) {
    const modal = document.getElementById('modalResep');
    const content = document.getElementById('detailContent');
    const daftarBahan = bahan.split(',').map(b => `<li>${b.trim()}</li>`).join('');
    
    content.innerHTML = `
        <div class="modal-header">
            <h2>${judul}</h2>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <h4 style="margin-bottom:10px;">Bahan-bahan:</h4>
            <ul style="margin-bottom:20px; padding-left:20px;">${daftarBahan}</ul>
            <hr style="margin:20px 0; border:0; border-top:1px solid #eee;">
            <p>Ingin melihat video tutorial lengkap?</p>
            <button class="btn-youtube" onclick="bayarResep('${id}', '${harga}')">
                Buka Video (${formatRupiah(harga)})
            </button>
        </div>
    `;
    modal.classList.remove('hidden');
}

function closeModal() { document.getElementById('modalResep').classList.add('hidden'); }
function bayarResep(id, harga) { alert(`Membuka pembayaran untuk: ${id}`); }

window.onload = fetchResep;
