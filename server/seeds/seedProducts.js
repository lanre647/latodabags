/**
 * Product seeding script
 *
 * Usage:
 *   node seeds/seedProducts.js           → delete + seed products
 *   node seeds/seedProducts.js --destroy → delete products only
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/product');
const User = require('../models/User');

// -----------------------------
// Safety checks
// -----------------------------
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing in .env');
  process.exit(1);
}

// const destroyMode = process.argv.includes('--destroy');

// // Prevent accidental production wipes
// if (destroyMode && process.env.NODE_ENV === 'production') {
//   console.error('❌ Destroy mode is disabled in production');
//   process.exit(1);
// }

// -----------------------------
// Seed function
// -----------------------------
const seedProducts = async () => {
  try {
    // 1️⃣ Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // 2️⃣ Delete existing products
    await Product.deleteMany({});
    console.log('🧹 Products collection cleared');

    // if (destroyMode) {
    //   console.log('🔥 Destroy mode enabled — no data seeded');
    //   await mongoose.connection.close();
    //   process.exit(0);
    // }

    // 3️⃣ Find or create admin user
    let admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@latodabags.com',
        password: 'AdminPassword123', // hashed if pre-save hook exists
        phone: '+2348012345678',
        role: 'admin',
        verified: true,
      });
      console.log('👤 Admin user created');
    } else {
      console.log('👤 Admin user found');
    }

    // 4️⃣ Product seed data
    const products = [
      {
        name: 'Classic Tote Bag',
        basePrice: 15000,
        images: ['/public/images/sample1.jpg'],
        description:
          'A versatile and stylish tote bag perfect for daily use. Made with high-quality leather and durable stitching.',
        category: 'tote',
        featured: true,
        customOptions: [
          { name: 'Color', type: 'color', options: ['Brown', 'Black', 'Tan'], priceModifier: 0 },
          { name: 'Size', type: 'select', options: ['Small', 'Medium', 'Large'], priceModifier: 0 },
        ],
        createdBy: admin._id,
      },
      {
        name: 'Elegant Sling Bag',
        basePrice: 12000,
        images: ['/public/images/sling1.jpg'],
        description:
          'Compact and elegant sling bag ideal for evening outings.',
        category: 'sling',
        featured: true,
        customOptions: [
          { name: 'Color', type: 'color', options: ['Red', 'Gold', 'Silver'], priceModifier: 0 },
        ],
        createdBy: admin._id,
      },
      {
        name: 'Designer Clutch',
        basePrice: 8000,
        images: ['/public/images/clutch1.jpg'],
        description:
          'A sophisticated clutch that combines elegance with functionality.',
        category: 'clutch',
        featured: true,
        customOptions: [
          { name: 'Material', type: 'select', options: ['Leather', 'Suede', 'Velvet'], priceModifier: 1000 },
        ],
        createdBy: admin._id,
      },
      {
        name: 'Leather Backpack',
        basePrice: 20000,
        images: ['/public/images/sample1.jpg'],
        description:
          'Premium leather backpack with multiple compartments.',
        category: 'backpack',
        featured: false,
        customOptions: [
          { name: 'Color', type: 'color', options: ['Black', 'Brown', 'Navy'], priceModifier: 0 },
          { name: 'Add USB Port', type: 'select', options: ['No', 'Yes'], priceModifier: 2000 },
        ],
        createdBy: admin._id,
      },
      {
        name: 'Crossbody Shoulder Bag',
        basePrice: 10000,
        images: ['/public/images/sling1.jpg'],
        description:
          'Lightweight crossbody bag perfect for everyday use.',
        category: 'crossbody',
        featured: false,
        customOptions: [
          { name: 'Color', type: 'color', options: ['Beige', 'Black', 'White'], priceModifier: 0 },
        ],
        createdBy: admin._id,
      },
      {
        name: 'Premium Tote – Limited Edition',
        basePrice: 25000,
        images: ['/public/images/clutch1.jpg'],
        description:
          'Exclusive limited edition tote bag crafted with premium Italian leather.',
        category: 'tote',
        featured: true,
        customOptions: [
          { name: 'Personalization', type: 'text', options: [], priceModifier: 2000 },
        ],
        createdBy: admin._id,
      },
    ];

    // 5️⃣ Insert products
    const created = await Product.insertMany(products);
    console.log(`🎉 ${created.length} products seeded`);

    // 6️⃣ Log results
    console.log('\n📦 Seeded Products:');
    created.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} | ${p.category} | ${p._id}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedProducts();
