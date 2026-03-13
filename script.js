/**
 * FarmConnect - Main JavaScript File
 * Handles UI interactions, dynamic content rendering, and basic state management.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- State Management ---
    let cartItems = [];

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
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productsGrid = document.getElementById('products-grid');
    const farmersGrid = document.getElementById('farmers-grid');
    const contactForm = document.getElementById('contact-form');
    
    // --- Data Sources ---

    // Trending / Top Sellers Data
    const trendingData = [
        {
            id: 101,
            name: "Heirloom Tomatoes",
            category: "vegetables",
            price: "₹55.00",
            unit: "per kg",
            farmer: "Sunrise Organics",
            image: "https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&q=80&w=400",
            isOrganic: true,
            rating: 4.9,
            sold: 320,
            badge: "🔥 Top Seller"
        },
        {
            id: 102,
            name: "Baby Spinach",
            category: "vegetables",
            price: "₹35.00",
            unit: "per bunch",
            farmer: "Green Leaf Farms",
            image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=400",
            isOrganic: true,
            rating: 4.8,
            sold: 210,
            badge: "⭐ Most Loved"
        },
        {
            id: 103,
            name: "Alphonso Mangoes",
            category: "fruits",
            price: "₹120.00",
            unit: "per dozen",
            farmer: "Konkan Fresh",
            image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=400",
            isOrganic: false,
            rating: 5.0,
            sold: 500,
            badge: "🏆 Best Rated"
        },
        {
            id: 104,
            name: "Whole Wheat Flour",
            category: "grains",
            price: "₹45.00",
            unit: "per kg",
            farmer: "Plains Harvest",
            image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400",
            isOrganic: true,
            rating: 4.7,
            sold: 180,
            badge: "🌾 Farmer's Pick"
        }
    ];
    
    // Sample Produce Data
    const productsData = [
        {
            id: 1,
            name: "Organic Tomatoes",
            category: "vegetables",
            price: "₹40.50",
            unit: "per kg",
            farmer: "Green Acres Farm",
            image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400",
            isOrganic: true
        },
        {
            id: 2,
            name: "Fresh Strawberries",
            category: "fruits",
            price: "₹60.00",
            unit: "per box",
            farmer: "Berry Sweet Farms",
            image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=400",
            isOrganic: false
        },
        {
            id: 3,
            name: "Crisp Lettuce",
            category: "vegetables",
            price: "₹20.50",
            unit: "per head",
            farmer: "Valley Greens",
            image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&q=80&w=400",
            isOrganic: true
        },
        {
            id: 4,
            name: "Golden Sweet Corn",
            category: "vegetables",
            price: "₹30.00",
            unit: "per dozen",
            farmer: "Sunny Side Fields",
            image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=400",
            isOrganic: false
        },
        {
            id: 5,
            name: "Rice",
            category: "grains",
            price: "₹50.50",
            unit: "per kg",
            farmer: "Highland Harvest",
            image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400",
            isOrganic: true
        },
        {
            id: 6,
            name: "Fresh Apples",
            category: "fruits",
            price: "₹40.00",
            unit: "per kg",
            farmer: "Orchard Hill",
            image: "https://thumbs.dreamstime.com/b/red-apple-organic-farm-harvesting-garden-ripe-juicy-apples-plastic-box-crate-fruit-autumn-256681529.jpg",
            isOrganic: true
        },
        {
            id: 7,
            name: "Organic Carrots",
            category: "vegetables",
            price: "₹20.00",
            unit: "per bunch",
            farmer: "Rooted Valley",
            image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=400",
            isOrganic: true
        },
        {
            id: 8,
            name: "Lentils",
            category: "grains",
            price: "₹30.50",
            unit: "per kg",
            farmer: "Plains Agriculture",
            image: "https://i0.wp.com/post.medicalnewstoday.com/wp-content/uploads/sites/3/2019/11/lentils-in-a-jug-and-on-a-spoon.jpg?w=1155&h=1734",
            isOrganic: false
        }
    ];

    // Sample Farmers Data
    const farmersData = [
        {
            id: 1,
            name: "Marcus Thorne",
            location: "Willamette Valley, OR",
            specialty: ["Organic Veggies", "Herbs"],
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
            cover: "https://images.unsplash.com/photo-1500937386664-56d1dfef3844?auto=format&fit=crop&q=80&w=400"
        },
        {
            id: 2,
            name: "Elena Rodriguez",
            location: "Central Valley, CA",
            specialty: ["Citrus Fruits", "Avocados"],
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
            cover: "https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&q=80&w=400"
        },
        {
            id: 3,
            name: "David Chen",
            location: "Finger Lakes, NY",
            specialty: ["Apples", "Grapes", "Honey"],
            avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150",
            cover: "https://images.unsplash.com/photo-1505944270255-72b8c68c6a70?auto=format&fit=crop&q=80&w=400"
        }
    ];

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
                        ${product.price} <span>${product.unit}</span>
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
                            ${product.price} <span>${product.unit}</span>
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
                
                const productId = parseInt(btn.getAttribute('data-id'));
                // Look in both productsData and trendingData
                const product = productsData.find(p => p.id === productId)
                             || trendingData.find(p => p.id === productId);
                
                if (!product) return;

                // Add to cart via API
                try {
                    const priceNum = parseFloat(product.price.replace('₹', ''));
                    
                    const res = await fetch('/api/cart/add', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            id: product.id,
                            name: product.name,
                            price: priceNum,
                            image: product.image,
                            category: product.category
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
    }
    
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
                                <button class="qty-btn" onclick="updateCartQuantity(${item.id}, 'decrease')">-</button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateCartQuantity(${item.id}, 'increase')">+</button>
                            </div>
                            <button class="remove-item" onclick="removeFromCart(${item.id})">
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
    initMobileMenu();
    initScrollEffects();
    renderProducts();      // Initial render of all products
    initFilters();
    renderTrending();      // Render trending/top-seller section
    renderFarmers();
    initFormValidation();
    initCartSidebar();
    fetchCart(); // Load initial cart state

});
