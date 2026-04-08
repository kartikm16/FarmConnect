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
    
    // Auth State
    window.currentUser = null;

    // Fetch user from backend session
    async function fetchUser() {
        try {
            const res = await fetch('/api/user');
            const user = await res.json();
            window.currentUser = user;
            updateAuthUI();
        } catch (e) {
            console.error('Failed to fetch user', e);
        }
    }
    
    // Auth UI Update
    function updateAuthUI() {
        const signInBtn = document.getElementById('google-signin-btn-container');
        const userProfile = document.getElementById('user-profile');
        const userName = document.getElementById('user-name');
        const userImg = document.getElementById('user-img');

        if (window.currentUser && (window.currentUser.id || window.currentUser._id)) {
            if(signInBtn) signInBtn.style.display = 'none';
            if(userProfile) {
                userProfile.style.display = 'flex';
                if(userName) userName.textContent = window.currentUser.name || window.currentUser.displayName || 'User';
                if(userImg) userImg.src = window.currentUser.picture || (window.currentUser.photos && window.currentUser.photos[0] ? window.currentUser.photos[0].value : 'https://via.placeholder.com/32');
            }
            console.log("Auth UI Updated: User logged in", window.currentUser.name);
        } else {
            if(signInBtn) signInBtn.style.display = 'block';
            if(userProfile) userProfile.style.display = 'none';
            console.log("Auth UI Updated: No user logged in");
        }
    }
    
    // Logout function
    window.logoutGoogle = async function() {
        try {
            await fetch('/auth/logout', { method: 'POST' });
            window.currentUser = null;
            updateAuthUI();
            fetchCart(); // Refresh cart for guest
        } catch (e) {
            console.error('Logout failed', e);
        }
    }
    let organicOnly    = false;
    let maxPrice       = 200;
    let searchQuery    = '';
    let sortOrder      = 'default';
    let viewMode       = 'grid';

    // -------------------------------------------------------------------
    // ALL PRODUCTS (marketplace + trending merged)
    // -------------------------------------------------------------------
    // Global arrays holding dynamic products
    let allProducts = [];

    async function fetchProducts() {
        try {
            const res = await fetch('/api/products');
            allProducts = await res.json();
            
            // Initial render
            renderProducts();
        } catch(e) { console.error('Failed to fetch products from db:', e); }
    }

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

    // Order History DOM
    const ordersBtn = document.getElementById('my-orders-btn');
    const ordersOverlay = document.getElementById('orders-overlay');
    const ordersSidebar = document.getElementById('orders-sidebar');
    const closeOrdersBtn = document.getElementById('close-orders');
    const ordersListHistory = document.getElementById('orders-list-history');

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
                    <span class="farmer-name"><i class="ri-user-smile-line"></i> ${p.farmer || 'Local Farmer'}</span>
                </div>
                <div class="mp-rating-row">
                    ${renderStars(p.rating)}
                    <span class="mp-rating-num">${p.rating}</span>
                </div>
                <div class="product-price">
                    ${typeof p.price === 'number' ? `₹${p.price.toFixed(2)}` : p.price} <span>${p.unit || '/ kg'}</span>
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
                                <button class="qty-btn" onclick="updateCartQuantity('${item.id}','decrease')">-</button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateCartQuantity('${item.id}','increase')">+</button>
                            </div>
                            <button class="remove-item" onclick="removeFromCart('${item.id}')">
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
    
    function initCartSidebar() {
        if (!cartBtn || !closeCartBtn || !cartOverlay || !cartSidebar) return;
        
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCartSidebar();
        });
        
        closeCartBtn.addEventListener('click', closeCartSidebar);
        cartOverlay.addEventListener('click', closeCartSidebar);
        
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if(cartItems.length === 0) return;
                try {
                    checkoutBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Processing...';
                    const res = await fetch('/api/orders', { method: 'POST' });
                    const val = await res.json();
                    if(res.ok) {
                        checkoutBtn.innerHTML = 'Order Placed! <i class="ri-check-line"></i>';
                        checkoutBtn.style.backgroundColor = 'var(--success)';
                        setTimeout(() => {
                            checkoutBtn.innerHTML = 'Proceed to Checkout';
                            checkoutBtn.style.backgroundColor = '';
                            closeCartSidebar();
                            fetchCart();
                            openOrdersSidebar();
                        }, 2000);
                    } else {
                        alert("Checkout failed: " + (val.error || "Unknown"));
                        checkoutBtn.innerHTML = 'Proceed to Checkout';
                    }
                } catch(e) {
                    console.error(e);
                    checkoutBtn.innerHTML = 'Proceed to Checkout';
                }
            });
        }

        // Orders History listeners
        if (ordersBtn) ordersBtn.addEventListener('click', (e) => { e.preventDefault(); openOrdersSidebar(); });
        if (closeOrdersBtn) closeOrdersBtn.addEventListener('click', closeOrdersSidebar);
        if (ordersOverlay) ordersOverlay.addEventListener('click', closeOrdersSidebar);
    }

    function openOrdersSidebar() {
        ordersSidebar.classList.add('active');
        ordersOverlay.classList.add('active');
        fetchOrderHistory();
    }

    function closeOrdersSidebar() {
        ordersSidebar.classList.remove('active');
        ordersOverlay.classList.remove('active');
    }

    async function fetchOrderHistory() {
        if (!ordersListHistory) return;
        ordersListHistory.innerHTML = '<p>Loading your orders...</p>';
        try {
            const res = await fetch('/api/orders');
            const orders = await res.json();
            if (orders.length === 0) {
                ordersListHistory.innerHTML = '<p>You haven\'t placed any orders yet.</p>';
                return;
            }
            ordersListHistory.innerHTML = orders.map(order => `
                <div class="order-history-item" style="border-bottom: 1px solid #eee; padding: 10px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>Order #${order.id.slice(-6)}</strong>
                        <span>${new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style="font-size: 0.9rem; color: #666; margin: 5px 0;">
                        ${order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                    </div>
                    <strong>Total: ₹${order.totalAmount}</strong>
                    <div style="margin-top: 10px;">
                        ${order.farmerIds ? order.farmerIds.map(fId => `
                            <button onclick="reviewFarmer('${fId}')" class="btn btn-outline" style="font-size: 0.7rem; padding: 4px 8px;">Rate Farmer</button>
                        `).join(' ') : ''}
                    </div>
                </div>
            `).join('');
        } catch (err) {
            ordersListHistory.innerHTML = '<p>Error loading history.</p>';
        }
    }

    window.reviewFarmer = async (fId) => {
        const rating = prompt("Rate this farmer (1-5):", "5");
        const feedback = prompt("Leave a short feedback:");
        if (rating && feedback) {
            try {
                const res = await fetch(`/api/farmer/${fId}/review`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating: parseInt(rating), feedback })
                });
                if (res.ok) alert("Review sent! Thank you.");
            } catch (err) { alert("Review failed."); }
        }
    };

    function attachCartListeners() {
        document.querySelectorAll('.add-btn').forEach(btn => {
            // Avoid double-binding
            btn.replaceWith(btn.cloneNode(true));
        });
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.preventDefault();
                const productId = btn.getAttribute('data-id'); // Keep as string
                const product   = allProducts.find(p => String(p.id) === productId);
                if (!product) {
                    console.error("Product NOT found in allProducts for ID:", productId);
                    return;
                }

                try {
                    let priceNum;
                    if (typeof product.price === 'string') {
                        priceNum = parseFloat(product.price.replace('₹', '').replace(',', ''));
                    } else {
                        priceNum = product.price;
                    }

                    await fetch('/api/cart/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: product.id, 
                            name: product.name,
                            price: priceNum, 
                            image: product.image,
                            category: product.category,
                            farmerId: product.farmerId || ''
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
        const res = await fetch(`/api/cart/remove/${id}`, { 
            method: 'DELETE'
        });
        if (res.ok) { const d = await res.json(); cartItems = d.cart; updateCartUI(); }
    };

    // -------------------------------------------------------------------
    // INIT
    // -------------------------------------------------------------------
    // Load User First
    fetchUser();
    
    // Safety Wrap
    try { initCartSidebar(); }  catch(e){ console.error(e); }
    try { fetchProducts(); }    catch(e){ console.error(e); }
    try { fetchCart(); }        catch(e){ console.error(e); }

});
