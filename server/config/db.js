import dns from 'dns';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import logger from '../utils/logger.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import ChitScheme from '../models/ChitScheme.js';
import ChitSubscription from '../models/ChitSubscription.js';

const autoSeedIfEmpty = async () => {
  try {
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      logger.info('Database empty, seeding default categories and products...');
      const categoriesData = [
        { name: 'Sparklers', categoryCode: '100', description: 'Sparkling fireworks for everyone', displayOrder: 1, slug: 'sparklers' },
        { name: 'Flower Pots', categoryCode: '110', description: 'Classic fountain pots', displayOrder: 2, slug: 'flower-pots' },
        { name: 'Ground Chakkars', categoryCode: '120', description: 'Spinning wheels on the ground', displayOrder: 3, slug: 'ground-chakkars' },
        { name: 'Sky Shots', categoryCode: '130', description: 'Beautiful aerial sky shots', displayOrder: 4, slug: 'sky-shots' },
        { name: 'Combo Packs', categoryCode: '140', description: 'Great value combo collections', displayOrder: 5, slug: 'combo-packs' }
      ];

      const savedCategories = await Category.insertMany(categoriesData);
      const catMap = savedCategories.reduce((acc, cat) => {
        acc[cat.name] = cat._id;
        return acc;
      }, {});

      const productsData = [
        {
          name: '10cm Electric Sparklers', description: 'Safe for kids', code: '1001', sku: '1001', category: catMap['Sparklers'],
          price: 50, wholesalePrice: 40, netRate: 35, stock: 500, minimumStock: 50, image: '/flower_pots.png', isActive: true, storeStockPieces: 500, hasDiscount: true
        },
        {
          name: '15cm Green Sparklers', description: 'Color changing', code: '1002', sku: '1002', category: catMap['Sparklers'],
          price: 80, wholesalePrice: 70, netRate: 65, stock: 400, minimumStock: 40, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 400, hasDiscount: false
        },
        {
          name: 'Flower Pots Small', description: 'Classic fountain', code: '1101', sku: '1101', category: catMap['Flower Pots'],
          price: 120, wholesalePrice: 100, netRate: 90, stock: 300, minimumStock: 30, image: '/flower_pots.png', isActive: true, storeStockPieces: 300, hasDiscount: true
        },
        {
          name: 'Flower Pots Big', description: 'High reaching fountain', code: '1102', sku: '1102', category: catMap['Flower Pots'],
          price: 200, wholesalePrice: 180, netRate: 160, stock: 200, minimumStock: 20, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 200, hasDiscount: false
        },
        {
          name: 'Ground Chakkar Normal', description: 'Spinning wheel', code: '1201', sku: '1201', category: catMap['Ground Chakkars'],
          price: 90, wholesalePrice: 80, netRate: 75, stock: 100, minimumStock: 50, image: '/flower_pots.png', isActive: true, storeStockPieces: 100, hasDiscount: false
        },
        {
          name: 'Ground Chakkar Special', description: 'Long lasting spin', code: '1202', sku: '1202', category: catMap['Ground Chakkars'],
          price: 150, wholesalePrice: 130, netRate: 120, stock: 450, minimumStock: 40, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 450, hasDiscount: true
        },
        {
          name: '7 Shots', description: 'Multi-color aerial', code: '1301', sku: '1301', category: catMap['Sky Shots'],
          price: 350, wholesalePrice: 300, netRate: 280, stock: 150, minimumStock: 15, image: '/flower_pots.png', isActive: true, storeStockPieces: 150, hasDiscount: true
        },
        {
          name: '12 Shots', description: 'Premium sky show', code: '1302', sku: '1302', category: catMap['Sky Shots'],
          price: 550, wholesalePrice: 500, netRate: 480, stock: 100, minimumStock: 10, image: '/sky_rocket_box.png', isActive: true, storeStockPieces: 100, hasDiscount: false
        },
        {
          name: 'Family Star Combo Pack', description: 'A perfect mix of 45 items', code: '1401', sku: '1401', category: catMap['Combo Packs'],
          price: 1500, wholesalePrice: 1300, netRate: 1200, stock: 50, minimumStock: 5, image: '/family_star_kit.png', isActive: true, storeStockPieces: 50, hasDiscount: true
        },
        {
          name: 'Grand Sky Delight Combo', description: 'Elite 75-item collection', code: '1402', sku: '1402', category: catMap['Combo Packs'],
          price: 2500, wholesalePrice: 2200, netRate: 2000, stock: 30, minimumStock: 5, image: '/grand_sky_delight.png', isActive: true, storeStockPieces: 30, hasDiscount: true
        }
      ];

      await Product.insertMany(productsData);
      logger.info('Categories and Products seeded successfully.');
    }

    const adminCount = await User.countDocuments({ role: { $in: ['SUPER ADMIN', 'ADMIN'] } });
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@crackerhub.com';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcryptjs.hash(password, 10);
      await User.create([
        {
          name: 'Super Admin',
          email: 'admin@gpkcrackers.com',
          password: hashedPassword,
          role: 'SUPER ADMIN',
          isActive: true
        },
        {
          name: 'Super Admin',
          email: 'admin@crackerhub.com',
          password: hashedPassword,
          role: 'SUPER ADMIN',
          isActive: true
        },
        {
          name: 'Admin',
          email: 'cracker@saiyogi.com',
          password: hashedPassword,
          role: 'SUPER ADMIN',
          isActive: true
        }
      ]);
      logger.info('Default admin users seeded successfully.');
    }

    const defaultSchemesData = [
      {
        title: "Diwali Special Savings Scheme 2026",
        description: "Save monthly and receive crackers bonus packages with bumper gifts!",
        startDate: "2026-01-01",
        totalMonths: 10,
        dueDateDay: 10,
        monthlyAmount: 3000,
        status: "Active",
        isActive: true,
        displayOrder: 1,
        url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop"
      },
      {
        title: "Diwali Family Savings Scheme",
        description: "Affordable monthly plan for family celebrations.",
        startDate: "2026-01-01",
        totalMonths: 10,
        dueDateDay: 10,
        monthlyAmount: 2000,
        status: "Active",
        isActive: true,
        displayOrder: 2,
        url: "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1200&auto=format&fit=crop"
      },
      {
        title: "Diwali Economy Savings Scheme",
        description: "Budget-friendly installment plan for everyone.",
        startDate: "2026-01-01",
        totalMonths: 10,
        dueDateDay: 10,
        monthlyAmount: 1000,
        status: "Active",
        isActive: true,
        displayOrder: 3,
        url: "https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?q=80&w=1200&auto=format&fit=crop"
      }
    ];

    for (const sch of defaultSchemesData) {
      const exists = await ChitScheme.findOne({ title: sch.title });
      if (!exists) {
        await ChitScheme.create(sch);
        logger.info(`Seeded default chit scheme: ${sch.title}`);
      }
    }

    const subCount = await ChitSubscription.countDocuments();
    if (subCount === 0) {
      const sch1 = await ChitScheme.findOne({ title: "Diwali Special Savings Scheme 2026" });
      const sch2 = await ChitScheme.findOne({ title: "Diwali Economy Savings Scheme" });

      const sampleSub = {
        name: "CK",
        customerName: "CK",
        phone: "9092548347",
        mobileNumber: "9092548347",
        location: "SVKC",
        applicationNumber: "SY-APP-00001",
        approvalStatus: "Pending",
        status: "Pending",
        totalPersons: 20,
        combinedMonthlyAmount: 40000,
        combinedGrandTotal: 400000,
        totalPaidAmount: 0,
        schemes: [
          {
            schemeId: sch1 ? sch1._id : null,
            schemeName: "Diwali Special Savings Scheme 2026",
            monthlyAmountPerPerson: 3000,
            monthlyAmount: 3000,
            personCount: 10,
            totalMonthlyAmount: 30000,
            durationMonths: 10,
            totalSchemeAmount: 300000,
            approvalStatus: "Pending",
            status: "Pending"
          },
          {
            schemeId: sch2 ? sch2._id : null,
            schemeName: "Diwali Economy Savings Scheme",
            monthlyAmountPerPerson: 1000,
            monthlyAmount: 1000,
            personCount: 10,
            totalMonthlyAmount: 10000,
            durationMonths: 10,
            totalSchemeAmount: 100000,
            approvalStatus: "Pending",
            status: "Pending"
          }
        ]
      };

      await ChitSubscription.create(sampleSub);
      logger.info('Sample customer application seeded for CK.');
    }
  } catch (err) {
    logger.warn('Auto-seed check encountered warning:', err.message);
  }
};

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;

  if (primaryUri) {
    if (primaryUri.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        logger.warn('Failed to set public DNS servers:', dnsErr.message);
      }
    }

    try {
      const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 8000 });
      logger.info(`MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
      await autoSeedIfEmpty();
      return;
    } catch (error) {
      logger.error(`Error connecting to primary MONGODB_URI: ${error.message}`);
    }
  }

  // Fallback to local 127.0.0.1:27017
  try {
    const localUri = "mongodb://127.0.0.1:27017/saiyogi";
    const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 4000 });
    logger.info(`MongoDB Connected locally: ${conn.connection.host} / Database: ${conn.connection.name}`);
    await autoSeedIfEmpty();
    return;
  } catch (localError) {
    logger.warn(`Local MongoDB (127.0.0.1:27017) not available: ${localError.message}`);
  }

  // Persistent local MongoDB storage using MongoMemoryServer with dbPath on disk
  try {
    logger.info('Starting persistent local MongoDB Server...');
    const path = await import('path');
    const fs = await import('fs');
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dbDir = path.resolve(__dirname, '../data/db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        dbPath: dbDir,
        storageEngine: 'wiredTiger'
      }
    });
    const memoryUri = mongoServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    logger.info(`Persistent MongoDB Connected at ${dbDir}: ${conn.connection.host}`);
    await autoSeedIfEmpty();
  } catch (memError) {
    logger.error('Failed to initialize persistent MongoDB server:', memError.message);
    process.exit(1);
  }
};

export default connectDB;
