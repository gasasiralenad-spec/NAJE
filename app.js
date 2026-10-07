/**
 * Naje Web App Main Frontend Controller
 * Follows Modular JS standards handling UI rendering, State, Cart & i18n dynamic switching.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const state = {
        currentLang: 'rw',
        cart: [],
        menuItems: [],
        activeCategory: 'all'
    };

    // DOM Elements
    const menuContainer = document.getElementById('menu-container');
    const cartBar = document.getElementById('cart-bar');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');
    const modal = document.getElementById('checkout-modal');
    const toast = document.getElementById('toast');

    // Init App
    init();

    async function init() {
        setupEventListeners();
        await fetchMenuItems();
        switchLanguage('rw'); // Default priority: Kinyarwanda
    }

    // Setup Global Event Listeners
    function setupEventListeners() {
        // Language Switchers
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                switchLanguage(e.target.dataset.lang);
            });
        });

        // Category Filter Pills
        document.querySelectorAll('.cat-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                state.activeCategory = e.target.dataset.category;
                renderMenu();
            });
        });

        // Modal Controls
        document.getElementById('btn-checkout').addEventListener('click', openCheckoutModal);
        document.getElementById('close-modal').addEventListener('click', () => modal.hidden = true);
        
        // Checkout Form Submit
        document.getElementById('order-form').addEventListener('submit', handleOrderSubmit);
    }

    // Fetch Fast-Food Menu items from Python API
    async function fetchMenuItems() {
        try {
            const res = await fetch('/api/menu');
            if (!res.ok) throw new Error("Failed fetching menu");
            state.menuItems = await res.json();
            renderMenu();
        } catch (err) {
            showToast("Error loading menu items. Please refresh.", "error");
        }
    }

    // Dynamic UI Language Switching (No page reload required)
    function switchLanguage(lang) {
        if (!translations[lang]) lang = 'rw'; // Fallback to Kinyarwanda
        state.currentLang = lang;

        // Update all DOM nodes with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        renderMenu(); // Re-render menu to update dynamic localized text
        updateCartUI();
    }

    // Render Food Cards dynamically
    function renderMenu() {
        menuContainer.innerHTML = '';
        
        const filtered = state.activeCategory === 'all' 
            ? state.menuItems 
            : state.menuItems.filter(i => i.category === state.activeCategory);

        filtered.forEach(item => {
            const name = item.name[state.currentLang] || item.name['rw'];
            const desc = item.desc[state.currentLang] || item.desc['rw'];
            const minStr = translations[state.currentLang].min_prep || 'min';
            const addBtnStr = translations[state.currentLang].add_to_cart || 'Add';

            const card = document.createElement('article');
            card.className = 'food-card';
            card.innerHTML = `
                <div class="food-img-wrapper">
                    <span class="food-emoji">${item.emoji}</span>
                    <span class="prep-time-tag">⚡ ${item.prep_time} ${minStr}</span>
                </div>
                <div class="food-details">
                    <h3 class="food-title">${name}</h3>
                    <p class="food-desc">${desc}</p>
                    <div class="food-footer">
                        <span class="food-price">${item.price.toLocaleString()} RWF</span>
                        <button class="kfs-btn-primary add-btn" data-id="${item.id}">
                            ${addBtnStr}
                        </button>
                    </div>
                </div>
            `;

            card.querySelector('.add-btn').addEventListener('click', () => addToCart(item));
            menuContainer.appendChild(card);
        });
    }

    // Cart Handlers
    function addToCart(item) {
        const existing = state.cart.find(c => c.id === item.id);
        if (existing) {
            existing.qty += 1;
        } else {
            state.cart.push({ ...item, qty: 1 });
        }
        updateCartUI();
    }

    function updateCartUI() {
        const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
        const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        cartCountEl.textContent = totalCount;
        cartTotalEl.textContent = `${totalPrice.toLocaleString()} RWF`;
    }

    function openCheckoutModal() {
        if (state.cart.length === 0) {
            showToast(translations[state.currentLang].cart_empty);
            return;
        }

        const summaryList = document.getElementById('order-summary-list');
        summaryList.innerHTML = state.cart.map(i => `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
                <span>${i.qty}x ${i.name[state.currentLang]}</span>
                <strong>${(i.price * i.qty).toLocaleString()} RWF</strong>
            </div>
        `).join('');

        modal.hidden = false;
    }

    // Handle Order Submission via REST API
    async function handleOrderSubmit(e) {
        e.preventDefault();
        const phone = document.getElementById('phone').value;
        const station = document.getElementById('station-select').value;
        const pickupMinutes = document.getElementById('pickup-time').value;

        const payload = {
            phone: phone,
            station: station,
            pickup_minutes: pickupMinutes,
            cart: state.cart,
            total_amount: state.cart.reduce((s, i) => s + (i.price * i.qty), 0)
        };

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                modal.hidden = true;
                state.cart = [];
                updateCartUI();
                showToast(translations[state.currentLang].order_success);
            } else {
                showToast(data.error || "Order failed", "error");
            }
        } catch (err) {
            showToast("Network error. Try again.", "error");
        }
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.hidden = false;
        setTimeout(() => { toast.hidden = true; }, 4000);
    }
});
