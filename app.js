// Data kuliner dari API
let kulinerData = [];
let map;
let markers = [];
const API_URL = 'https://opensheet.elk.sh/1s1WgKAsoPLYvdoTKP0wGcenlcnGJQQv4ggY4JmZEUHE/Asli';

// Fungsi untuk mengambil data dari API
async function fetchData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Fungsi untuk memproses data dari API
function processData(apiData) {
    return apiData.map((item, index) => ({
        id: index + 1,
        nama_kuliner: item['Nama Kuliner'] || 'Nama Tidak Tersedia',
        kategori: item['Kategori'] || 'Kategori Tidak Tersedia',
        alamat: item['Alamat'] || 'Alamat Tidak Tersedia',
        latitude: item['Latitude'] ? parseFloat(item['Latitude']) : null,
        longitude: item['Longitude'] ? parseFloat(item['Longitude']) : null,
        jam_buka: item['Jam Buka'] || '00:00',
        jam_tutup: item['Jam Tutup'] || '00:00',
        harga_min: item['Harga Min'] ? parseInt(item['Harga Min'].replace(/[^0-9]/g, '')) : 0,
        harga_max: item['Harga Max'] ? parseInt(item['Harga Max'].replace(/[^0-9]/g, '')) : 0,
        tukang_parkir: item['Tukang Parkir'] || 'Tidak Ada',
        foto_url: item['Foto URL'] || 'https://placehold.co/300x200?text=Foto+Tidak+Tersedia'
    }));
}

// Fungsi untuk mendapatkan kelas warna berdasarkan kategori
function getCategoryClass(kategori) {
    const categoryMap = {
        'Soto Tradisional': 'soto',
        'Bakso': 'bakso',
        'Gorengan': 'gorengan',
        'Ayam Penyet': 'ayam',
        'Ayam Kampung': 'ayam',
        'Restoran Sunda': 'restoran',
        'Restoran Cina': 'restoran',
        'Food Court': 'foodcourt',
        'Jajanan Tradisional': 'gorengan',
        'Olahan Daging': 'ayam'
    };
    return categoryMap[kategori] || 'soto';
}

// Fungsi untuk mendapatkan deskripsi berdasarkan nama kuliner
function getPlaceDescription(nama_kuliner) {
    const descriptions = {
        'Soto Sokaraja': 'Soto khas Purwokerto yang terkenal dengan kuahnya yang gurih dan bahan rempah pilihan. Cocok untuk sarapan pagi.',
        'Bakso Samiasih': 'Terkenal dengan baksonya yang kenyal dan kuah kaldu yang gurih. Tempat favorit warga Purwokerto sejak puluhan tahun.',
        'Bakso Pekih': 'Bakso legendaris dengan rasa autentik. Lokasinya yang strategis membuat selalu ramai dikunjungi.',
        'Bakso Satlantas': 'Bakso dengan porsi besar dan rasa yang konsisten. Cocok untuk makan siang yang mengenyangkan.',
        'Tempe Mendoan': 'Jajanan tradisional yang digoreng setengah matang. Nikmat disantap hangat dengan cabai rawit.',
        'Getuk Sokaraja': 'Jajanan khas Banyumas yang terbuat dari singkong. Tekstur lembut dengan berbagai pilihan rasa.',
        'Paru Mercon Gita Beb': 'Olahan paru sapi yang pedas menggigit. Cocok untuk pecinta makanan pedas.',
        'Ayam Penyet Pak Memeng': 'Ayam penyet dengan sambal yang pedas dan lezat. Ayamnya digoreng krispi dan dipenyet agar lebih meresap.',
        'Djago Jowo': 'Spesialis ayam kampung dengan bumbu tradisional. Dagingnya empuk dan bumbunya meresap.',
        'Gubug Makan Mang Engking': 'Restoran Sunda yang menyajikan makanan tradisional dengan suasana pedesaan yang nyaman.',
        'Ambalika Resto': 'Restoran Cina otentik dengan berbagai pilihan menu klasik. Cocok untuk acara keluarga.',
        'Andhang Pangrenan': 'Food court dengan berbagai pilihan kuliner. Tempat nongkrong yang nyaman dengan harga terjangkau.'
    };
    return descriptions[nama_kuliner] || 'Tempat kuliner yang populer di Purwokerto dengan pelayanan ramah dan makanan berkualitas.';
}

// Fungsi untuk mendapatkan rating berdasarkan nama kuliner
function getPlaceRating(nama_kuliner) {
    const ratings = {
        'Soto Sokaraja': '4.7',
        'Bakso Samiasih': '4.5',
        'Bakso Pekih': '4.6',
        'Bakso Satlantas': '4.4',
        'Tempe Mendoan': '4.2',
        'Getuk Sokaraja': '4.3',
        'Paru Mercon Gita Beb': '4.8',
        'Ayam Penyet Pak Memeng': '4.5',
        'Djago Jowo': '4.6',
        'Gubug Makan Mang Engking': '4.4',
        'Ambalika Resto': '4.3',
        'Andhang Pangrenan': '4.2'
    };
    return ratings[nama_kuliner] || '4.5';
}

// Fungsi untuk mendapatkan jumlah ulasan berdasarkan nama kuliner
function getPlaceReviews(nama_kuliner) {
    const reviews = {
        'Soto Sokaraja': '245',
        'Bakso Samiasih': '189',
        'Bakso Pekih': '156',
        'Bakso Satlantas': '134',
        'Tempe Mendoan': '98',
        'Getuk Sokaraja': '112',
        'Paru Mercon Gita Beb': '167',
        'Ayam Penyet Pak Memeng': '201',
        'Djago Jowo': '178',
        'Gubug Makan Mang Engking': '145',
        'Ambalika Resto': '123',
        'Andhang Pangrenan': '156'
    };
    return reviews[nama_kuliner] || Math.floor(Math.random() * 200 + 50);
}

// Fungsi untuk membuka rute di Google Maps
function openDirectionsInGoogleMaps(lat, lng, placeName) {
    if (lat && lng) {
        // URL Google Maps untuk rute (dari lokasi pengguna ke destinasi)
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(placeName)}`;
        window.open(googleMapsUrl, '_blank');
    } else {
        // Jika tidak ada koordinat, cari berdasarkan alamat
        const address = kulinerData.find(p => p.nama_kuliner === placeName)?.alamat || placeName;
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        window.open(googleMapsUrl, '_blank');
    }
}

// Fungsi untuk merender daftar tempat kuliner
function renderPlacesList(places = kulinerData) {
    const placesList = document.getElementById('placesList');
    placesList.innerHTML = '';
    
    if (places.length === 0) {
        placesList.innerHTML = '<div class="error">Tidak ada data kuliner yang tersedia.</div>';
        return;
    }
    
    places.forEach((place, index) => {
        const placeCard = document.createElement('div');
        placeCard.className = `place-card ${index === 0 ? 'active' : ''}`;
        placeCard.dataset.id = place.id;
        
        placeCard.innerHTML = `
            <div class="place-name">
                <span>${place.nama_kuliner}</span>
                <span class="place-rating"><i class="fas fa-star"></i> ${getPlaceRating(place.nama_kuliner)}</span>
            </div>
            <div class="place-category">${place.kategori}</div>
            <div class="place-info">
                <div><i class="fas fa-clock"></i> ${place.jam_buka} - ${place.jam_tutup}</div>
                ${place.latitude && place.longitude ? 
                    `<div><i class="fas fa-map-marker-alt"></i> ${(Math.random() * 2 + 0.5).toFixed(1)}km</div>` : 
                    `<div class="no-coordinates"><i class="fas fa-exclamation-circle"></i> Lokasi umum</div>`
                }
                <div><i class="fas fa-tag"></i> Rp${place.harga_min.toLocaleString()} - Rp${place.harga_max.toLocaleString()}</div>
            </div>
        `;
        
        placesList.appendChild(placeCard);
    });
    
    // Update total places count
    document.getElementById('totalPlaces').textContent = places.length;
    
    // Tambahkan event listener untuk kartu tempat
    document.querySelectorAll('.place-card').forEach(card => {
        card.addEventListener('click', function() {
            const placeId = parseInt(this.dataset.id);
            const place = kulinerData.find(p => p.id === placeId);
            if (place) {
                setActivePlace(place);
            }
        });
    });
}

// Fungsi untuk merender marker di peta
function renderMapMarkers(places = kulinerData) {
    // Hapus marker yang sudah ada
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    places.forEach((place, index) => {
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

// Fungsi untuk mengatur tempat aktif
function setActivePlace(place) {
    // Update kartu aktif di sidebar
    document.querySelectorAll('.place-card').forEach(card => {
        card.classList.remove('active');
        if (parseInt(card.dataset.id) === place.id) {
            card.classList.add('active');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    // Update marker aktif di peta
    markers.forEach(marker => {
        if (marker.placeId === place.id) {
            marker.setZIndexOffset(1000);
            marker.getElement().classList.add('active');
            map.setView(marker.getLatLng(), 15);
        } else {
            marker.setZIndexOffset(0);
            marker.getElement().classList.remove('active');
        }
    });
    
    // Update overlay peta
    const mapOverlay = document.getElementById('mapOverlay');
    
    // Tambahkan ikon tukang parkir jika ada
    const parkingInfo = place.tukang_parkir === "Ada" ? 
        `<div><i class="fas fa-car"></i> Ada Tukang Parkir</div>` : 
        `<div><i class="fas fa-car"></i> Tidak Ada Tukang Parkir</div>`;
    
    mapOverlay.innerHTML = `
        <h3>${place.nama_kuliner}</h3>
        <p>${getPlaceDescription(place.nama_kuliner)}</p>
        <div class="place-info">
            <div><i class="fas fa-clock"></i> ${place.jam_buka} - ${place.jam_tutup}</div>
            <div><i class="fas fa-star"></i> ${getPlaceRating(place.nama_kuliner)} (${getPlaceReviews(place.nama_kuliner)} ulasan)</div>
            <div><i class="fas fa-tag"></i> Rp${place.harga_min.toLocaleString()} - Rp${place.harga_max.toLocaleString()}</div>
            ${parkingInfo}
        </div>
        <button class="directions-btn" onclick="openDirectionsInGoogleMaps(${place.latitude || 'null'}, ${place.longitude || 'null'}, '${place.nama_kuliner}')">
            <i class="fas fa-directions"></i> Buka di Google Maps
        </button>
    `;
}

// Fungsi filter berdasarkan kategori
function filterByCategory(category) {
    let filteredPlaces;
    if (category === 'semua') {
        filteredPlaces = kulinerData;
    } else {
        filteredPlaces = kulinerData.filter(place => {
            if (category === 'soto') return place.kategori.includes('Soto');
            if (category === 'bakso') return place.kategori.includes('Bakso');
            if (category === 'gorengan') return place.kategori.includes('Gorengan') || place.kategori.includes('Jajanan');
            if (category === 'ayam') return place.kategori.includes('Ayam');
            if (category === 'restoran') return place.kategori.includes('Restoran');
            if (category === 'foodcourt') return place.kategori.includes('Food Court');
            return false;
        });
    }
    renderPlacesList(filteredPlaces);
    renderMapMarkers(filteredPlaces);
}

// Fungsi pencarian
function searchPlaces(query) {
    let filteredPlaces;
    if (!query.trim()) {
        filteredPlaces = kulinerData;
    } else {
        filteredPlaces = kulinerData.filter(place => 
            place.nama_kuliner.toLowerCase().includes(query.toLowerCase()) ||
            place.kategori.toLowerCase().includes(query.toLowerCase()) ||
            place.alamat.toLowerCase().includes(query.toLowerCase())
        );
    }
    renderPlacesList(filteredPlaces);
    renderMapMarkers(filteredPlaces);
}

// Fungsi chatbot
function handleChatMessage(message) {
    const lowerMsg = message.toLowerCase();
    let response = '';
    
    if (lowerMsg.includes('bakso') || lowerMsg.includes('meatball')) {
        response = 'Berdasarkan lokasi Anda, saya rekomendasikan <strong>Bakso Samiasih</strong> (0.5km). Terkenal dengan baksonya yang kenyal dan kuah kaldu yang gurih! ⭐4.5';
    } else if (lowerMsg.includes('soto') || lowerMsg.includes('soup')) {
        response = 'Saya rekomendasikan <strong>Soto Sokaraja</strong> (0.8km). Soto khas Purwokerto dengan kuah gurih dan bahan rempah pilihan! ⭐4.7';
    } else if (lowerMsg.includes('murah') || lowerMsg.includes('hemat')) {
        response = 'Rekomendasi tempat makan hemat: <strong>Tempe Mendoan</strong> (mulai Rp5.000) dan <strong>Andhang Pangrenan</strong> (mulai Rp5.000).';
    } else if (lowerMsg.includes('buka') || lowerMsg.includes('jam')) {
        response = 'Saat ini <strong>Soto Sokaraja</strong>, <strong>Bakso Samiasih</strong>, dan <strong>Gubug Makan Mang Engking</strong> sedang buka.';
    } else if (lowerMsg.includes('pedas') || lowerMsg.includes('spicy')) {
        response = 'Untuk pecinta pedas, saya rekomendasikan <strong>Paru Mercon Gita Beb</strong> yang terkenal dengan olahan paru pedas menggigit!';
    } else {
        response = 'Saya bisa bantu rekomendasikan kuliner berdasarkan preferensi Anda. Coba tanyakan seperti "Rekomendasikan bakso terdekat" atau "Tempat makan pedas".';
    }
    
    return response;
}

// Fungsi untuk menambah tempat kuliner baru
function addNewPlace(placeData) {
    const newId = Math.max(...kulinerData.map(p => p.id)) + 1;
    const newPlace = {
        id: newId,
        nama_kuliner: placeData.namaKuliner,
        kategori: placeData.kategori,
        alamat: placeData.alamat,
        latitude: null, // Untuk implementasi nyata, ini akan diisi dengan koordinat dari geocoding
        longitude: null,
        jam_buka: placeData.jamBuka,
        jam_tutup: placeData.jamTutup,
        harga_min: parseInt(placeData.hargaMin),
        harga_max: parseInt(placeData.hargaMax),
        foto_url: "https://placehold.co/300x200?text=Foto+Tempat",
        tukang_parkir: placeData.tukangParkir
    };
    
    kulinerData.push(newPlace);
    renderPlacesList();
    renderMapMarkers();
    
    // Reset form dan tutup modal
    document.getElementById('addPlaceForm').reset();
    document.getElementById('addPlaceModal').style.display = 'none';
    
    // Tampilkan notifikasi
    alert(`Terima kasih! Tempat kuliner "${placeData.namaKuliner}" berhasil ditambahkan dan akan segera dimoderasi.`);
}

function initMap() {
    map = L.map('map').setView([-7.43139, 109.24783], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // User location marker
    L.circleMarker([-7.43139, 109.24783], {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: '#9B5DE5',
        fillOpacity: 1
    }).addTo(map).bindPopup("Lokasi Anda saat ini.").openPopup();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    try {
        initMap();
        // Fetch and process data
        const apiData = await fetchData();
        kulinerData = processData(apiData);
        
        // Render daftar tempat dan marker
        renderPlacesList();
        renderMapMarkers();
        
        if (kulinerData.length > 0) {
            setActivePlace(kulinerData[0]);
        }

        // Filter tag interaction
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.addEventListener('click', function() {
                document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                filterByCategory(this.dataset.category);
            });
        });
        
        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', function() {
            searchPlaces(this.value);
        });
        
        // Chatbot toggle
        document.getElementById('chatbotToggle').addEventListener('click', function() {
            document.getElementById('chatbotContainer').style.display = 'block';
            this.classList.remove('pulse');
        });
        
        document.getElementById('closeChatbot').addEventListener('click', function() {
            document.getElementById('chatbotContainer').style.display = 'none';
            document.getElementById('chatbotToggle').classList.add('pulse');
        });
        
        // Chatbot send message
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        const chatBody = document.getElementById('chatbotBody');
        
        function sendMessage() {
            const message = chatInput.value.trim();
            if (message) {
                // Add user message
                const userMessageDiv = document.createElement('div');
                userMessageDiv.className = 'message user-message';
                userMessageDiv.textContent = message;
                chatBody.appendChild(userMessageDiv);
                
                // Clear input
                chatInput.value = '';
                
                // Scroll to bottom
                chatBody.scrollTop = chatBody.scrollHeight;
                
                // Simulate bot response after delay
                setTimeout(() => {
                    const botMessageDiv = document.createElement('div');
                    botMessageDiv.className = 'message bot-message';
                    botMessageDiv.innerHTML = `<strong>LaporBot:</strong> ${handleChatMessage(message)}`;
                    chatBody.appendChild(botMessageDiv);
                    chatBody.scrollTop = chatBody.scrollHeight;
                }, 1000);
            }
        }
        
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Auto-open chatbot after 3 seconds
        setTimeout(() => {
            if(document.getElementById('chatbotContainer').style.display !== 'block') {
                document.getElementById('chatbotToggle').classList.add('pulse');
            }
        }, 3000);
        
    } catch (error) {
        console.error('Failed to load data:', error);
        document.getElementById('placesList').innerHTML = '<div class="error">Gagal memuat data. Silakan coba lagi nanti.</div>';
    }
});
