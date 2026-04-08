document.addEventListener('DOMContentLoaded', async () => {
    // ---- DOM refs ----
    const grid = document.getElementById('main-farmers-grid');
    const searchInput = document.getElementById('farmer-search');
    const filterBtns = document.querySelectorAll('.fp-pill');
    const overlay = document.getElementById('fp-profile-overlay');
    const panel = document.getElementById('fp-profile-panel');
    const panelClose = document.getElementById('fp-panel-close');
    const orderForm = document.getElementById('custom-order-form');
    const toast = document.getElementById('toast');

    let farmersData = [];

    // ---- Fetch Farmer Data ----
    async function fetchFarmers() {
        if (!grid) return;
        grid.innerHTML = '<div class="fp-loading"><i class="ri-loader-4-line ri-spin"></i> Loading farmers...</div>';
        try {
            const res = await fetch('/api/farmers');
            const data = await res.json();
            // Map Firebase data to UI structure
            farmersData = data.map(f => ({
                id: f.userId,
                name: f.farmName || 'Local Farmer',
                location: f.location || 'India',
                produceType: f.produceType || 'Vegetables',
                rating: f.rating || 4.5,
                reviews: f.reviews || Math.floor(Math.random() * 50) + 10, // Simulated for new farmers
                image: f.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.farmName || 'F')}&background=random&size=200`,
                cover: "https://images.unsplash.com/photo-1500937386664-56d1dfef3844?auto=format&fit=crop&q=80&w=800",
                bio: f.description || "A dedicated farmer part of the FarmConnect community.",
                methods: [f.farmingMethod || "Organic", "Natural Pest Control"],
                products: f.produceType ? f.produceType.split(',') : ["Fresh Produce"]
            }));
            renderFarmers(farmersData);
        } catch (err) {
            console.error("Error fetching farmers:", err);
            grid.innerHTML = '<p>Error loading farmers. Please try again later.</p>';
        }
    }

    // ---- Render Cards ----
    function renderFarmers(farmers) {
        if (!grid) return;
        grid.innerHTML = '';

        if (farmers.length === 0) {
            grid.innerHTML = `
                <div class="fp-no-results">
                    <i class="ri-user-search-line"></i>
                    <h3>No farmers found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>`;
            return;
        }

        farmers.forEach(farmer => {
            const isOrganic = String(farmer.produceType).toLowerCase().includes('organic');
            const card = document.createElement('div');
            card.className = 'fp-card';
            card.setAttribute('data-farmer-id', farmer.id);
            card.innerHTML = `
                <div class="fp-card-img">
                    <img src="${farmer.image}" alt="${farmer.name}" loading="lazy">
                    ${isOrganic ? '<span class="fp-card-organic"><i class="ri-leaf-fill"></i> Organic</span>' : ''}
                    <span class="fp-card-rating"><i class="ri-star-fill"></i> ${farmer.rating}</span>
                </div>
                <div class="fp-card-body">
                    <h3 class="fp-card-name">${farmer.name}</h3>
                    <p class="fp-card-loc"><i class="ri-map-pin-line"></i> ${farmer.location}</p>
                    <div class="fp-card-tags">
                        ${String(farmer.produceType).split(',').map(t => `<span class="fp-tag">${t.trim()}</span>`).join('')}
                    </div>
                    <button class="fp-card-cta">View Profile & Order <i class="ri-arrow-right-s-line"></i></button>
                </div>
            `;
            grid.appendChild(card);
            card.addEventListener('click', () => openProfile(farmer));
        });
    }

    // ---- Profile Panel logic (Stayed same) ----
    let currentFarmerId = null;

    // ---- Profile Panel logic ----
    function openProfile(farmer) {
        currentFarmerId = farmer.id;
        const cover = document.getElementById('fp-panel-cover');
        cover.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.45)), url('${farmer.cover}')`;
        document.getElementById('fp-panel-avatar').src = farmer.image;
        document.getElementById('fp-panel-name').textContent = farmer.name;
        document.getElementById('fp-panel-location').textContent = farmer.location;
        document.getElementById('fp-panel-bio').textContent = farmer.bio;
        const starsHTML = Array(5).fill(0).map((_, i) =>
            `<i class="ri-star-${i < Math.floor(farmer.rating) ? 'fill' : 'line'}"></i>`
        ).join('');
        document.getElementById('fp-panel-stars').innerHTML = starsHTML;
        document.getElementById('fp-panel-rating-num').textContent = farmer.rating + '/5';
        document.getElementById('fp-panel-methods').innerHTML = farmer.methods.map(m =>
            `<span class="fp-method-chip"><i class="ri-check-line"></i> ${m}</span>`
        ).join('');
        document.getElementById('fp-panel-products').innerHTML = farmer.products.map(p =>
            `<span class="fp-product-tag">${p}</span>`
        ).join('');
        document.getElementById('fp-order-farmer-label').textContent = farmer.name;
        document.getElementById('hidden-farmer-name').value = farmer.name;
        
        // Reset rating selection
        resetRatingInput();

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        panel.scrollTop = 0;
    }

    function closeProfile() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        orderForm.reset();
        currentFarmerId = null;
    }
    if(panelClose) panelClose.addEventListener('click', closeProfile);
    if(overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeProfile(); });

    // ---- Rating Selection Logic ----
    const starRatingInput = document.getElementById('star-rating-input');
    let selectedRating = 0;

    if(starRatingInput) {
        const stars = starRatingInput.querySelectorAll('i');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.getAttribute('data-value'));
                updateStarDisplay(selectedRating);
            });
            star.addEventListener('mouseover', () => {
                updateStarDisplay(parseInt(star.getAttribute('data-value')));
            });
            star.addEventListener('mouseleave', () => {
                updateStarDisplay(selectedRating);
            });
        });
    }

    function updateStarDisplay(rating) {
        const stars = starRatingInput.querySelectorAll('i');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.replace('ri-star-line', 'ri-star-fill');
                star.classList.add('active');
            } else {
                star.classList.replace('ri-star-fill', 'ri-star-line');
                star.classList.remove('active');
            }
        });
    }

    function resetRatingInput() {
        selectedRating = 0;
        if(starRatingInput) updateStarDisplay(0);
        document.getElementById('rating-feedback').value = '';
    }

    const submitRatingBtn = document.getElementById('submit-rating-btn');
    if(submitRatingBtn) {
        submitRatingBtn.addEventListener('click', async () => {
            if(selectedRating === 0) {
                alert("Please select a star rating.");
                return;
            }
            if(!currentFarmerId) return;

            const feedback = document.getElementById('rating-feedback').value;
            
            try {
                const res = await fetch(`/api/farmer/${currentFarmerId}/review`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating: selectedRating, feedback })
                });
                const data = await res.json();
                if(data.message) {
                    showToast("Thank you for your rating!");
                    resetRatingInput();
                    // Update the UI rating values
                    document.getElementById('fp-panel-rating-num').textContent = data.rating + '/5';
                    // Re-render stars in profile
                    const starsHTML = Array(5).fill(0).map((_, i) =>
                        `<i class="ri-star-${i < Math.floor(data.rating) ? 'fill' : 'line'}"></i>`
                    ).join('');
                    document.getElementById('fp-panel-stars').innerHTML = starsHTML;
                    // Refresh farmers data to update cards
                    fetchFarmers();
                }
            } catch (err) {
                console.error("Error submitting rating:", err);
            }
        });
    }

    function showToast(message) {
        const toastEl = document.getElementById('toast');
        const toastMsg = toastEl.querySelector('span');
        if(toastMsg) toastMsg.textContent = message;
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 3500);
    }

    // ---- Order Form Submission ----
    if(orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(orderForm);
            const payload = {
                farmerId: currentFarmerId,
                productName: formData.get('productName'),
                quantity: formData.get('quantity'),
                deliveryDate: formData.get('deliveryDate'),
                budget: formData.get('budget'),
                notes: formData.get('notes')
            };

            try {
                const res = await fetch('/api/custom-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if(data.orderId) {
                    closeProfile();
                    showToast("Custom order placed successfully!");
                } else {
                    alert("Error: " + (data.error || "Could not place order"));
                }
            } catch (err) {
                console.error("Error placing custom order:", err);
                alert("Something went wrong. Please try again.");
            }
        });
    }

    // ---- Search & Filter ----
    let currentFilter = 'all';
    let searchQuery = '';

    function applyFilters() {
        const filtered = farmersData.filter(farmer => {
            const matchesSearch =
                farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                farmer.location.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter =
                currentFilter === 'all' ||
                String(farmer.produceType).toLowerCase().includes(currentFilter.toLowerCase());
            return matchesSearch && matchesFilter;
        });
        renderFarmers(filtered);
    }

    if(searchInput) searchInput.addEventListener('input', (e) => { searchQuery = e.target.value; applyFilters(); });
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            applyFilters();
        });
    });

    // Navbar effects
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (navbar && window.scrollY > 50) navbar.classList.add('scrolled');
        else if (navbar) navbar.classList.remove('scrolled');
    });

    // ---- Init ----
    fetchFarmers();
});
