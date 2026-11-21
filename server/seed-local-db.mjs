import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gpk_chit';

console.log('----------------------------------------------------');
console.log('🚀 GPK Crackers - Local Database Initializer / Seeder');
console.log(`Connecting to: ${MONGODB_URI}`);
console.log('----------------------------------------------------');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String },
  role: { type: String, default: 'SUPER ADMIN' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
}, { timestamps: true });

const chitSchemeSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: String,
  startDate: { type: String, default: '2026-01-01' },
  totalMonths: { type: Number, default: 10 },
  dueDateDay: { type: Number, default: 10 },
  monthlyAmount: { type: Number, required: true },
  status: { type: String, default: 'Active' },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 1 },
  url: String
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'GPK Crackers' },
  companyName: { type: String, default: 'GPK Crackers' },
  contactPhone: { type: String, default: '9092548347' },
  contactEmail: { type: String, default: 'admin@gpkcrackers.com' },
  address: { type: String, default: 'Sivakasi, Tamil Nadu, India' }
}, { timestamps: true, strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
const ChitScheme = mongoose.models.ChitScheme || mongoose.model('ChitScheme', chitSchemeSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

async function runSeed() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✓ Successfully connected to MongoDB.');

    // 1. Seed / Upsert Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gpkcrackers.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin321';
    const hashedPassword = await bcryptjs.hash(adminPass, 10);

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER ADMIN',
        isActive: true
      });
      console.log(`✓ Admin user created: ${adminEmail} (password: ${adminPass})`);
    } else {
      console.log(`ℹ Admin user ${adminEmail} already exists.`);
    }

    // 2. Chit Application Counter (sets seq to 4 so next enrollment is GPK-APP-00005)
    const existingCounter = await Counter.findById('chitApplicationNumber');
    if (!existingCounter) {
      await Counter.create({ _id: 'chitApplicationNumber', seq: 4 });
      console.log('✓ Chit application sequence counter initialized to 4 (Next will be GPK-APP-00005).');
    } else {
      console.log(`ℹ Chit application sequence counter already at: ${existingCounter.seq}`);
    }

    // 3. Default GPK Chit Schemes
    const defaultSchemes = [
      {
        title: 'Diwali Special Savings Scheme 2026',
        description: 'Save monthly and receive crackers bonus packages with bumper gifts!',
        startDate: '2026-01-01',
        totalMonths: 10,
        dueDateDay: 10,
        monthlyAmount: 3000,
        status: 'Active',
        isActive: true,
        displayOrder: 1,
        url: ''
      },
      {
        title: 'Diwali Family Savings Scheme',
        description: 'Affordable monthly plan for family celebrations.',
        startDate: '2026-01-01',
        totalMonths: 10,
        dueDateDay: 10,
        monthlyAmount: 2000,
        status: 'Active',
        isActive: true,
        displayOrder: 2,
        url: ''
      },
      {
        title: 'Diwali Economy Savings Scheme',
        description: 'Budget-friendly installment plan for everyone.',
        startDate: '2026-01-01',
        totalMonths: 10,
        dueDateDay: 10,
        monthlyAmount: 1000,
        status: 'Active',
        isActive: true,
        displayOrder: 3,
        url: ''
      },
      {
        title: 'Diwali Mega Bumper Savings Scheme',
        description: 'Premium mega savings plan with grand fireworks and exclusive gifts.',
        startDate: '2026-01-01',
        totalMonths: 10,
        dueDateDay: 10,
        monthlyAmount: 5000,
        status: 'Active',
        isActive: true,
        displayOrder: 4,
        url: ''
      }
    ];

    for (const sch of defaultSchemes) {
      await ChitScheme.updateOne(
        { title: sch.title },
        { $setOnInsert: sch },
        { upsert: true }
      );
    }
    console.log('✓ Default chit schemes verified / seeded.');

    // 4. Default Settings
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({
        siteName: 'GPK Crackers',
        companyName: 'GPK Crackers',
        contactPhone: '9092548347',
        contactEmail: 'admin@gpkcrackers.com',
        address: 'Sivakasi, Tamil Nadu, India'
      });
      console.log('✓ Default GPK Crackers site settings created.');
    }

    console.log('----------------------------------------------------');
    console.log('🎉 Database initialization complete!');
    console.log('Admin login: ' + adminEmail);
    console.log('Admin pass:  ' + adminPass);
    console.log('----------------------------------------------------');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database seeding error:', err.message);
    process.exit(1);
  }
}

runSeed();
