const bcrypt = require('bcrypt');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Delete any existing admin first
    await User.deleteMany({ role: 'admin' });
    
    const hashedPw = await bcrypt.hash('admin123', 10);
    await User.create({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@felicity.com',
      password: hashedPw,
      role: 'admin',
      onboardingDone: true
    });
    console.log('Admin account seeded: admin@felicity.com / admin123');
  } catch (err) {
    // might fail if db not ready yet, ignore
    console.error('Admin seed error:', err.message);
  }
};

module.exports = seedAdmin;
