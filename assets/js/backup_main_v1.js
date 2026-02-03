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
        const response = await fetch(CONFIG.SHEET_CSV_URL + "&cache=" + new Date().getTime());
        const data = await response.text();
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1);
        
        grid.innerHTML = '';

        rows.forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());

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

                // Card Template
                const card = document.createElement('div');
                card.className = 'resep-card';
                card.innerHTML = `
                    <div class="card-image">
                        <img src="${resep.img}" alt="${resep.judul}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                        <div class="badge-harga">${formatRupiah(resep.harga).replace('Rp', '')}</div>
                    </div>
                    <div class="card-info">
                        <h3>${resep.judul}</h3>
                        <p>${resep.deskripsi}</p>
                        <button onclick="openResep('${resep.id}', '${resep.judul.replace(/'/g, "\\'")}', '${resep.bahan.replace(/'/g, "\\'")}', '${resep.harga}')">Lihat Detail</button>
                    </div>
                `;
                grid.appendChild(card);
            }
        });
        loader.classList.add('hidden');
        grid.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        loader.innerHTML = "Gagal memuat data.";
    }
}

// Fungsi Buka Modal dengan UX Baru
function openResep(id, judul, bahan, harga) {
    const modal = document.getElementById('modalResep');
    const content = document.getElementById('detailContent');

    // Rapikan daftar bahan
    const daftarBahan = bahan.split(',').map(b => `<li>${b.trim()}</li>`).join('');
    
    // Ikon YouTube (SVG)
    const iconYoutube = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>`;

    content.innerHTML = `
        <div class="modal-header">
            <h2>${judul}</h2>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <h4 style="margin-bottom:10px; color:#64748b;">Bahan-bahan:</h4>
            <ul class="bahan-list">${daftarBahan}</ul>
            
            <div style="margin-top: 30px; text-align: center; padding: 20px; background: #fef2f2; border-radius: 12px;">
                <p style="font-size: 0.9rem; margin-bottom: 10px;">Ingin melihat tutorial lengkapnya?</p>
                <button class="btn-youtube" onclick="bayarResep('${id}', '${harga}')">
                    ${iconYoutube} 
                    Buka Video (${formatRupiah(harga)})
                </button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalResep').classList.add('hidden');
}

function bayarResep(id, harga) {
    alert(`Membuka pembayaran Midtrans untuk: ${id} senilai ${formatRupiah(harga)}`);
}

window.onload = fetchResep;

