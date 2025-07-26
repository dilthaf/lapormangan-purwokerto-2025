// app.js - Lapor Mangan Purwokerto
// Integration with OpenSheet API for Google Sheets backend

// Configuration - akan diisi dari environment variables
const OPENSHEET_URL = window._env_ ? window._env_.SHEET_API_URL : 'https://opensheet.elk.sh/1s1WgKAsoPLYvdoTKP0wGcenlcnGJQQv4ggY4JmZEUHE/Asli';

// Global variables
let allKulinerData = [];
let currentWeather = 'Cerah';
let markers = [];
let map;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Initialize map
        initializeMap();

        // Load kuliner data from OpenSheet
        await loadKulinerData();

        // Initialize weather simulation
        initializeWeatherSimulation();

        // Initialize search functionality
        initializeSearch();

        // Initialize category filters
        initializeCategoryFilters();

        // Initialize chatbot
        initializeChatbot();

        // Initialize mobile menu
        initializeMobileMenu();

        console.log('Aplikasi Lapor Mangan Purwokerto berhasil diinisialisasi');
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Gagal memuat aplikasi. Silakan refresh halaman.');
    }
}

// Load data from OpenSheet API
async function loadKulinerData() {
    try {
        showLoading(true);

        const response = await fetch(OPENSHEET_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allKulinerData = processKulinerData(data);

        // Display data on map and list
        displayKulinerMarkers(allKulinerData);
        displayKulinerList(allKulinerData);

        showLoading(false);

        console.log(`Berhasil memuat ${allKulinerData.length} data kuliner`);
    } catch (error) {
        console.error('Error loading kuliner data:', error);
        showError('Gagal memuat data kuliner. Menggunakan data demo.');

        // Fallback to demo data
        allKulinerData = getDemoData();
        displayKulinerMarkers(allKulinerData);
        displayKulinerList(allKulinerData);

        showLoading(false);
    }
}

// Process raw data from Google Sheets
function processKulinerData(rawData) {
    return rawData.map((item, index) => {
        // Map Google Sheets columns to app structure
        return {
            id: index + 1,
            nama: item['Nama Kuliner'] || item.nama_kuliner || 'Kuliner Purwokerto',
            deskripsi: item['Deskripsi Kuliner'] || item.deskripsi || 'Kuliner khas Purwokerto',
            alamat: item['Lokasi (Alamat)'] || item.alamat || 'Purwokerto',
            koordinat: parseKoordinat(item['Koordinat GPS'] || item.koordinat),
            jamBuka: item['Jam Buka'] || item.jam_buka || '08:00-20:00',
            kategori: item['Kategori Makanan'] || item.kategori || 'Makanan',
            harga: item['Kisaran Harga'] || item.harga || '10.000-25.000',
            rating: parseFloat(item['Rating (1–5)'] || item.rating || 4.0),
            parkir: item['Ada Parkir?'] || item.parkir || 'Ya',
            jalurGerobak: item['Jalur Penjual (jika gerobak berpindah tempat)'] || item.jalur_gerobak || '',
            foto: item['URL Foto (opsional)'] || item.foto || 'https://via.placeholder.com/300x200',
            pelapor: item['Nama Pelapor (email)'] || item.pelapor || 'mahasiswa@unsoed.ac.id',
            timestamp: item['Timestamp'] || new Date().toISOString(),
            tipe: item.jalur_gerobak && item.jalur_gerobak.trim() ? 'gerobak' : 'tetap'
        };
    }).filter(item => item.nama && item.nama.trim() !== '');
}

// Parse koordinat string to lat, lng object
function parseKoordinat(koordinatStr) {
    if (!koordinatStr) {
        // Default coordinates for Purwokerto center
        return {
            lat: -7.4281 + (Math.random() - 0.5) * 0.02,
            lng: 109.2417 + (Math.random() - 0.5) * 0.02
        };
    }

    const coords = koordinatStr.toString().split(',');
    if (coords.length === 2) {
        return {
            lat: parseFloat(coords[0].trim()),
            lng: parseFloat(coords[1].trim())
        };
    }

    // Fallback to random coordinates around Purwokerto
    return {
        lat: -7.4281 + (Math.random() - 0.5) * 0.02,
        lng: 109.2417 + (Math.random() - 0.5) * 0.02
    };
}

// Initialize map (assuming Leaflet.js is used)
function initializeMap() {
    // Check if map container exists
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.warn('Map container not found');
        return;
    }

    // Initialize Leaflet map centered on Purwokerto
    map = L.map('map').setView([-7.4281, 109.2417], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    console.log('Map initialized');
}

// Display kuliner markers on map
function displayKulinerMarkers(data) {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    data.forEach(item => {
        const icon = item.tipe === 'gerobak' ? 
            L.divIcon({
                className: 'gerobak-marker',
                html: '<i class="fas fa-truck" style="color: #3B82F6; font-size: 20px;"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }) :
            L.divIcon({
                className: 'restaurant-marker', 
                html: '<i class="fas fa-utensils" style="color: #EF4444; font-size: 20px;"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

        const marker = L.marker([item.koordinat.lat, item.koordinat.lng], { icon })
            .addTo(map)
            .bindPopup(createPopupContent(item));

        markers.push(marker);

        // Add animation for gerobak markers
        if (item.tipe === 'gerobak') {
            setInterval(() => animateGerobakMarker(marker), 5000);
        }
    });
}

// Create popup content for markers
function createPopupContent(item) {
    return `
        <div class="popup-content">
            <h3 class="font-bold text-lg">${item.nama}</h3>
            <p class="text-sm text-gray-600 mb-2">${item.deskripsi}</p>
            <div class="space-y-1 text-sm">
                <p><i class="fas fa-map-marker-alt"></i> ${item.alamat}</p>
                <p><i class="fas fa-clock"></i> ${item.jamBuka}</p>
                <p><i class="fas fa-tag"></i> ${item.kategori}</p>
                <p><i class="fas fa-money-bill-wave"></i> Rp ${item.harga}</p>
                <p><i class="fas fa-star"></i> ${item.rating}/5</p>
                <p><i class="fas fa-car"></i> Parkir: ${item.parkir}</p>
            </div>
            <button onclick="showDetailModal('${item.id}')" 
                    class="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                Lihat Detail
            </button>
        </div>
    `;
}

// Display kuliner list
function displayKulinerList(data) {
    const listContainer = document.getElementById('kuliner-list');
    if (!listContainer) return;

    listContainer.innerHTML = data.map(item => `
        <div class="kuliner-card bg-white rounded-lg shadow-md p-4 mb-4">
            <div class="flex items-start space-x-4">
                <img src="${item.foto}" alt="${item.nama}" 
                     class="w-20 h-20 rounded-lg object-cover"
                     onerror="this.src='https://via.placeholder.com/80x80'">
                <div class="flex-1">
                    <h3 class="font-bold text-lg text-gray-800">${item.nama}</h3>
                    <p class="text-sm text-gray-600 mb-2">${item.deskripsi}</p>
                    <div class="flex items-center space-x-4 text-xs text-gray-500">
                        <span><i class="fas fa-map-marker-alt"></i> ${item.alamat}</span>
                        <span><i class="fas fa-clock"></i> ${item.jamBuka}</span>
                        <span><i class="fas fa-star"></i> ${item.rating}/5</span>
                    </div>
                    <div class="mt-2">
                        <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            ${item.kategori}
                        </span>
                        ${item.tipe === 'gerobak' ? 
                            '<span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded ml-1">Gerobak Keliling</span>' : 
                            ''
                        }
                    </div>
                </div>
                <button onclick="showDetailModal('${item.id}')" 
                        class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                    Detail
                </button>
            </div>
        </div>
    `).join('');
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filteredData = allKulinerData.filter(item =>
            item.nama.toLowerCase().includes(query) ||
            item.kategori.toLowerCase().includes(query) ||
            item.alamat.toLowerCase().includes(query) ||
            item.deskripsi.toLowerCase().includes(query)
        );

        displayKulinerMarkers(filteredData);
        displayKulinerList(filteredData);
    });
}

// Initialize category filters
function initializeCategoryFilters() {
    const categories = [...new Set(allKulinerData.map(item => item.kategori))];
    const filterContainer = document.getElementById('category-filters');

    if (!filterContainer) return;

    // Add "Semua" filter
    const allButton = document.createElement('button');
    allButton.textContent = 'Semua';
    allButton.className = 'category-filter active bg-blue-500 text-white px-3 py-1 rounded text-sm mr-2 mb-2';
    allButton.addEventListener('click', () => {
        filterByCategory('all');
        setActiveFilter(allButton);
    });
    filterContainer.appendChild(allButton);

    // Add category filters
    categories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category;
        button.className = 'category-filter bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm mr-2 mb-2 hover:bg-gray-300';
        button.addEventListener('click', () => {
            filterByCategory(category);
            setActiveFilter(button);
        });
        filterContainer.appendChild(button);
    });
}

// Filter by category
function filterByCategory(category) {
    const filteredData = category === 'all' ? 
        allKulinerData : 
        allKulinerData.filter(item => item.kategori === category);

    displayKulinerMarkers(filteredData);
    displayKulinerList(filteredData);
}

// Set active filter button
function setActiveFilter(activeButton) {
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-500', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });

    activeButton.classList.add('active', 'bg-blue-500', 'text-white');
    activeButton.classList.remove('bg-gray-200', 'text-gray-700');
}

// Initialize weather simulation
function initializeWeatherSimulation() {
    const weathers = ['Cerah', 'Berawan', 'Hujan Ringan', 'Panas'];
    const weatherIcons = {
        'Cerah': 'fas fa-sun',
        'Berawan': 'fas fa-cloud',
        'Hujan Ringan': 'fas fa-cloud-rain',
        'Panas': 'fas fa-thermometer-half'
    };

    function updateWeather() {
        currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
        const weatherDisplay = document.getElementById('weather-display');

        if (weatherDisplay) {
            weatherDisplay.innerHTML = `
                <i class="${weatherIcons[currentWeather]}"></i>
                <span class="ml-2">${currentWeather}</span>
            `;
        }
    }

    // Update weather every 30 seconds
    updateWeather();
    setInterval(updateWeather, 30000);
}

// Initialize chatbot
function initializeChatbot() {
    const chatButton = document.getElementById('chat-button');
    const chatModal = document.getElementById('chat-modal');
    const closeChatButton = document.getElementById('close-chat');
    const sendChatButton = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (!chatButton || !chatModal) return;

    chatButton.addEventListener('click', () => {
        chatModal.classList.remove('hidden');
        chatInput.focus();
    });

    if (closeChatButton) {
        closeChatButton.addEventListener('click', () => {
            chatModal.classList.add('hidden');
        });
    }

    if (sendChatButton) {
        sendChatButton.addEventListener('click', sendChatMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
}

// Send chat message
function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (!chatInput || !chatMessages) return;

    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addChatMessage('user', message);

    // Generate bot response
    const response = generateChatResponse(message);
    setTimeout(() => {
        addChatMessage('bot', response);
    }, 1000);

    chatInput.value = '';
}

// Add chat message to conversation
function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender === 'user' ? 'user-message' : 'bot-message'} mb-4`;

    messageDiv.innerHTML = `
        <div class="flex ${sender === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="${sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} 
                        rounded-lg px-4 py-2 max-w-xs">
                ${message}
            </div>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate chat response (simple rule-based)
function generateChatResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Weather-based recommendations
    if (lowerMessage.includes('cuaca') || lowerMessage.includes('hujan') || lowerMessage.includes('panas')) {
        return getWeatherRecommendation();
    }

    // Category-based recommendations
    if (lowerMessage.includes('soto')) {
        const sotoItems = allKulinerData.filter(item => 
            item.kategori.toLowerCase().includes('soto') || 
            item.nama.toLowerCase().includes('soto')
        );
        if (sotoItems.length > 0) {
            const random = sotoItems[Math.floor(Math.random() * sotoItems.length)];
            return `Saya rekomendasikan ${random.nama} di ${random.alamat}. Buka jam ${random.jamBuka} dengan harga ${random.harga}.`;
        }
    }

    if (lowerMessage.includes('murah') || lowerMessage.includes('hemat')) {
        const cheapItems = allKulinerData.filter(item => {
            const maxPrice = parseInt(item.harga.split('-')[1] || item.harga.replace(/\D/g, ''));
            return maxPrice <= 15000;
        });
        if (cheapItems.length > 0) {
            const random = cheapItems[Math.floor(Math.random() * cheapItems.length)];
            return `Untuk pilihan hemat, coba ${random.nama} di ${random.alamat}. Harga sekitar ${random.harga}.`;
        }
    }

    // Location-based
    if (lowerMessage.includes('dekat') || lowerMessage.includes('terdekat')) {
        return 'Mohon aktifkan lokasi Anda atau sebutkan area yang diinginkan untuk rekomendasi kuliner terdekat.';
    }

    // Default responses
    const defaultResponses = [
        'Purwokerto punya banyak kuliner enak! Coba cari berdasarkan kategori atau nama makanan.',
        'Ada yang spesifik dicari? Saya bisa bantu rekomendasikan berdasarkan cuaca, budget, atau lokasi.',
        'Kuliner Purwokerto sangat beragam. Mau coba yang mana hari ini?',
        `Dengan cuaca ${currentWeather} seperti ini, mungkin ada preferensi khusus untuk makanan?`
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Get weather-based recommendation
function getWeatherRecommendation() {
    let recommendation = '';

    switch (currentWeather) {
        case 'Hujan Ringan':
            const warmFoods = allKulinerData.filter(item => 
                item.kategori.toLowerCase().includes('soto') ||
                item.kategori.toLowerCase().includes('bakso') ||
                item.nama.toLowerCase().includes('hangat')
            );
            if (warmFoods.length > 0) {
                const random = warmFoods[Math.floor(Math.random() * warmFoods.length)];
                recommendation = `Cuaca sedang ${currentWeather}, cocok untuk makanan hangat seperti ${random.nama} di ${random.alamat}.`;
            } else {
                recommendation = `Cuaca sedang ${currentWeather}, cocok untuk makanan hangat seperti soto atau bakso.`;
            }
            break;

        case 'Panas':
            const refreshing = allKulinerData.filter(item => 
                item.kategori.toLowerCase().includes('minuman') ||
                item.kategori.toLowerCase().includes('es') ||
                item.nama.toLowerCase().includes('dingin')
            );
            if (refreshing.length > 0) {
                const random = refreshing[Math.floor(Math.random() * refreshing.length)];
                recommendation = `Cuaca sedang ${currentWeather}, mungkin ${random.nama} di ${random.alamat} bisa menyegarkan.`;
            } else {
                recommendation = `Cuaca sedang ${currentWeather}, cocok untuk minuman dingin atau makanan segar.`;
            }
            break;

        default:
            recommendation = `Cuaca ${currentWeather} sangat cocok untuk jalan-jalan kuliner di Purwokerto!`;
    }

    return recommendation;
}

// Show detail modal
function showDetailModal(itemId) {
    const item = allKulinerData.find(k => k.id == itemId);
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-xl font-bold">${item.nama}</h2>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <img src="${item.foto}" alt="${item.nama}" 
                     class="w-full h-48 object-cover rounded-lg mb-4"
                     onerror="this.src='https://via.placeholder.com/400x200'">

                <div class="space-y-3">
                    <p class="text-gray-600">${item.deskripsi}</p>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-semibold">Alamat:</span><br>
                            ${item.alamat}
                        </div>
                        <div>
                            <span class="font-semibold">Jam Buka:</span><br>
                            ${item.jamBuka}
                        </div>
                        <div>
                            <span class="font-semibold">Kategori:</span><br>
                            ${item.kategori}
                        </div>
                        <div>
                            <span class="font-semibold">Harga:</span><br>
                            Rp ${item.harga}
                        </div>
                        <div>
                            <span class="font-semibold">Rating:</span><br>
                            ${item.rating}/5 ⭐
                        </div>
                        <div>
                            <span class="font-semibold">Parkir:</span><br>
                            ${item.parkir}
                        </div>
                    </div>

                    ${item.jalurGerobak ? `
                        <div class="mt-4 p-3 bg-green-50 rounded-lg">
                            <span class="font-semibold text-green-800">Jalur Gerobak:</span><br>
                            <span class="text-green-600">${item.jalurGerobak}</span>
                        </div>
                    ` : ''}

                    <div class="mt-4 text-xs text-gray-500">
                        Dilaporkan oleh: ${item.pelapor}<br>
                        Waktu: ${new Date(item.timestamp).toLocaleString('id-ID')}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Initialize mobile menu
function initializeMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// Animate gerobak markers (simulate movement)
function animateGerobakMarker(marker) {
    const currentPos = marker.getLatLng();
    const newLat = currentPos.lat + (Math.random() - 0.5) * 0.001;
    const newLng = currentPos.lng + (Math.random() - 0.5) * 0.001;

    marker.setLatLng([newLat, newLng]);
}

// Utility functions
function showLoading(show) {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.classList.toggle('hidden', !show);
    }
}

function showError(message) {
    console.error(message);

    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50';
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Demo data fallback
function getDemoData() {
    return [
        {
            id: 1,
            nama: "Soto Sokaraja Pak Kumis",
            deskripsi: "Soto khas Purwokerto dengan kuah bening dan daging empuk",
            alamat: "Jl. Jenderal Sudirman No. 45",
            koordinat: { lat: -7.4281, lng: 109.2417 },
            jamBuka: "06:00-14:00",
            kategori: "Soto",
            harga: "12.000-18.000",
            rating: 4.5,
            parkir: "Ya",
            jalurGerobak: "",
            foto: "https://via.placeholder.com/300x200",
            pelapor: "demo@unsoed.ac.id",
            timestamp: new Date().toISOString(),
            tipe: "tetap"
        },
        {
            id: 2,
            nama: "Gerobak Bakso Keliling",
            deskripsi: "Bakso halus dengan kuah hangat, bergerak keliling kota",
            alamat: "Keliling Purwokerto",
            koordinat: { lat: -7.4291, lng: 109.2407 },
            jamBuka: "16:00-22:00",
            kategori: "Bakso",
            harga: "8.000-15.000",
            rating: 4.2,
            parkir: "Tidak",
            jalurGerobak: "Jl. Sudirman - Jl. Ahmad Yani - Jl. Overste Isdiman",
            foto: "https://via.placeholder.com/300x200",
            pelapor: "demo@unsoed.ac.id",
            timestamp: new Date().toISOString(),
            tipe: "gerobak"
        }
    ];
}

// Weather recommendation button handler
function getWeatherRecommendationHandler() {
    const recommendation = getWeatherRecommendation();
    addChatMessage('bot', recommendation);

    // Show chat modal if hidden
    const chatModal = document.getElementById('chat-modal');
    if (chatModal && chatModal.classList.contains('hidden')) {
        chatModal.classList.remove('hidden');
    }
}

// Refresh data function
async function refreshData() {
    showLoading(true);
    await loadKulinerData();
    console.log('Data refreshed');
}

// Export functions for global access
window.showDetailModal = showDetailModal;
window.getWeatherRecommendationHandler = getWeatherRecommendationHandler;
window.refreshData = refreshData;
