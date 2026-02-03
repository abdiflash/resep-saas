// ... (Bagian atas formatRupiah tetap sama) ...
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

                // PERBAIKAN DI SINI:
                // Hapus via.placeholder.com. Jika error, ganti dengan warna abu-abu saja.
                const card = document.createElement('div');
                card.className = 'resep-card';
                card.innerHTML = `
                    <div class="card-image" style="background-color: #eee; display: flex; align-items: center; justify-content: center;">
                        <img src="${resep.img}" alt="${resep.judul}" style="width:100%; height:100%; object-fit:cover;" 
                             onerror="this.style.display='none'; this.parentNode.innerHTML='<span style=\\'color:#aaa; font-size:0.8rem\\'>Gambar Tidak Tersedia</span>'">
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${resep.judul}</h3>
                        <p class="card-desc">${resep.deskripsi}</p>
                        <div class="card-price">
                             <span>🏷️</span> ${formatRupiah(resep.harga)}
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
        
        if(kartuDibuat > 0) loader.classList.add('hidden');

    } catch (error) {
        console.error(error);
        loader.innerHTML = "Gagal memuat data.";
    }
}

// ... (function openResep, closeModal, bayarResep TETAP SAMA seperti sebelumnya) ...
// Pastikan function openResep Anda benar seperti di bawah ini:

function openResep(id, judul, bahan, harga) {
    const modal = document.getElementById('modalResep');
    const content = document.getElementById('detailContent');
    const daftarBahan = bahan.split(',').map(b => `<li>${b.trim()}</li>`).join('');
    
    // Kita paksa warna teks jadi hitam agar tidak "invisible"
    content.innerHTML = `
        <div class="modal-header" style="color: #333;">
            <h2 style="margin-right: 30px;">${judul}</h2>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body" style="color: #555;">
            <h4 style="margin:15px 0 10px;">Bahan-bahan:</h4>
            <ul style="padding-left:20px; margin-bottom:20px;">${daftarBahan}</ul>
            <button class="btn-youtube" onclick="bayarResep('${id}', '${harga}')">
                Buka Video (${formatRupiah(harga)})
            </button>
        </div>
    `;
    modal.classList.remove('hidden');
}

// JANGAN LUPA INI DI BAGIAN BAWAH
function closeModal() { document.getElementById('modalResep').classList.add('hidden'); }
function bayarResep(id, harga) { alert(`Membuka pembayaran untuk: ${id}`); }
window.onload = fetchResep;
