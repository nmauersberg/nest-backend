// Reference: https://ciphertrick.com/salt-hash-passwords-using-nodejs-crypto/
import crypto = require('crypto');

// Generate a random string of given length
export const genRandomString = function (length = 15) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

export const sha512 = function (password: string, salt: string) {
  const hash = crypto.createHmac('sha512', salt);
  hash.update(password);
  const value = hash.digest('hex');
  return {
    salt: salt,
    passwordHash: value
  };
};

// Register or set New Password
export const saltHashPasswordRegister = (userpassword: string) => {
  const salt = genRandomString(16);
  const passwordData = sha512(userpassword, salt);
  return passwordData;
};

// Login or PasswordCheck for new Password
export const saltHashPassword = (userpassword: string, salt: string) => {
  const passwordData = sha512(userpassword, salt);
  return passwordData;
};

// Check if Passwords match
export const matchPassword = async (db: string, userInput: string) => {
  return await new Promise((resolve, reject) => {
    if (db === userInput) {
      return resolve('Password matches');
    } else {
      return reject('Old password does not match');
    };
  });
};
