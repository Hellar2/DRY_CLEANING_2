const bcrypt = require('bcryptjs');

// Test password verification for the admin user
const testPassword = 'admin123'; // Common test password
const storedHash = '$2a$10$B7DY/NMdDhPbRwMrg01oDuIB5h1dfIYKPUFpmNZR2CJyur0DjrKga'; // admin@dryclean.com hash

bcrypt.compare(testPassword, storedHash).then(result => {
  console.log(`Password "${testPassword}" matches admin hash:`, result);
});

// Test other common passwords
const commonPasswords = ['password', '123456', 'admin', 'dryclean123'];
commonPasswords.forEach(pwd => {
  bcrypt.compare(pwd, storedHash).then(result => {
    if (result) console.log(`✅ FOUND: Password "${pwd}" matches!`);
  });
});
