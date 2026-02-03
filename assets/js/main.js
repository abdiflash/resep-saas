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

function openResep(id, judul, bahan, harga) {
    const modal = document.getElementById('modalResep');
    const content = document.getElementById('detailContent');

    // List bahan
    const daftarBahan = bahan.split(',').map(b => `<li>${b.trim()}</li>`).join('');
    
    // Icon SVG (Gembok & YouTube)
    const iconLock = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
    const iconYoutube = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>`;

    content.innerHTML = `
        <div class="modal-header">
            <h2>${judul}</h2>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <h4 style="margin-bottom:15px; color:#4e342e; font-weight:700;">Bahan-bahan:</h4>
            <ul class="bahan-list">${daftarBahan}</ul>
            
            <div class="paywall-box">
                <p style="font-size: 0.95rem; margin-bottom: 5px; color:#5d4037;">Ingin melihat tutorial rahasia?</p>
                <button class="btn-youtube" onclick="bayarResep('${id}', '${harga}')">
                    ${iconLock} ${iconYoutube} 
                    <span>Buka Video (${formatRupiah(harga).replace('Rp', '')})</span>
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
