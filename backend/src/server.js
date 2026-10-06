require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

// Database Connection
const { connectDB } = require('./config/db');

// Models & Middleware
const User = require('./database/models/User');
const { authenticate, authorize } = require('./middleware/auth');

// Route Handlers
const cropRoutes = require('./crops/routes/cropRoutes');
const questionRoutes = require('./questions/routes/questionRoutes');
const productRoutes = require('./products/routes/productRoutes');
const categoryRoutes = require('./categories/routes/categoryRoutes');
const recommendationRoutes = require('./recommendations/routes/recommendationRoutes');
const cartRoutes = require('./cart/routes/cartRoutes');
const { router: orderRoutes } = require('./orders/routes/orderRoutes');
const paymentRoutes = require('./payments/routes/paymentRoutes');
const trackingRoutes = require('./delivery/routes/trackingRoutes');
const adminRoutes = require('./admin/routes/adminRoutes');
const farmerRoutes = require('./farmer/routes/farmerRoutes');
const retailerRoutes = require('./retailer/routes/retailerRoutes');
const deliveryRoutes = require('./delivery/routes/deliveryRoutes');

// Sockets
const { initializeDeliverySocket } = require('./sockets/deliverySocket');

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Configuration Constants
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'kisanmitra-dev-secret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kisanmitra';

// Helpers & Utilities
const createToken = (user) => jwt.sign(
  { id: user._id ? user._id.toString() : user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const sanitizeUser = (user) => {
  const plainUser = user.toObject ? user.toObject() : user;
  const { password, __v, ...safeUser } = plainUser;
  const resolvedStatus = safeUser.accountStatus || safeUser.status || 'PENDING';
  return {
    ...safeUser,
    id: safeUser._id ? safeUser._id.toString() : safeUser.id,
    role: safeUser.role,
    status: resolvedStatus,
    accountStatus: resolvedStatus
  };
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
const isValidMobile = (mobile) => /^\d{10}$/.test(String(mobile || '').replace(/\s+/g, ''));
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// Core Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Domain Routes
app.use('/api/crops', cropRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery-tracking', trackingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/retailer', retailerRoutes);
app.use('/api/delivery', deliveryRoutes);

// Health Checks (root and /api namespace)
const healthHandler = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// -----------------------------------------------------------------
// Authentication Routes
// -----------------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword, homeAddress, farmAddress } = req.body;

    if (!name || !email || !mobile || !password || !confirmPassword || !homeAddress || !farmAddress) {
      return res.status(400).json({ message: 'Please fill in all required farmer fields.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (!isValidMobile(mobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password do not match.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { mobile: String(mobile).replace(/\s+/g, '') }
      ]
    });

    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email or mobile number already exists.' });
    }

    const userDoc = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      mobile: String(mobile).replace(/\s+/g, ''),
      password: await bcrypt.hash(password, 12),
      role: 'farmer',
      homeAddress: String(homeAddress).trim(),
      farmAddress: String(farmAddress).trim(),
      city: req.body.city || '',
      state: req.body.state || '',
      pincode: req.body.pincode || '',
      accountStatus: 'PENDING',
      status: 'PENDING'
    });

    const token = createToken(userDoc);
    return res.status(201).json({
      message: 'Farmer registration successful.',
      token,
      user: sanitizeUser(userDoc)
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Unable to register farmer right now.' });
  }
});

app.post('/api/auth/retailer/register', async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedMobile = String(mobile || '').replace(/\s+/g, '');

    if (!String(name || '').trim() || !normalizedEmail || !normalizedMobile || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Name, email, mobile, password, and confirmation are required.' });
    }
    if (!isValidEmail(normalizedEmail)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!isValidMobile(normalizedMobile)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.' });
    if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Password and confirmation do not match.' });

    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }] }).select('_id');
    if (existing) return res.status(409).json({ message: 'An account with this email or mobile already exists.' });

    const retailer = await User.create({
      name: String(name).trim(),
      ownerName: String(name).trim(),
      email: normalizedEmail,
      mobile: normalizedMobile,
      password: await bcrypt.hash(password, 12),
      role: 'retailer',
      status: 'PENDING',
      accountStatus: 'PENDING'
    });

    const token = createToken(retailer);
    return res.status(201).json({ message: 'Retailer account created. Complete your business profile.', token, user: sanitizeUser(retailer) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email or mobile already exists.' });
    console.error('Retailer registration error:', error);
    return res.status(500).json({ message: 'Unable to register retailer.' });
  }
});

app.post('/api/auth/delivery/register', async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword, vehicleType, vehicleRegistration } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedMobile = String(mobile || '').replace(/\s+/g, '');

    if (!String(name || '').trim() || !normalizedEmail || !normalizedMobile || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Name, email, mobile, password, and confirmation are required.' });
    }
    if (!isValidEmail(normalizedEmail)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!isValidMobile(normalizedMobile)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.' });
    if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Password and confirmation do not match.' });

    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }] }).select('_id');
    if (existing) return res.status(409).json({ message: 'An account with this email or mobile already exists.' });

    const partner = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      mobile: normalizedMobile,
      password: await bcrypt.hash(password, 12),
      role: 'delivery',
      vehicleType: String(vehicleType || '').trim(),
      vehicleRegistration: String(vehicleRegistration || '').trim(),
      isAvailable: false,
      status: 'PENDING',
      accountStatus: 'PENDING'
    });

    const token = createToken(partner);
    return res.status(201).json({ message: 'Delivery partner account created and pending review.', token, user: sanitizeUser(partner) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email or mobile already exists.' });
    console.error('Delivery registration error:', error);
    return res.status(500).json({ message: 'Unable to register delivery partner.' });
  }
});

const handleUserLogin = async (req, res) => {
  try {
    const { email, mobile, password, role } = req.body;
    const lookupValue = email || mobile;

    if (!lookupValue || !password) {
      return res.status(400).json({ message: 'Email/phone and password are required.' });
    }

    const user = await User.findOne({
      $or: [
        { email: normalizeEmail(lookupValue) },
        { mobile: String(lookupValue).replace(/\s+/g, '') }
      ],
      ...(role ? { role } : {})
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid login credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid login credentials.' });
    }

    const token = createToken(user);
    return res.json({
      message: 'Login successful.',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unable to log in at this time.' });
  }
};

app.post('/api/auth/login', handleUserLogin);

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token, name, email, mobile } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(400).json({ message: 'Google authentication is not configured yet.' });
    }

    if (!token || !name || !email) {
      return res.status(400).json({ message: 'Google authentication data is incomplete.' });
    }

    let user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      user = await User.create({
        name,
        email: normalizeEmail(email),
        mobile: mobile || '0000000000',
        password: await bcrypt.hash(`google-${Date.now()}`, 12),
        role: 'farmer',
        homeAddress: '',
        farmAddress: '',
        accountStatus: 'PENDING',
        status: 'PENDING',
        googleId: token
      });
    }

    const jwtToken = createToken(user);
    return res.json({ message: 'Google login successful.', token: jwtToken, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ message: 'Google authentication failed.' });
  }
});

app.post('/api/auth/retailer/login', (req, res) => {
  req.body.role = 'retailer';
  return handleUserLogin(req, res);
});

app.post('/api/auth/delivery/login', (req, res) => {
  req.body.role = 'delivery';
  return handleUserLogin(req, res);
});

app.post('/api/auth/admin/login', (req, res) => {
  req.body.role = 'admin';
  return handleUserLogin(req, res);
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch current user.' });
  }
});

app.get('/api/farmer/profile', authenticate, authorize('farmer'), async (req, res) => {
  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'Farmer profile not found.' });
  }
  return res.json({ user: sanitizeUser(user) });
});

app.put('/api/farmer/profile', authenticate, authorize('farmer'), async (req, res) => {
  try {
    const { name, mobile, email, homeAddress, farmAddress, city, state, pincode } = req.body;
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Farmer not found.' });
    }

    if (name) user.name = String(name).trim();
    if (mobile) {
      if (!isValidMobile(mobile)) {
        return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number.' });
      }
      user.mobile = String(mobile).replace(/\s+/g, '');
    }
    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
      }
      const emailExists = await User.findOne({ email: normalizeEmail(email), _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(409).json({ message: 'This email is already in use.' });
      }
      user.email = normalizeEmail(email);
    }
    if (homeAddress !== undefined) user.homeAddress = String(homeAddress).trim();
    if (farmAddress !== undefined) user.farmAddress = String(farmAddress).trim();
    if (city !== undefined) user.city = String(city).trim();
    if (state !== undefined) user.state = String(state).trim();
    if (pincode !== undefined) user.pincode = String(pincode).trim();

    await user.save();
    return res.json({ message: 'Profile updated successfully.', user: sanitizeUser(user) });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Unable to update farmer profile.' });
  }
});

// Socket Lifecycle Initialization
initializeDeliverySocket(io);

// -----------------------------------------------------------------
// Database & Server Bootstrap
// -----------------------------------------------------------------
const startServer = async () => {
  let isConnected = false;

  // Attempt connection via modular connectDB, fallback to direct mongoose.connect
  if (typeof connectDB === 'function') {
    isConnected = await connectDB();
  }

  if (!isConnected) {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully via fallback URI.');
  }

  server.listen(PORT, () => {
    console.log(`KisanMitra backend running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});

module.exports = { app, server, io };