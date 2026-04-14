const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { db, admin } = require('./db');
const multer = require('multer');
require('dotenv').config();
const app = express();

const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the current directory (index.html, styles.css, script.js, etc.)
app.use(express.static(__dirname));

// Configure Multer for Image Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Session config
app.use(session({
    secret: 'farmconnect_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Passport config
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
      if (db) {
          try {
              const userRef = db.ref(`users/${profile.id}`);
              const snap = await userRef.once('value');
              if (!snap.exists()) {
                  await userRef.set({
                      name: profile.displayName,
                      email: profile.emails?.[0]?.value || '',
                      picture: profile.photos?.[0]?.value || '',
                      role: 'customer',
                      createdAt: admin.database.ServerValue.TIMESTAMP
                  });
              } else {
                  await userRef.update({
                      name: profile.displayName,
                      picture: profile.photos?.[0]?.value || ''
                  });
              }
          } catch (e) { console.error("Firebase auth save error", e); }
      }
      return cb(null, profile);
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// Helper to get logic user ID
function getUserId(req) {
    if (req.isAuthenticated()) {
        return req.user.id;
    } else if (req.session && req.session.id) {
        return `session_${req.session.id}`;
    }
    return 'guest';
}

// Route to serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to serve the dedicated marketplace page
app.get('/marketplace', (req, res) => {
    res.sendFile(path.join(__dirname, 'marketplace.html'));
});

// Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect to home.
    res.redirect('/');
  });

app.get('/api/user', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            // Priority 1: req.user (Passport profile)
            const userId = req.user.id || req.user.sub;
            let userData = {
                id: userId,
                name: req.user.displayName || (req.user.name ? `${req.user.name.givenName} ${req.user.name.familyName}`.trim() : 'User'),
                picture: req.user.photos?.[0]?.value || req.user.picture || '',
                role: 'customer'
            };

            // Priority 2: Firebase Database (if connected) - Overwrites with saved preferences
            if(db) {
                try {
                    const snap = await db.ref(`users/${userId}`).once('value');
                    if (snap.exists()) {
                        const fbUser = snap.val();
                        userData.name = fbUser.name || userData.name;
                        userData.picture = fbUser.picture || userData.picture;
                        userData.role = fbUser.role || userData.role;
                    }
                } catch(dbErr) {
                    console.error("Firebase fetch error in /api/user (falling back to session):", dbErr.message);
                }
            }
            res.json(userData);
        } catch(e) { 
            console.error("Critical error in /api/user:", e);
            res.json(null); 
        }
    } else {
        res.json(null);
    }
});

app.post('/auth/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.json({ message: "Logged out" });
    });
});

// Image Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/public/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});



// --- API Routes for Cart Functionality (Firebase) ---
app.get('/api/cart', async (req, res) => {
    if(!db) return res.json([]);
    const userId = getUserId(req);
    try {
        const snap = await db.ref(`carts/${userId}/items`).once('value');
        const itemsObj = snap.val() || {};
        res.json(Object.values(itemsObj));
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/cart/add', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const { id, name, price, image, category, farmerId } = req.body;
    const userId = getUserId(req);
    
    try {
        const itemRef = db.ref(`carts/${userId}/items/${id}`);
        const snap = await itemRef.once('value');
        if (snap.exists()) {
            await itemRef.update({ quantity: snap.val().quantity + 1 });
        } else {
            await itemRef.set({ id, name, price, image, category, farmerId, quantity: 1 });
        }
        
        // Return updated cart
        const cartSnap = await db.ref(`carts/${userId}/items`).once('value');
        res.status(200).json({ message: 'Item added', cart: Object.values(cartSnap.val() || {}) });
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.put('/api/cart/update/:id', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const itemId = req.params.id;
    const { action } = req.body;
    const userId = getUserId(req);
    
    try {
        const itemRef = db.ref(`carts/${userId}/items/${itemId}`);
        const snap = await itemRef.once('value');
        if (snap.exists()) {
            let newQty = snap.val().quantity;
            if (action === 'increase') newQty += 1;
            else if (action === 'decrease') newQty -= 1;
            
            if (newQty <= 0) {
                await itemRef.remove();
            } else {
                await itemRef.update({ quantity: newQty });
            }
            
            const cartSnap = await db.ref(`carts/${userId}/items`).once('value');
            res.status(200).json({ message: 'Cart updated', cart: Object.values(cartSnap.val() || {}) });
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.delete('/api/cart/remove/:id', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const itemId = req.params.id;
    const userId = getUserId(req);
    try {
        await db.ref(`carts/${userId}/items/${itemId}`).remove();
        const cartSnap = await db.ref(`carts/${userId}/items`).once('value');
        res.status(200).json({ message: 'Item removed', cart: Object.values(cartSnap.val() || {}) });
    } catch(e) { res.status(500).json({error: e.message}); }
});

// --- API Routes for Products ---
app.get('/api/products', async (req, res) => {
    if(!db) return res.json([]);
    try {
        const snap = await db.ref('products').once('value');
        res.json(Object.values(snap.val() || {}));
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/products', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const userId = getUserId(req);
    const { id, name, category, price, qty, image, isOrganic, unit } = req.body;
    try {
        const prodId = id || 'prod-' + Date.now();
        const farmerSnap = await db.ref(`farmers/${userId}`).once('value');
        const farmerName = farmerSnap.exists() ? farmerSnap.val().farmName : 'Local Farmer';
        
        await db.ref(`products/${prodId}`).set({
            id: prodId,
            farmerId: userId,
            farmer: farmerName,
            name, category, price, qty, image, isOrganic, unit: unit || 'per kg',
            rating: 4.5,
            sold: 0
        });
        res.json({ message: "Product saved", id: prodId });
    } catch(e) { res.status(500).json({error: e.message}); }
});

// --- API Routes for Orders ---
app.post('/api/orders', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const userId = getUserId(req);
    
    try {
        const cartSnap = await db.ref(`carts/${userId}/items`).once('value');
        const items = Object.values(cartSnap.val() || {});
        if(items.length === 0) return res.status(400).json({error: "Cart is empty"});
        
        let totalAmount = 0;
        const farmerIds = new Set();
        items.forEach(item => {
            totalAmount += item.price * item.quantity;
            if(item.farmerId) farmerIds.add(item.farmerId);
        });
        
        const newOrderRef = db.ref('orders').push();
        const orderId = newOrderRef.key;
        
        const orderData = {
            id: orderId,
            userId,
            farmerIds: Array.from(farmerIds),
            items,
            totalAmount,
            status: "pending",
            createdAt: admin.database.ServerValue.TIMESTAMP
        };
        
        await newOrderRef.set(orderData);
        await db.ref(`userOrders/${userId}/${orderId}`).set(true);
        for (const fId of farmerIds) {
            await db.ref(`farmerOrders/${fId}/${orderId}`).set(true);
        }
        
        // Clear cart
        await db.ref(`carts/${userId}/items`).remove();
        
        res.status(200).json({ message: "Checkout successful", orderId });
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/custom-order', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const userId = getUserId(req);
    const { farmerId, productName, quantity, deliveryDate, budget, notes } = req.body;
    
    if(!farmerId || !productName || !quantity || !deliveryDate) {
        return res.status(400).json({error: "Missing required fields"});
    }

    try {
        const newOrderRef = db.ref('orders').push();
        const orderId = newOrderRef.key;
        
        const orderData = {
            id: orderId,
            userId,
            farmerIds: [farmerId],
            items: [{
                name: productName,
                quantity: quantity,
                price: budget || 'negotiable',
                farmerId: farmerId,
                type: 'custom'
            }],
            deliveryDate,
            budget: budget || 'N/A',
            notes: notes || '',
            totalAmount: budget || 0,
            status: "pending",
            type: "custom",
            createdAt: admin.database.ServerValue.TIMESTAMP
        };
        
        await newOrderRef.set(orderData);
        await db.ref(`userOrders/${userId}/${orderId}`).set(true);
        await db.ref(`farmerOrders/${farmerId}/${orderId}`).set(true);
        
        res.status(200).json({ message: "Custom order placed successfully", orderId });
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/order/:id/status', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const orderId = req.params.id;
    const { status } = req.body;
    const userId = getUserId(req);
    
    try {
        const orderRef = db.ref(`orders/${orderId}`);
        const snap = await orderRef.once('value');
        if (!snap.exists()) return res.status(404).json({error: "Order not found"});
        
        const order = snap.val();
        // Security: Check if this farmer is one of the farmers for this order
        if (!order.farmerIds || !order.farmerIds.includes(userId)) {
            return res.status(403).json({error: "Unauthorized: You are not a farmer for this order"});
        }
        
        const prevStatus = order.status;
        const newStatus = status.toLowerCase();

        await orderRef.update({ status: newStatus });

        // Add revenue if moving to 'accepted'
        if (newStatus === 'accepted' && prevStatus !== 'accepted') {
             let revenueGenerated = 0;
             if (order.items) {
                 order.items.filter(i => i.farmerId === userId).forEach(i => {
                     revenueGenerated += (i.price * i.quantity);
                 });
             }
             
             if (revenueGenerated > 0) {
                 const incomeRef = db.ref(`farmers/${userId}/totalSales`);
                 await incomeRef.transaction((currentValue) => {
                     return (currentValue || 0) + revenueGenerated;
                 });
             }
        }

        res.json({ message: `Order status updated to ${status}`, status });
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/orders', async (req, res) => {
    if(!db) return res.json([]);
    const userId = getUserId(req);
    try {
        const snap = await db.ref(`userOrders/${userId}`).once('value');
        if(!snap.exists()) return res.json([]);
        
        const orderIds = Object.keys(snap.val());
        const orders = [];
        for (const oId of orderIds) {
            const oSnap = await db.ref(`orders/${oId}`).once('value');
            if (oSnap.exists()) orders.push(oSnap.val());
        }
        res.json(orders);
    } catch(e) { res.status(500).json({error: e.message}); }
});

// --- API Routes to Clear DB ---
app.post('/api/clear', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    try {
        await db.ref('products').remove();
        await db.ref('orders').remove();
        await db.ref('userOrders').remove();
        await db.ref('farmerOrders').remove();
        await db.ref('carts').remove();
        await db.ref('farmers').remove();
        res.json({ message: "Dummy data wiped out entirely. Clean slate (Farmers included)." });
    } catch(e) { res.status(500).json({error: e.message}); }
});

// Seed endpoint for dummy Products!
app.post('/api/seed', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    try {
        const productsData = [
            { id: "101", name: "Fresh Tomatoes", category: "Vegetables", price: 40, unit: "/ kg", farmer: "Ramesh Sharma", farmerId: "farmer_1", location: "Punjab", isOrganic: true, image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800" },
            { id: "102", name: "Organic Carrots", category: "Vegetables", price: 35, unit: "/ kg", farmer: "Suresh Patel", farmerId: "farmer_2", location: "Gujarat", isOrganic: true, image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800" },
            { id: "103", name: "Premium Basmati", category: "Grains", price: 120, unit: "/ kg", farmer: "Singh Farms", farmerId: "farmer_3", location: "Haryana", isOrganic: false, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800" },
            { id: "104", name: "Fresh Strawberries", category: "Fruits", price: 200, unit: "/ kg", farmer: "Hilltop Fruits", farmerId: "farmer_4", location: "Himachal", isOrganic: true, image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800" }
        ];
        
        for (const prod of productsData) {
            await db.ref(`products/${prod.id}`).set(prod);
        }
        res.json({message: "Seeded products successfully!"});
    } catch(e) { res.status(500).json({error: e.message}); }
});

// --- API Routes for Farmer Dashboard ---
app.post('/api/farmer/register', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const userId = getUserId(req);
    if(userId === 'guest' || userId.startsWith('session_')) {
        return res.status(401).json({error: "Must be logged in via Google to register as a farmer."});
    }
    
    const { farmName, location, description, email, password, phone, experience, produceType, farmingMethod, fullName } = req.body;
    
    try {
        await db.ref(`users/${userId}`).update({ 
            role: 'farmer',
            name: fullName || '', 
            email: email || '',
            password: password || '' // Simple storage for demo
        });
        const farmerData = {
            userId,
            email: email || '',
            password: password || '',
            farmName: farmName || 'My Farm',
            phone: phone || '',
            location: location || 'India',
            experience: experience || '0',
            produceType: produceType || '',
            farmingMethod: farmingMethod || '',
            description: description || '',
            rating: 0,
            totalSales: 0,
            reviewsCount: 0
        };
        await db.ref(`farmers/${userId}`).set(farmerData);
        res.json({ message: "Successfully registered as farmer!", farmer: farmerData });
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/farmer/login', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const { email, password } = req.body;
    
    try {
        // Find user by email and password
        const usersSnap = await db.ref('users').once('value');
        const users = usersSnap.val() || {};
        const userId = Object.keys(users).find(id => users[id].email === email && users[id].password === password);
        
        if (userId && users[userId].role === 'farmer') {
            const user = users[userId];
            // Log in the user (Passport session)
            req.login({ id: userId, displayName: user.name, role: 'farmer' }, (err) => {
                if (err) return res.status(500).json({ success: false, error: err.message });
                res.json({ success: true, user: { id: userId, name: user.name, role: 'farmer' } });
            });
        } else {
            res.status(401).json({ success: false, error: "Invalid email, password, or you are not a registered farmer." });
        }
    } catch(e) { res.status(500).json({success: false, error: e.message}); }
});

app.get('/api/farmer/products', async (req, res) => {
    if(!db) return res.json([]);
    const userId = getUserId(req);
    try {
        const snap = await db.ref('products').orderByChild('farmerId').equalTo(userId).once('value');
        res.json(Object.values(snap.val() || {}));
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/farmer/orders', async (req, res) => {
    if(!db) return res.json([]);
    const userId = getUserId(req);
    try {
        const snap = await db.ref(`farmerOrders/${userId}`).once('value');
        if(!snap.exists()) return res.json([]);
        const orderIds = Object.keys(snap.val());
        const orders = [];
        for (const oId of orderIds) {
            const oSnap = await db.ref(`orders/${oId}`).once('value');
            if (oSnap.exists()) orders.push(oSnap.val());
        }
        res.json(orders);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/farmer/analytics', async (req, res) => {
    if(!db) return res.json({ totalRevenue: 0, totalOrders: 0, activeProducts: 0 });
    const userId = getUserId(req);
    try {
        const prodSnap = await db.ref('products').orderByChild('farmerId').equalTo(userId).once('value');
        const activeProducts = Object.keys(prodSnap.val() || {}).length;
        
        let totalRevenue = 0;
        let totalOrders = 0;
        
        const ordSnap = await db.ref(`farmerOrders/${userId}`).once('value');
        if(ordSnap.exists()) {
            const orderIds = Object.keys(ordSnap.val());
            totalOrders = orderIds.length;
            for (const oId of orderIds) {
                const oSnap = await db.ref(`orders/${oId}`).once('value');
                if (oSnap.exists()) {
                     const ord = oSnap.val();
                     if (ord.status === 'accepted') {
                         const myItems = ord.items.filter(i => i.farmerId === userId);
                         myItems.forEach(i => { totalRevenue += i.price * i.quantity });
                     }
                }
            }
        }
        res.json({ totalRevenue, totalOrders, activeProducts });
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/farmer/:id/review', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const { rating, feedback } = req.body;
    const farmerId = req.params.id;
    const userId = getUserId(req);

    try {
        let userName = 'Reviewer';
        if (req.isAuthenticated()) {
            userName = req.user.displayName || 'User';
        } else if (db && userId && !userId.startsWith('session_') && userId !== 'guest') {
            const userSnap = await db.ref(`users/${userId}`).once('value');
            if (userSnap.exists()) {
                userName = userSnap.val().name || 'User';
            }
        }

        const reviewRef = db.ref(`farmers/${farmerId}/reviews`).push();
        await reviewRef.set({ 
            rating: Number(rating), 
            feedback, 
            userName,
            date: new Date().toISOString() 
        });
        
        // Update average rating
        const reviewsSnap = await db.ref(`farmers/${farmerId}/reviews`).once('value');
        const reviews = Object.values(reviewsSnap.val() || {});
        const totalRating = reviews.reduce((sum, rev) => sum + (Number(rev.rating) || 0), 0);
        const avgRating = (totalRating / reviews.length).toFixed(1);
        
        await db.ref(`farmers/${farmerId}`).update({ 
            rating: Number(avgRating),
            reviewsCount: reviews.length
        });

        res.json({ message: "Review posted successfully!", rating: avgRating });
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/farmers', async (req, res) => {
    if(!db) return res.json([]);
    try {
        const snap = await db.ref('farmers').once('value');
        res.json(Object.values(snap.val() || {}));
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/farmer/:id', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const farmerId = req.params.id;
    try {
        const snap = await db.ref(`farmers/${farmerId}`).once('value');
        if (!snap.exists()) return res.status(404).json({error: "Farmer not found"});
        
        const farmer = snap.val();
        // Return farmer data, including reviews if they exist
        res.json(farmer);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/farmer/profile', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const userId = getUserId(req);
    try {
        const snap = await db.ref(`farmers/${userId}`).once('value');
        res.json(snap.val() || {});
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/farmer/profile', async (req, res) => {
    if(!db) return res.status(500).json({error: "No DB"});
    const userId = getUserId(req);
    const { fullName, farmName, phone, location, experience, produceType, farmingMethod } = req.body;
    try {
        if (fullName) {
            await db.ref(`users/${userId}`).update({ name: fullName });
        }
        
        await db.ref(`farmers/${userId}`).update({
            farmName, phone, location, experience, produceType, farmingMethod
        });
        
        // Synchronize farm name in all products listed by this farmer
        const productsSnap = await db.ref('products').once('value');
        if (productsSnap.exists()) {
            const updates = {};
            productsSnap.forEach(child => {
                const prod = child.val();
                if (prod.farmerId === userId) {
                    updates[`${child.key}/farmer`] = farmName;
                }
            });
            if (Object.keys(updates).length > 0) {
                await db.ref('products').update(updates);
            }
        }

        res.json({ message: "Profile updated!", farmName, location });
    } catch(e) { res.status(500).json({error: e.message}); }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});