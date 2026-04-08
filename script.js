/**
 * FarmConnect - Main JavaScript File
 * Handles UI interactions, dynamic content rendering, and basic state management.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- State Management ---
    let cartItems = [];
    
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
                // If the user removed the span (as they did in index.html), this won't crash
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

    // --- DOM Elements ---
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinksList = document.getElementById('nav-links');
    const cartBtn = document.querySelector('.cart-btn');
    const cartCountEl = document.getElementById('cart-count');
    
    // Cart Sidebar Elements
    const cartOverlay = document.getElementById('cart-overlay');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPriceEl = document.getElementById('cart-total-price');

    // Order History DOM
    const ordersBtn = document.getElementById('my-orders-btn');
    const ordersOverlay = document.getElementById('orders-overlay');
    const ordersSidebar = document.getElementById('orders-sidebar');
    const closeOrdersBtn = document.getElementById('close-orders');
    const ordersListHistory = document.getElementById('orders-list-history');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productsGrid = document.getElementById('products-grid');
    const farmersGrid = document.getElementById('farmers-grid');
    const contactForm = document.getElementById('contact-form');
    
    // --- Data Sources ---

    // Trending / Top Sellers & Sample Produce Data
    let trendingData = [];
    let productsData = [];

    let farmersData = [];

    // --- Data Fetching ---
    async function fetchFarmers() {
        try {
            const res = await fetch('/api/farmers');
            const data = await res.json();
            // Map for home page simple display
            farmersData = data.slice(0, 3).map(f => ({
                id: f.userId,
                name: f.farmName || 'Local Farmer',
                location: f.location || 'India',
                specialty: f.produceType ? f.produceType.split(',').slice(0, 2) : ["Organic"],
                avatar: f.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.farmName || 'F')}&background=random&size=150`,
                cover: "https://images.unsplash.com/photo-1500937386664-56d1dfef3844?auto=format&fit=crop&q=80&w=400"
            }));
            renderFarmers();
        } catch(e) { console.error('Failed to fetch farmers:', e); }
    }

    async function fetchProducts() {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            productsData = data;
            
            // Reconstruct trending data by looking at rating/sold (dummy sorts)
            trendingData = [...data].sort((a,b) => (b.rating || 4) - (a.rating || 4)).slice(0, 4);
            
            // Re-render sections
            renderProducts();
            renderTrending();
        } catch(e) { console.error('Failed to fetch products from db:', e); }
    }

    // --- Core Functions ---

    /**
     * Mobile Menu Toggle functionality
     */
    function initMobileMenu() {
        if (!mobileToggle || !navLinksList) return;

        mobileToggle.addEventListener('click', () => {
            navLinksList.classList.toggle('active');
            
            // Toggle icon between menu and close
            const icon = mobileToggle.querySelector('i');
            if (navLinksList.classList.contains('active')) {
                icon.classList.remove('ri-menu-line');
                icon.classList.add('ri-close-line');
            } else {
                icon.classList.remove('ri-close-line');
                icon.classList.add('ri-menu-line');
            }
        });

        // Close mobile menu when a link is clicked
        const navLinks = navLinksList.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navLinksList.classList.remove('active');
                mobileToggle.querySelector('i').classList.replace('ri-close-line', 'ri-menu-line');
            });
        });
    }

    /**
     * Sticky Navigation & Scroll Spy
     */
    function initScrollEffects() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-links a');

        window.addEventListener('scroll', () => {
            // Sticky Navbar
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Scroll Spy
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.scrollY >= (sectionTop - 150)) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').includes(current)) {
                    link.classList.add('active');
                }
            });
        });
    }

    /**
     * Generate HTML for a product card
     */
    function createProductCard(product) {
        const organicBadge = product.isOrganic ? `<span class="product-badge">Organic</span>` : '';
        
        return `
            <div class="product-card" data-category="${product.category}" data-organic="${product.isOrganic}">
                ${organicBadge}
                <div class="product-img-wrap">
                    <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                    <div class="product-action-overlay">
                        <button class="add-to-cart-quick add-btn" data-id="${product.id}" aria-label="Add to cart">
                            <i class="ri-shopping-bag-3-line"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-meta">
                        <span class="farmer-name"><i class="ri-user-smile-line"></i> ${product.farmer}</span>
                    </div>
                    <div class="product-price">
                        ${typeof product.price === 'number' ? `₹${product.price.toFixed(2)}` : product.price} <span>${product.unit || '/ kg'}</span>
                    </div>
                    <button class="btn add-to-cart-btn add-btn" data-id="${product.id}">
                        <i class="ri-shopping-cart-line"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render products to the DOM based on filter
     */
    function renderProducts(filter = 'all') {
        if (!productsGrid) return;

        productsGrid.innerHTML = ''; // Clear current

        let filteredProducts = productsData;
        
        if (filter !== 'all') {
            if (filter === 'organic') {
                filteredProducts = productsData.filter(p => p.isOrganic);
            } else {
                filteredProducts = productsData.filter(p => p.category === filter);
            }
        }

        if(filteredProducts.length === 0) {
            productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">No products found for this category.</p>`;
            return;
        }

        filteredProducts.forEach(product => {
            productsGrid.innerHTML += createProductCard(product);
        });

        // Re-attach event listeners to new Add to Cart buttons
        attachCartListeners();
    }

    /**
     * Initialize Product Filtering
     */
    function initFilters() {
        if (!filterBtns.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                e.target.classList.add('active');
                
                // Get filter value and render
                const filterValue = e.target.getAttribute('data-filter');
                
                // Simple exit animation
                productsGrid.style.opacity = '0';
                
                setTimeout(() => {
                    renderProducts(filterValue);
                    // Entrance animation
                    productsGrid.style.opacity = '1';
                }, 300);
            });
        });
        
        // Ensure initial opacity transition setup
        productsGrid.style.transition = 'opacity 0.3s ease';
    }

    /**
     * Render Trending / Top Sellers Section
     */
    function renderTrending() {
        const trendingGrid = document.getElementById('trending-grid');
        if (!trendingGrid) return;

        trendingGrid.innerHTML = '';

        trendingData.forEach(product => {
            const stars = '⭐'.repeat(Math.floor(product.rating));
            const card = `
                <div class="product-card trending-card" data-category="${product.category}">
                    <div class="trending-badge">${product.badge}</div>
                    <div class="product-img-wrap">
                        <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                        <div class="product-action-overlay">
                            <button class="add-to-cart-quick add-btn" data-id="${product.id}" data-source="trending" aria-label="Add to cart">
                                <i class="ri-shopping-bag-3-line"></i>
                            </button>
                        </div>
                    </div>
                    <div class="product-info">
                        <span class="product-category">${product.category}</span>
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-meta">
                            <span class="farmer-name"><i class="ri-user-smile-line"></i> ${product.farmer}</span>
                        </div>
                        <div class="trending-stats">
                            <span class="rating-stars">${stars} <strong>${product.rating}</strong></span>
                            <span class="sold-count"><i class="ri-fire-line"></i> ${product.sold}+ sold</span>
                        </div>
                        <div class="product-price">
                            ${typeof product.price === 'number' ? `₹${product.price.toFixed(2)}` : product.price} <span>${product.unit || '/ kg'}</span>
                        </div>
                        <button class="btn add-to-cart-btn add-btn" data-id="${product.id}" data-source="trending">
                            <i class="ri-shopping-cart-line"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `;
            trendingGrid.innerHTML += card;
        });

        // Re-attach cart listeners so these cards work too
        attachCartListeners();
    }

    /**
     * Render Farmers Section
     */
    function renderFarmers() {
        if (!farmersGrid) return;

        farmersGrid.innerHTML = '';

        farmersData.forEach(farmer => {
            const tagsHtml = farmer.specialty.map(tag => `<span class="tag">${tag}</span>`).join('');
            
            const farmerCard = `
                <div class="farmer-card">
                    <div class="farmer-cover" style="background-image: linear-gradient(rgba(46, 125, 50, 0.4), rgba(0,0,0,0.7)), url('${farmer.cover}')"></div>
                    <img src="${farmer.avatar}" alt="${farmer.name}" class="farmer-avatar" loading="lazy">
                    <h3 class="farmer-name">${farmer.name}</h3>
                    <div class="farmer-location"><i class="ri-map-pin-line"></i> ${farmer.location}</div>
                    <div class="farmer-tags">
                        ${tagsHtml}
                    </div>
                    <a href="#" class="btn btn-outline" style="padding: 0.5rem 1rem; border-width: 1px;">View Farm</a>
                </div>
            `;
            farmersGrid.innerHTML += farmerCard;
        });
    }

    /**
     * Shopping Cart logic — products from trendingData are also supported
     */
     
    // Fetch initial cart from server
    async function fetchCart() {
        try {
            const res = await fetch('/api/cart');
            const data = await res.json();
            cartItems = data;
            updateCartUI();
        } catch (err) {
            console.error('Error fetching cart:', err);
        }
    }

    function attachCartListeners() {
        const addBtns = document.querySelectorAll('.add-btn');
        
        addBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const productId = btn.getAttribute('data-id'); // Keep as string for Firebase IDs
                // Look in both productsData and trendingData
                const product = productsData.find(p => String(p.id) === productId)
                             || trendingData.find(p => String(p.id) === productId);
                
                if (!product) {
                    console.error("Product NOT found in local data for ID:", productId);
                    return;
                }

                // Add to cart via API
                try {
                    let priceNum;
                    if (typeof product.price === 'string') {
                        priceNum = parseFloat(product.price.replace('₹', '').replace(',', ''));
                    } else {
                        priceNum = product.price;
                    }
                    
                    const res = await fetch('/api/cart/add', {
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
                    
                    if (res.ok) {
                        // Refresh cart UI
                        await fetchCart();
                        
                        // Button feedback
                        const originalText = btn.innerHTML;
                        if(btn.classList.contains('add-to-cart-btn')) {
                            btn.innerHTML = `<i class="ri-check-line"></i> Added`;
                            btn.style.backgroundColor = 'var(--primary)';
                            btn.style.color = 'white';
                        } else {
                            btn.innerHTML = `<i class="ri-check-line"></i>`;
                        }

                        setTimeout(() => {
                            btn.innerHTML = originalText;
                            if(btn.classList.contains('add-to-cart-btn')) {
                                btn.style.backgroundColor = '';
                                btn.style.color = '';
                            }
                        }, 1500);
                        
                        // Open sidebar to show item added
                        openCartSidebar();
                    }
                } catch (err) {
                    console.error('Error adding to cart:', err);
                }
            });
        });
    }

    function updateCartUI() {
        if(!cartCountEl) return;
        
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = totalItems;
        
        // Trigger animation
        cartCountEl.classList.remove('animate');
        // Trigger reflow
        void cartCountEl.offsetWidth;
        cartCountEl.classList.add('animate');
        
        renderCartSidebar();
    }
    
    // Cart Sidebar Logic
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
                            openOrdersSidebar(); // Show history after success
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
    
    function openCartSidebar() {
        if (cartSidebar && cartOverlay) {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
    }
    
    function closeCartSidebar() {
        if (cartSidebar && cartOverlay) {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    function renderCartSidebar() {
        if (!cartItemsContainer || !cartTotalPriceEl) return;
        
        cartItemsContainer.innerHTML = '';
        let total = 0;
        
        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty</div>';
            cartTotalPriceEl.textContent = '₹0.00';
            return;
        }
        
        cartItems.forEach(item => {
            total += (item.price * item.quantity);
            
            const itemHTML = `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                        <div class="cart-item-actions">
                            <div class="qty-control">
                                <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 'decrease')">-</button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 'increase')">+</button>
                            </div>
                            <button class="remove-item" onclick="removeFromCart('${item.id}')">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cartItemsContainer.innerHTML += itemHTML;
        });
        
        cartTotalPriceEl.textContent = `₹${total.toFixed(2)}`;
    }
    
    // Expose global functions for onclick handlers in cart sidebar
    window.updateCartQuantity = async (id, action) => {
        try {
            const res = await fetch(`/api/cart/update/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                const data = await res.json();
                cartItems = data.cart;
                updateCartUI();
            }
        } catch (err) {
            console.error('Error updating quantity:', err);
        }
    };
    
    window.removeFromCart = async (id) => {
        try {
            const res = await fetch(`/api/cart/remove/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                const data = await res.json();
                cartItems = data.cart;
                updateCartUI();
            }
        } catch (err) {
            console.error('Error removing item:', err);
        }
    };

    /**
     * Form Validation
     */
    function initFormValidation() {
        if (!contactForm) return;

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const successMsg = document.getElementById('form-success');
        const submitBtn = document.getElementById('submit-btn');

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;

            // Reset errors
            document.querySelectorAll('.form-group').forEach(group => group.classList.remove('error'));

            // Name
            if (nameInput.value.trim() === '') {
                nameInput.parentElement.classList.add('error');
                isValid = false;
            }

            // Email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value.trim())) {
                emailInput.parentElement.classList.add('error');
                isValid = false;
            }

            // Message
            if (messageInput.value.trim() === '') {
                messageInput.parentElement.classList.add('error');
                isValid = false;
            }

            if (isValid) {
                // Simulate form submission
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Sending... <i class="ri-loader-4-line ri-spin"></i>';
                
                setTimeout(() => {
                    successMsg.classList.remove('hidden');
                    contactForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Send Message <i class="ri-send-plane-fill"></i>';
                    
                    // Hide success message after 5 seconds
                    setTimeout(() => {
                        successMsg.classList.add('hidden');
                    }, 5000);
                }, 1500);
            }
        });
    }

    // --- Initialize Everything ---
    // Load user state first to ensure UI updates even if other components fail
    fetchUser(); 
    
    // Wrap other initializations in try-catch to prevent a single component crash from breaking the whole page
    try { initMobileMenu(); } catch(e) { console.error("initMobileMenu error", e); }
    try { initScrollEffects(); } catch(e) { console.error("initScrollEffects error", e); }
    try { renderProducts(); } catch(e) { console.error("renderProducts error", e); }
    try { initFilters(); } catch(e) { console.error("initFilters error", e); }
    try { renderTrending(); } catch(e) { console.error("renderTrending error", e); }
    try { initTestimonialSlider(); } catch(e) { console.error("initTestimonialSlider error", e); }
    try { initFormValidation(); } catch(e) { console.error("initFormValidation error", e); }
    try { initCartSidebar(); } catch(e) { console.error("initCartSidebar error", e); }
    try { fetchProducts(); } catch(e) { console.error("fetchProducts error", e); }
    try { fetchFarmers(); } catch(e) { console.error("fetchFarmers error", e); }

});
