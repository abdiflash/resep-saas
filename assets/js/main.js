// --- main.js FIX & UPDATED ---

// 1. Variabel Global untuk menyimpan data agar mudah dipanggil
let semuaResep = [];

const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka);
};

// 2. Fungsi Fetch Data dari Google Sheet
async function fetchResep() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('resep-grid');

    try {
        // Pastikan CONFIG.SHEET_CSV_URL sudah ada di config.js
        const response = await fetch(CONFIG.SHEET_CSV_URL + "&cache=" + new Date().getTime());
        const data = await response.text();
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1);
        
        grid.innerHTML = ''; 
        semuaResep = []; // Reset data global

        rows.forEach((row) => {
            // Regex untuk memisahkan koma dalam CSV dengan aman
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
            
            // Kolom H (Index 7) = Status (Published/Draft)
            const status = cleanCols[7] ? cleanCols[7].toLowerCase() : "";
            
            if (cleanCols.length > 1 && status === 'published') {
                
                // --- LOGIC GAMBAR (Dropbox Auto Fix) ---
                let finalImg = cleanCols[6]; 
                if (finalImg && typeof finalImg === 'string' && finalImg.includes('dropbox.com')) {
                    finalImg = finalImg.replace(/dl=0/g, 'raw=1').replace(/dl=1/g, 'raw=1');
                    if (!finalImg.includes('raw=1')) {
                        finalImg += finalImg.includes('?') ? '&raw=1' : '?raw=1';
                    }
                }

                // Simpan ke object
                const resep = {
                    id: cleanCols[0],          // Kolom A
                    judul: cleanCols[1],       // Kolom B
                    deskripsi: cleanCols[2],   // Kolom C
                    bahan: cleanCols[3],       // Kolom D
                    harga: cleanCols[5] || "0",// Kolom F
                    img: finalImg              // Kolom G
                };

                // Masukkan ke variabel global
                semuaResep.push(resep);

                // Buat Kartu HTML
                const card = document.createElement('div');
                card.className = 'resep-card';
                
                // PENTING: onclick sekarang hanya kirim ID, bukan seluruh teks panjang
                // Ini mencegah error jika ada tanda kutip pada judul/deskripsi
                card.innerHTML = `
                    <div class="card-image">
                        <img src="${resep.img}" alt="${resep.judul}" onerror="this.src='https://via.placeholder.com/300?text=Warisan+Dapur'">
                        <div class="badge-harga">${formatRupiah(resep.harga).replace('Rp', '').trim()}</div>
                    </div>
                    <div class="card-info">
                        <h3>${resep.judul}</h3>
                        <p>${resep.deskripsi}</p>
                        <button onclick="bukaModalDetail('${resep.id}')">
                            Lihat Resep
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            }
        });
        
        if (loader) loader.style.display = 'none';
    } catch (error) {
        console.error(error);
        if (loader) loader.innerHTML = "Gagal memuat data. Periksa koneksi atau URL Config.";
    }
}

// 3. Fungsi Buka Modal (DISESUAIKAN DENGAN HTML BARU)
function bukaModalDetail(id) {
    // Cari data resep berdasarkan ID dari variabel global
    const resep = semuaResep.find(r => r.id === id);
    if (!resep) return; // Stop jika data tidak ketemu

    const modal = document.getElementById('modalResep');
    
    // Target Element sesuai HTML baru
    const modalHeaderTitle = modal.querySelector('.modal-header h2');
    const modalBody = modal.querySelector('.modal-body');

    // A. Isi Judul di Header (Header tetap diam saat scroll)
    modalHeaderTitle.textContent = resep.judul;

    // B. Siapkan List Bahan
    // Memisahkan bahan berdasarkan koma (,) menjadi list <li>
    const listBahanHTML = resep.bahan.split(',')
        .map(b => `<li>${b.trim()}</li>`)
        .join('');

    // C. Isi Body Modal (Bagian ini yang bisa di-scroll)
    modalBody.innerHTML = `
        <div class="body-wrapper">
            <h4 style="margin-bottom:15px; color: #3d2b1f; font-weight:700;">Bahan-bahan:</h4>
            <ul class="bahan-list">
                ${listBahanHTML}
            </ul>
            
            <a href="https://wa.me/628123456789?text=Halo,+saya+tertarik+dengan+resep+${encodeURIComponent(resep.judul)}" 
               class="btn-youtube" 
               target="_blank">
                Tonton Video (${formatRupiah(resep.harga)})
            </a>
            
            <div style="height: 20px;"></div> </div>
    `;

    // Tampilkan Modal
    modal.classList.remove('hidden');

    // RESET SCROLL: Paksa scrollbar kembali ke paling atas
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
}

// 4. Fungsi Tutup Modal
function tutupModal() {
    const modal = document.getElementById('modalResep');
    modal.classList.add('hidden');
}

// 5. Jalankan saat halaman siap
window.onload = fetchResep;
