const crypto = require('crypto');

const SECRET_KEY = process.env.SECRET_KEY || 'CrecomOnline2023';

// Java SHA-1 hashes the key then takes first 16 bytes
function getSecretKey(key) {
  const sha1 = crypto.createHash('sha1').update(key, 'utf8').digest();
  return sha1.slice(0, 16); // 128-bit AES key
}

const keyBuffer = getSecretKey(SECRET_KEY);

function encrypt(value) {
  const cipher = crypto.createCipheriv('aes-128-ecb', keyBuffer, null);
  cipher.setAutoPadding(true);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return encrypted.toString('base64');
}

function decrypt(value) {
  const decipher = crypto.createDecipheriv('aes-128-ecb', keyBuffer, null);
  decipher.setAutoPadding(true);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(value, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
