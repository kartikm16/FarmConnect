/**
 * FarmConnect - Dedicated Marketplace Page Script
 * Full product catalogue with live search, category filter, organic toggle,
 * price-range slider, sort, grid/list toggle, and a full cart sidebar.
 */

document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------
    let cartItems   = [];
    let activeCategory = 'all';
    let organicOnly    = false;
    let maxPrice       = 200;
    let searchQuery    = '';
    let sortOrder      = 'default';
    let viewMode       = 'grid';

    // -------------------------------------------------------------------
    // ALL PRODUCTS (marketplace + trending merged)
    // -------------------------------------------------------------------
    const allProducts = [
        { id: 1,   name: "Organic Tomatoes",    category: "vegetables", price: 40.50,  unit: "per kg",     farmer: "Green Acres Farm",    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400",  isOrganic: true,  rating: 4.5 },
        { id: 2,   name: "Fresh Strawberries",  category: "fruits",     price: 60.00,  unit: "per box",    farmer: "Berry Sweet Farms",   image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=400",  isOrganic: false, rating: 4.3 },
        { id: 3,   name: "Crisp Lettuce",       category: "vegetables", price: 20.50,  unit: "per head",   farmer: "Valley Greens",       image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&q=80&w=400",  isOrganic: true,  rating: 4.2 },
        { id: 4,   name: "Golden Sweet Corn",   category: "vegetables", price: 30.00,  unit: "per dozen",  farmer: "Sunny Side Fields",   image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=400",  isOrganic: false, rating: 4.0 },
        { id: 5,   name: "Rice",                category: "grains",     price: 50.50,  unit: "per kg",     farmer: "Highland Harvest",    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400",  isOrganic: true,  rating: 4.6 },
        { id: 6,   name: "Fresh Apples",        category: "fruits",     price: 40.00,  unit: "per kg",     farmer: "Orchard Hill",        image: "https://thumbs.dreamstime.com/b/red-apple-organic-farm-harvesting-garden-ripe-juicy-apples-plastic-box-crate-fruit-autumn-256681529.jpg", isOrganic: true, rating: 4.7 },
        { id: 7,   name: "Organic Carrots",     category: "vegetables", price: 20.00,  unit: "per bunch",  farmer: "Rooted Valley",       image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=400",  isOrganic: true,  rating: 4.4 },
        { id: 8,   name: "Lentils",             category: "grains",     price: 30.50,  unit: "per kg",     farmer: "Plains Agriculture",  image: "https://i0.wp.com/post.medicalnewstoday.com/wp-content/uploads/sites/3/2019/11/lentils-in-a-jug-and-on-a-spoon.jpg?w=1155&h=1734", isOrganic: false, rating: 4.1 },
        { id: 101, name: "Heirloom Tomatoes",   category: "vegetables", price: 55.00,  unit: "per kg",     farmer: "Sunrise Organics",    image: "https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&q=80&w=400",  isOrganic: true,  rating: 4.9 },
        { id: 102, name: "Baby Spinach",        category: "vegetables", price: 35.00,  unit: "per bunch",  farmer: "Green Leaf Farms",    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=400",  isOrganic: true,  rating: 4.8 },
        { id: 103, name: "Alphonso Mangoes",    category: "fruits",     price: 120.00, unit: "per dozen",  farmer: "Konkan Fresh",        image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=400",  isOrganic: false, rating: 5.0 },
        { id: 104, name: "Whole Wheat Flour",   category: "grains",     price: 45.00,  unit: "per kg",     farmer: "Plains Harvest",      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400",  isOrganic: true,  rating: 4.7 },
    ];

    // -------------------------------------------------------------------
    // DOM REFS
    // -------------------------------------------------------------------
    const navbar            = document.getElementById('navbar');
    const mobileToggle      = document.getElementById('mobile-toggle');
    const navLinksList      = document.getElementById('nav-links');
    const cartBtn           = document.querySelector('.cart-btn');
    const cartCountEl       = document.getElementById('cart-count');
    const cartOverlay       = document.getElementById('cart-overlay');
    const cartSidebar       = document.getElementById('cart-sidebar');
    const closeCartBtn      = document.getElementById('close-cart');
    const cartItemsContainer= document.getElementById('cart-items');
    const cartTotalPriceEl  = document.getElementById('cart-total-price');

    const searchInput       = document.getElementById('mp-search');
    const clearSearchBtn    = document.getElementById('clear-search');
    const sortSelect        = document.getElementById('mp-sort');
    const organicCheckbox   = document.getElementById('organic-filter');
    const priceRange        = document.getElementById('price-range');
    const priceRangeValue   = document.getElementById('price-range-value');
    const categoryRadios    = document.querySelectorAll('input[name="category"]');
    const resetFiltersBtn   = document.getElementById('reset-filters');
    const noResultsResetBtn = document.getElementById('no-results-reset');
    const productsGrid      = document.getElementById('mp-products-grid');
    const resultsCount      = document.getElementById('results-count');
    const noResults         = document.getElementById('mp-no-results');
    const activeFiltersEl   = document.getElementById('active-filters');
    const viewBtns          = document.querySelectorAll('.view-btn');

    // -------------------------------------------------------------------
    // NAVBAR
    // -------------------------------------------------------------------
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    if (mobileToggle && navLinksList) {
        mobileToggle.addEventListener('click', () => {
            navLinksList.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.toggle('ri-menu-line');
            icon.classList.toggle('ri-close-line');
        });
    }

    // -------------------------------------------------------------------
    // RENDERING
    // -------------------------------------------------------------------
    function getFilteredSortedProducts() {
        let list = [...allProducts];

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.farmer.toLowerCase().includes(q)
            );
        }

        // Category
        if (activeCategory !== 'all') {
            list = list.filter(p => p.category === activeCategory);
        }

        // Organic
        if (organicOnly) {
            list = list.filter(p => p.isOrganic);
        }

        // Price
        list = list.filter(p => p.price <= maxPrice);

        // Sort
        switch (sortOrder) {
            case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
            case 'price-desc': list.sort((a, b) => b.price - a.price); break;
            case 'name-asc':   list.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'rating-desc':list.sort((a, b) => b.rating - a.rating); break;
        }

        return list;
    }

    function renderStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5 ? 1 : 0;
        const empty = 5 - full - half;
        return '<span style="color:var(--accent-light); font-size:0.8rem;">'
            + '<i class="ri-star-fill"></i>'.repeat(full)
            + '<i class="ri-star-half-line"></i>'.repeat(half)
            + '<i class="ri-star-line"></i>'.repeat(empty)
            + '</span>';
    }

    function createCard(p, mode) {
        const organicBadge = p.isOrganic
            ? `<span class="product-badge">Organic</span>` : '';

        if (mode === 'list') {
            return `
            <div class="mp-list-item" data-id="${p.id}">
                <div class="mp-list-img-wrap">
                    ${organicBadge}
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                </div>
                <div class="mp-list-info">
                    <span class="product-category">${p.category}</span>
                    <h3 class="product-title">${p.name}</h3>
                    <div class="mp-list-meta">
                        ${renderStars(p.rating)} <strong>${p.rating}</strong>
                        &nbsp;&nbsp;<span class="farmer-name"><i class="ri-user-smile-line"></i> ${p.farmer}</span>
                    </div>
                    <p class="mp-list-unit">${p.unit}</p>
                </div>
                <div class="mp-list-actions">
                    <div class="product-price">₹${p.price.toFixed(2)} <span>${p.unit}</span></div>
                    <button class="btn add-to-cart-btn add-btn" data-id="${p.id}">
                        <i class="ri-shopping-cart-line"></i> Add to Cart
                    </button>
                </div>
            </div>`;
        }

        // Grid card
        return `
        <div class="product-card" data-id="${p.id}">
            ${organicBadge}
            <div class="product-img-wrap">
                <img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy">
                <div class="product-action-overlay">
                    <button class="add-to-cart-quick add-btn" data-id="${p.id}" aria-label="Add to cart">
                        <i class="ri-shopping-bag-3-line"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3 class="product-title">${p.name}</h3>
                <div class="product-meta">
                    <span class="farmer-name"><i class="ri-user-smile-line"></i> ${p.farmer}</span>
                </div>
                <div class="mp-rating-row">
                    ${renderStars(p.rating)}
                    <span class="mp-rating-num">${p.rating}</span>
                </div>
                <div class="product-price">
                    ₹${p.price.toFixed(2)} <span>${p.unit}</span>
                </div>
                <button class="btn add-to-cart-btn add-btn" data-id="${p.id}">
                    <i class="ri-shopping-cart-line"></i> Add to Cart
                </button>
            </div>
        </div>`;
    }

    function renderProducts() {
        const list = getFilteredSortedProducts();

        productsGrid.className = viewMode === 'list'
            ? 'mp-products-list' : 'mp-products-grid';

        productsGrid.innerHTML = list.map(p => createCard(p, viewMode)).join('');

        // Count label
        resultsCount.textContent = `${list.length} product${list.length !== 1 ? 's' : ''} found`;

        // Show / hide no-results
        noResults.classList.toggle('hidden', list.length > 0);
        productsGrid.classList.toggle('hidden', list.length === 0);

        // Active filter chips
        renderFilterChips();

        // Bind cart buttons
        attachCartListeners();
    }

    function renderFilterChips() {
        const chips = [];
        if (searchQuery)           chips.push({ label: `Search: "${searchQuery}"`, reset: () => { searchQuery = ''; searchInput.value = ''; } });
        if (activeCategory !== 'all') chips.push({ label: `Category: ${activeCategory}`, reset: () => { activeCategory = 'all'; document.querySelector('input[name="category"][value="all"]').checked = true; } });
        if (organicOnly)           chips.push({ label: 'Organic Only', reset: () => { organicOnly = false; organicCheckbox.checked = false; } });
        if (maxPrice < 200)        chips.push({ label: `Max ₹${maxPrice}`, reset: () => { maxPrice = 200; priceRange.value = 200; priceRangeValue.textContent = '₹200'; } });

        activeFiltersEl.innerHTML = chips.map((c, i) =>
            `<span class="filter-chip">${c.label} <button class="chip-remove" data-chip="${i}"><i class="ri-close-line"></i></button></span>`
        ).join('');

        activeFiltersEl.querySelectorAll('.chip-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                chips[parseInt(btn.dataset.chip)].reset();
                renderProducts();
            });
        });
    }

    // -------------------------------------------------------------------
    // FILTER EVENT LISTENERS
    // -------------------------------------------------------------------
    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim();
        clearSearchBtn.classList.toggle('visible', searchQuery.length > 0);
        renderProducts();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.remove('visible');
        searchInput.focus();
        renderProducts();
    });

    sortSelect.addEventListener('change', () => {
        sortOrder = sortSelect.value;
        renderProducts();
    });

    categoryRadios.forEach(r => {
        r.addEventListener('change', () => {
            activeCategory = r.value;
            renderProducts();
        });
    });

    organicCheckbox.addEventListener('change', () => {
        organicOnly = organicCheckbox.checked;
        renderProducts();
    });

    priceRange.addEventListener('input', () => {
        maxPrice = parseInt(priceRange.value);
        priceRangeValue.textContent = `₹${maxPrice}`;
        renderProducts();
    });

    function resetFilters() {
        searchQuery    = '';
        activeCategory = 'all';
        organicOnly    = false;
        maxPrice       = 200;
        sortOrder      = 'default';

        searchInput.value = '';
        clearSearchBtn.classList.remove('visible');
        document.querySelector('input[name="category"][value="all"]').checked = true;
        organicCheckbox.checked = false;
        priceRange.value        = 200;
        priceRangeValue.textContent = '₹200';
        sortSelect.value        = 'default';

        renderProducts();
    }

    resetFiltersBtn.addEventListener('click', resetFilters);
    noResultsResetBtn.addEventListener('click', resetFilters);

    // View toggle (grid / list)
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            viewMode = btn.dataset.view;
            renderProducts();
        });
    });

    // -------------------------------------------------------------------
    // CART
    // -------------------------------------------------------------------
    async function fetchCart() {
        try {
            const res = await fetch('/api/cart');
            cartItems = await res.json();
            updateCartUI();
        } catch (err) { console.error('fetchCart:', err); }
    }

    function updateCartUI() {
        const total = cartItems.reduce((s, i) => s + i.quantity, 0);
        cartCountEl.textContent = total;
        cartCountEl.classList.remove('animate');
        void cartCountEl.offsetWidth;
        cartCountEl.classList.add('animate');
        renderCartSidebar();
    }

    function renderCartSidebar() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty</div>';
            cartTotalPriceEl.textContent = '₹0.00';
            return;
        }

        cartItems.forEach(item => {
            total += item.price * item.quantity;
            cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                        <div class="cart-item-actions">
                            <div class="qty-control">
                                <button class="qty-btn" onclick="updateCartQuantity(${item.id},'decrease')">-</button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateCartQuantity(${item.id},'increase')">+</button>
                            </div>
                            <button class="remove-item" onclick="removeFromCart(${item.id})">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    </div>
                </div>`;
        });

        cartTotalPriceEl.textContent = `₹${total.toFixed(2)}`;
    }

    function openCartSidebar()  { cartSidebar.classList.add('active'); cartOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeCartSidebar() { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); document.body.style.overflow = ''; }

    cartBtn.addEventListener('click', e => { e.preventDefault(); openCartSidebar(); });
    closeCartBtn.addEventListener('click', closeCartSidebar);
    cartOverlay.addEventListener('click', closeCartSidebar);

    function attachCartListeners() {
        document.querySelectorAll('.add-btn').forEach(btn => {
            // Avoid double-binding
            btn.replaceWith(btn.cloneNode(true));
        });
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.preventDefault();
                const productId = parseInt(btn.getAttribute('data-id'));
                const product   = allProducts.find(p => p.id === productId);
                if (!product) return;

                try {
                    await fetch('/api/cart/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: product.id, name: product.name,
                            price: product.price, image: product.image,
                            category: product.category
                        })
                    });
                    await fetchCart();

                    // Button feedback
                    const orig = btn.innerHTML;
                    if (btn.classList.contains('add-to-cart-btn')) {
                        btn.innerHTML = '<i class="ri-check-line"></i> Added';
                        btn.style.backgroundColor = 'var(--primary)';
                        btn.style.color = 'white';
                    } else {
                        btn.innerHTML = '<i class="ri-check-line"></i>';
                    }
                    setTimeout(() => {
                        btn.innerHTML = orig;
                        btn.style.backgroundColor = '';
                        btn.style.color = '';
                    }, 1500);

                    openCartSidebar();
                } catch (err) { console.error('addToCart:', err); }
            });
        });
    }

    window.updateCartQuantity = async (id, action) => {
        const res = await fetch(`/api/cart/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        if (res.ok) { const d = await res.json(); cartItems = d.cart; updateCartUI(); }
    };

    window.removeFromCart = async (id) => {
        const res = await fetch(`/api/cart/remove/${id}`, { method: 'DELETE' });
        if (res.ok) { const d = await res.json(); cartItems = d.cart; updateCartUI(); }
    };

    // -------------------------------------------------------------------
    // INIT
    // -------------------------------------------------------------------
    renderProducts();
    fetchCart();
});
