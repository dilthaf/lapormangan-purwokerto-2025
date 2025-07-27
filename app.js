// --- KONFIGURASI & DATA AWAL ---

// Kunci API untuk layanan eksternal (JANGAN HARDCODE DI SINI PADA PRODUKSI)
// Ganti dengan kunci API Anda yang sebenarnya dari Google AI Studio
const GEMINI_API_KEY = "MASUKKAN_API_KEY_GEMINI_ANDA_DISINI";

// URL API untuk mengambil data kuliner dari Google Sheet (dinonaktifkan untuk mode statis)
// const OPENSHEET_URL = 'https://opensheet.elk.sh/1s1WgKAsoPLYvdoTKP0wGcenlcnGJQQv4ggY4JmZEUHE/Asli';

// Data kuliner awal (MVP) untuk ditampilkan sebelum data dari API dimuat
const initialKulinerData = [
  { id: 1, nama_kuliner: "Soto Sokaraja", kategori: "Soto", alamat: "Jl. Sokaraja, Purwokerto", jam_buka: "07:00", jam_tutup: "15:00", harga_min: 12000, harga_max: 20000, tukang_parkir: "Tersedia", latitude: -7.4220, longitude: 109.2300, foto_url: "https://i.imgur.com/8z3L5kL.jpg" },
  { id: 2, nama_kuliner: "Tempe Mendoan", kategori: "Gorengan", alamat: "Pasar Sokaraja, Purwokerto", jam_buka: "06:00", jam_tutup: "18:00", harga_min: 2000, harga_max: 5000, tukang_parkir: "Tersedia", latitude: -7.4200, longitude: 109.2300, foto_url: "https://i.imgur.com/8z3L5kL.jpg" },
  { id: 3, nama_kuliner: "Getuk Goreng", kategori: "Jajanan Tradisional", alamat: "Jl. Sudirman, Purwokerto", jam_buka: "08:00", jam_tutup: "17:00", harga_min: 5000, harga_max: 10000, tukang_parkir: "Ya", latitude: -7.4210, longitude: 109.2400, foto_url: "https://i.imgur.com/8z3L5kL.jpg" },
  { id: 4, nama_kuliner: "Klanting", kategori: "Camilan Kering", alamat: "Pasar Baru, Purwokerto", jam_buka: "09:00", jam_tutup: "17:00", harga_min: 5000, harga_max: 10000, tukang_parkir: "Ya", latitude: -7.4250, longitude: 109.2350, foto_url: "https://i.imgur.com/8z3L5kL.jpg" },
  { id: 5, nama_kuliner: "Cenil", kategori: "Jajanan Tradisional", alamat: "Jl. Dr. Soeparno, Purwokerto", jam_buka: "08:00", jam_tutup: "16:00", harga_min: 3000, harga_max: 5000, tukang_parkir: "Tidak", latitude: -7.4300, longitude: 109.2450, foto_url: "https://i.imgur.com/8z3L5kL.jpg" },
];

// Variabel global
let kulinerData = [];
let map;
let markers = [];

// --- FUNGSI UTAMA ---

// Inisialisasi aplikasi saat DOM selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
    displayWeather(); // Panggil fungsi cuaca
    
    // Muat data dari array statis
    kulinerData = [...initialKulinerData];
    renderAll();
});

// Merender ulang semua komponen (daftar tempat dan marker)
function renderAll() {
    renderPlacesList();
    renderMapMarkers();
    if (kulinerData.length > 0) {
        setActivePlace(kulinerData[0]);
    }
}

// --- PENGAMBILAN & PEMROSESAN DATA (Mode Statis) ---
// Fungsi-fungsi di bawah ini (fetchData, processData, mergeData) tidak digunakan
// saat aplikasi berjalan dalam mode data statis.
// Mereka disimpan di sini untuk referensi jika ingin mengaktifkan kembali fitur API.
/*
async function fetchData() { ... }
function processData(apiData) { ... }
function mergeData(initialData, apiData) { ... }
*/


// --- RENDER KOMPONEN UI ---

// Merender daftar tempat kuliner di sidebar
function renderPlacesList(places = kulinerData) {
    const placesList = document.getElementById('placesList');
    placesList.innerHTML = '';
    
    if (places.length === 0) {
        placesList.innerHTML = '<div class="error">Tidak ada data kuliner.</div>';
        return;
    }
    
    places.forEach(place => {
        const placeCard = document.createElement('div');
        placeCard.className = 'place-card';
        placeCard.dataset.id = place.id;
        
        placeCard.innerHTML = `
            <div class="place-name">
                <span>${place.nama_kuliner}</span>
                <span class="place-rating"><i class="fas fa-star"></i> ${getPlaceRating(place.nama_kuliner)}</span>
            </div>
            <div class="place-category">${place.kategori}</div>
            <div class="place-info">
                <div><i class="fas fa-clock"></i> ${place.jam_buka} - ${place.jam_tutup}</div>
                <div><i class="fas fa-tag"></i> Rp${place.harga_min.toLocaleString()} - Rp${place.harga_max.toLocaleString()}</div>
            </div>
        `;
        placesList.appendChild(placeCard);
    });
    
    document.getElementById('totalPlaces').textContent = places.length;
    
    document.querySelectorAll('.place-card').forEach(card => {
        card.addEventListener('click', function() {
            const place = kulinerData.find(p => String(p.id) === this.dataset.id);
            if (place) setActivePlace(place);
        });
    });
}

// Merender marker di peta
function renderMapMarkers(places = kulinerData) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    places.forEach(place => {
        if (place.latitude && place.longitude) {
            const customIcon = L.divIcon({
                className: `location-marker ${getCategoryClass(place.kategori)}`,
                html: `<b>${place.kategori.split(' ')[0].substring(0, 2)}</b>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([place.latitude, place.longitude], { icon: customIcon })
                .addTo(map)
                .on('click', () => setActivePlace(place));
            
            marker.placeId = place.id;
            markers.push(marker);
        }
    });
}

// --- INTERAKSI PENGGUNA ---

// Mengatur tempat yang aktif (di daftar dan di peta)
function setActivePlace(place) {
    document.querySelectorAll('.place-card').forEach(card => {
        card.classList.toggle('active', String(card.dataset.id) === String(place.id));
        if (String(card.dataset.id) === String(place.id)) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    markers.forEach(marker => {
        const isActive = String(marker.placeId) === String(place.id);
        marker.setZIndexOffset(isActive ? 1000 : 0);
        marker.getElement()?.classList.toggle('active', isActive);
        if (isActive) map.setView(marker.getLatLng(), 15);
    });
    
    updateMapOverlay(place);
}

// Memperbarui overlay info di peta
function updateMapOverlay(place) {
    const mapOverlay = document.getElementById('mapOverlay');
    mapOverlay.innerHTML = `
        <h3>${place.nama_kuliner}</h3>
        <p>${getPlaceDescription(place.nama_kuliner)}</p>
        <div class="place-info">
            <div><i class="fas fa-star"></i> ${getPlaceRating(place.nama_kuliner)} (${getPlaceReviews(place.nama_kuliner)} ulasan)</div>
            <div><i class="fas fa-car"></i> ${place.tukang_parkir}</div>
        </div>
        <button class="directions-btn" onclick="openDirectionsInGoogleMaps(${place.latitude}, ${place.longitude}, '${place.nama_kuliner}')">
            <i class="fas fa-directions"></i> Buka di Google Maps
        </button>
    `;
}

// Membuka rute di Google Maps
function openDirectionsInGoogleMaps(lat, lng, name) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
}

// --- FILTER & PENCARIAN ---

// Filter dari dropdown Makanan/Minuman
function applyFilter() {
    const filterValue = document.getElementById('filterKategori').value;
    document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
    if (filterValue === "") {
        document.querySelector('.filter-tag[data-category="semua"]').classList.add('active');
    }

    const drinkKeywords = ['kopi', 'teh', 'jus', 'minum', 'es'];
    const filtered = filterValue === "" ? kulinerData : kulinerData.filter(p => {
        const category = p.kategori.toLowerCase();
        return filterValue === "Makanan" ? !drinkKeywords.some(k => category.includes(k)) : drinkKeywords.some(k => category.includes(k));
    });
    
    renderPlacesList(filtered);
    renderMapMarkers(filtered);
}

// Filter dari tag kategori
function filterByCategory(category) {
    document.getElementById('filterKategori').value = "";
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.toggle('active', t.dataset.category === category));
    
    const filtered = category === 'semua' ? kulinerData : kulinerData.filter(p => 
        p.kategori.toLowerCase().includes(category)
    );

    renderPlacesList(filtered);
    renderMapMarkers(filtered);
}

// Pencarian berdasarkan input pengguna
function searchPlaces(query) {
    const lowerQuery = query.toLowerCase();
    const filtered = !query.trim() ? kulinerData : kulinerData.filter(p => 
        p.nama_kuliner.toLowerCase().includes(lowerQuery) ||
        p.kategori.toLowerCase().includes(lowerQuery) ||
        p.alamat.toLowerCase().includes(lowerQuery)
    );
    renderPlacesList(filtered);
    renderMapMarkers(filtered);
}

// --- CHATBOT AI (GEMINI) & CUACA ---

// Mengirim pesan ke Gemini dan menampilkan respons
async function sendChat(predefinedMessage = "") {
    const input = predefinedMessage || document.getElementById("chatInput").value.trim();
    if (!input) return;

    if (!predefinedMessage) {
        addChatMessage(input, 'user');
    }
    document.getElementById("chatInput").value = "";

    // Cek apakah API key sudah diisi
    if (GEMINI_API_KEY === "MASUKKAN_API_KEY_GEMINI_ANDA_DISINI" || !GEMINI_API_KEY) {
        addChatMessage("Waduh, sepertinya API Key untuk AI belum diatur nih. Minta developernya untuk memasukkan API Key Gemini di file `app.js` ya!", 'bot');
        return;
    }

    document.getElementById("chatStatus").textContent = "Bot sedang mengetik...";

    try {
        const weather = await getWeatherForChat();
        // Membuat prompt yang lebih canggih dengan konteks data kuliner dan persona
        const contextPrompt = `
            Kamu adalah "ManganAI", asisten kuliner gaul dan super ramah dari Purwokerto.
            Gaya bicaramu santai dan asik, kayak ngobrol sama teman.
            Kamu tahu semua soal kuliner enak di Purwokerto.
            
            Ini beberapa data kuliner yang kamu tahu (gunakan sebagai referensi, jangan tampilkan list ini mentah-mentah):
            ${JSON.stringify(kulinerData.map(p => ({ nama: p.nama_kuliner, kategori: p.kategori, harga: `Rp${p.harga_min} - Rp${p.harga_max}` })), null, 2)}

            Kondisi cuaca saat ini: ${weather.description}.
            
            Sekarang, jawab pertanyaan dari pengguna dengan gaya khasmu yang asik itu. Berikan jawaban dalam format Markdown.
            Pertanyaan: "${input}"
        `;
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash/generateContent?key=${GEMINI_API_KEY}`;
        const payload = { contents: [{ parts: [{ text: contextPrompt }] }] };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Data:", errorData);
            throw new Error(`API Error: ${response.statusText} - ${errorData.error?.message || 'Cek console untuk detail'}`);
        }
        
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Waduh, aku lagi bingung nih. Coba tanya lagi yang lain ya.";
        addChatMessage(reply, 'bot');

    } catch (err) {
        addChatMessage(`Aduh, ada masalah nih pas nyambung ke AI. Mungkin API key-nya salah atau ada gangguan jaringan. Coba cek console ya. Error: ${err.message}`, 'bot');
        console.error("Chatbot error:", err);
    } finally {
        document.getElementById("chatStatus").textContent = "";
    }
}

// Menambahkan pesan ke UI chatbot dengan rendering Markdown
function addChatMessage(text, role) {
    const chatBody = document.getElementById('chatbotBody');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    // Render Markdown dan sanitasi HTML
    const rawHtml = marked.parse(text);
    messageDiv.innerHTML = DOMPurify.sanitize(rawHtml);
    
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Mengambil data cuaca untuk chatbot
async function getWeatherForChat() {
    const coords = {
        'Purwokerto Barat': { lat: -7.4245, lon: 109.2122 },
        'Purwokerto Timur': { lat: -7.4322, lon: 109.2531 },
        'Purwokerto Utara': { lat: -7.4031, lon: 109.2418 },
        'Purwokerto Selatan': { lat: -7.4458, lon: 109.2412 }
    };
    // Ambil cuaca untuk salah satu kecamatan secara acak
    const kecamatan = Object.keys(coords)[Math.floor(Math.random() * 4)];
    const { lat, lon } = coords[kecamatan];

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Asia/Jakarta`;
        const res = await fetch(url);
        const data = await res.json();
        const w = data.current_weather;
        const weatherDesc = getWeatherDescription(w.weathercode);
        return {
            description: `Suhu ${w.temperature}°C di ${kecamatan}, ${weatherDesc}.`,
            isRain: w.weathercode >= 61 && w.weathercode <= 67
        };
    } catch (error) {
        console.error("Weather API error:", error);
        return { description: "gagal mendapatkan data cuaca", isRain: false };
    }
}

// --- FUNGSI PEMBANTU & CUACA ---

// Menampilkan cuaca saat ini di UI
async function displayWeather() {
    const weatherWidget = document.getElementById('weatherWidget');
    try {
        // Koordinat pusat Purwokerto
        const lat = -7.43139;
        const lon = 109.24783;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Asia/Jakarta`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Gagal mengambil data cuaca');
        
        const data = await response.json();
        const weather = data.current_weather;
        const description = getWeatherDescription(weather.weathercode);
        const icon = getWeatherIcon(weather.weathercode);

        weatherWidget.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${weather.temperature}°C, ${description}</span>
        `;
    } catch (error) {
        console.error('Error fetching weather:', error);
        weatherWidget.innerHTML = '<span>Gagal memuat cuaca</span>';
    }
}

// Mendapatkan ikon Font Awesome berdasarkan kode cuaca
function getWeatherIcon(code) {
    const icons = {
        0: 'fa-sun', 1: 'fa-cloud-sun', 2: 'fa-cloud', 3: 'fa-cloud-meatball',
        45: 'fa-smog', 48: 'fa-smog',
        51: 'fa-cloud-rain', 53: 'fa-cloud-rain', 55: 'fa-cloud-showers-heavy',
        61: 'fa-cloud-rain', 63: 'fa-cloud-showers-heavy', 65: 'fa-cloud-showers-heavy',
        80: 'fa-cloud-showers-heavy', 81: 'fa-cloud-showers-heavy', 82: 'fa-cloud-showers-heavy',
        95: 'fa-bolt'
    };
    return icons[code] || 'fa-question-circle';
}

// Inisialisasi peta Leaflet
function initMap() {
    map = L.map('map').setView([-7.43139, 109.24783], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

// Pengaturan event listener untuk elemen UI
function setupEventListeners() {
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => filterByCategory(tag.dataset.category));
    });
    document.getElementById('searchInput').addEventListener('input', e => searchPlaces(e.target.value));
    
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotContainer = document.getElementById('chatbotContainer');
    const closeChatbot = document.getElementById('closeChatbot');

    chatbotToggle.addEventListener('click', () => {
        chatbotContainer.classList.toggle('visible');
        // Kirim pesan selamat datang jika chatbot baru saja dibuka dan belum ada pesan
        if (chatbotContainer.classList.contains('visible') && document.querySelectorAll('.message').length === 0) {
            sendChat("Halo! Aku ManganAI. Ada yang bisa kubantu seputar kuliner Purwokerto?");
        }
    });

    closeChatbot.addEventListener('click', () => {
        chatbotContainer.classList.remove('visible');
    });

    document.getElementById('sendButton').addEventListener('click', () => sendChat());
    document.getElementById('chatInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') sendChat();
    });
}

// Mendapatkan kelas CSS berdasarkan kategori
function getCategoryClass(kategori) {
    const cat = kategori.toLowerCase();
    if (cat.includes('soto')) return 'soto';
    if (cat.includes('bakso')) return 'bakso';
    if (cat.includes('gorengan')) return 'gorengan';
    if (cat.includes('ayam')) return 'ayam';
    if (cat.includes('restoran')) return 'restoran';
    return 'foodcourt';
}

// Mendapatkan deskripsi tempat (placeholder)
function getPlaceDescription(nama) {
    const descs = { 'Soto Sokaraja': 'Soto khas dengan bumbu kacang yang unik.' };
    return descs[nama] || 'Kuliner lezat di Purwokerto.';
}

// Mendapatkan rating tempat (placeholder)
function getPlaceRating(nama) {
    const ratings = { 'Soto Sokaraja': '4.7', 'Tempe Mendoan': '4.5' };
    return ratings[nama] || (Math.random() * (4.8 - 4.0) + 4.0).toFixed(1);
}

// Mendapatkan jumlah ulasan (placeholder)
function getPlaceReviews(nama) {
    const reviews = { 'Soto Sokaraja': '245', 'Tempe Mendoan': '189' };
    return reviews[nama] || Math.floor(Math.random() * 200 + 50);
}

// Mendapatkan deskripsi cuaca dari kode
function getWeatherDescription(code) {
    const codes = {
        0: 'Cerah', 1: 'Cerah Berawan', 2: 'Berawan', 3: 'Sangat Berawan',
        45: 'Kabut', 48: 'Kabut Tebal',
        51: 'Gerimis Ringan', 53: 'Gerimis', 55: 'Gerimis Lebat',
        61: 'Hujan Ringan', 63: 'Hujan', 65: 'Hujan Lebat',
        80: 'Hujan Ringan', 81: 'Hujan', 82: 'Hujan Lebat',
        95: 'Badai Petir'
    };
    return codes[code] || 'Cuaca tidak diketahui';
}
