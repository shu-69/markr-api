const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../services/encryption');
const { GridFSBucket, ObjectId } = require('mongodb');

const USERS_COLLECTION = 'users';

function isValidEmail(email) {
  return /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/.test(email);
}

function generateUsername(name) {
  const firstName = name.includes(' ') ? name.substring(0, name.indexOf(' ')) : name;
  return firstName + Math.floor(Math.random() * 9999999 + 1);
}

function generatePasswordFromDOB(dob) {
  const digits = dob.replace(/\D/g, '');
  return digits || generateRandomPassword(6);
}

function generateRandomPassword(n) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function getProfileImageBase64(db, profileImgId) {
  if (!profileImgId) return null;
  try {
    const bucket = new GridFSBucket(db, { bucketName: 'UserProfileImages' });
    const downloadStream = bucket.openDownloadStream(new ObjectId(profileImgId));
    const chunks = [];
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const isSvg = buffer.slice(0, 10).toString().trim().startsWith('<svg');
    const mimeType = isSvg ? 'image/svg+xml' : 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error('Error fetching profile image:', err);
    return null;
  }
}

// GET /accounts/help
router.get('/help', (req, res) => {
  res.send('Known Methods: authenticate (GET), register (POST), checkEmailExists (GET), getTotalAccounts (GET)');
});

// GET /accounts/authenticate
router.get('/authenticate', async (req, res) => {
  const { username, password } = req.query;
  const db = mongoose.connection.db;
  const collection = db.collection(USERS_COLLECTION);

  try {
    const key = isValidEmail(username) ? 'email' : 'username';
    const doc = await collection.findOne({ [key]: username });

    if (!doc) {
      const errCode = key === 'email' ? 101 : 102;
      return res.json({ success: false, err_code: errCode, err: `${key} not found!` });
    }

    const decrypted = decrypt(doc.password);
    if (password !== decrypted) {
      return res.json({ success: false, err_code: 201, err: 'Password not matched!' });
    }

    const result = { ...doc };
    delete result.password;
    delete result.submissions;

    // Fetch profile image if it exists
    if (result.profile_img) {
      result.profile_img_id = result.profile_img; // Keep original ID
      result.profile_img = await getProfileImageBase64(db, result.profile_img);
    }

    res.json({ success: true, result });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// POST /accounts/register
router.post('/register', async (req, res) => {
  const db = mongoose.connection.db;
  const collection = db.collection(USERS_COLLECTION);
  const data = req.body;

  try {
    const exists = await collection.findOne({ email: data.email });
    if (exists) return res.json({ status: false, err: 'Email already exists!' });

    // Handle profile image upload to GridFS
    if (data.profile_img) {
      try {
        const base64Data = data.profile_img.split(',')[1];
        const imgBuffer = Buffer.from(base64Data, 'base64');
        const bucket = new GridFSBucket(db, { bucketName: 'UserProfileImages' });
        const uploadStream = bucket.openUploadStream('img.jpg', {
          chunkSizeBytes: 1048576,
          metadata: { type: 'image' }
        });
        uploadStream.end(imgBuffer);
        await new Promise((resolve, reject) => {
          uploadStream.on('finish', resolve);
          uploadStream.on('error', reject);
        });
        data.profile_img = uploadStream.id;
      } catch (imgErr) {
        data.profile_img = null;
      }
    }

    // Generate unique username
    let username = generateUsername(data.name);
    let attempts = 0;
    while (await collection.findOne({ username }) && attempts < 100) {
      username = generateUsername(data.name);
      attempts++;
    }
    if (attempts >= 100) return res.json({ status: false, err: 'Internal server error, please try again!' });

    const password = generatePasswordFromDOB(data.dob);
    data.username = username;
    data.password = encrypt(password);

    const result = await collection.insertOne(data);

    if (result.acknowledged) {
      res.json({ status: true, insertedId: result.insertedId, username, password });
    } else {
      res.json({ status: false });
    }
  } catch (err) {
    res.json({ status: false, err: err.message });
  }
});

// GET /accounts/checkEmailExists
router.get('/checkEmailExists', async (req, res) => {
  const db = mongoose.connection.db;
  const doc = await db.collection(USERS_COLLECTION).findOne({ email: req.query.email });
  res.send(String(doc !== null));
});

// GET /accounts/getTotalAccounts
router.get('/getTotalAccounts', async (req, res) => {
  const db = mongoose.connection.db;
  const count = await db.collection(USERS_COLLECTION).countDocuments();
  res.json({ success: true, result: count });
});

// GET /accounts/user-details
router.get('/user-details', async (req, res) => {
  const { email, username } = req.query;
  const db = mongoose.connection.db;
  const collection = db.collection(USERS_COLLECTION);

  try {
    const query = email ? { email } : { username };
    const doc = await collection.findOne(query);

    if (!doc) {
      return res.json({ success: false, err: 'User not found!' });
    }

    const result = { ...doc };
    delete result.password;
    delete result.submissions;

    // Fetch profile image if it exists
    if (result.profile_img) {
      result.profile_img_id = result.profile_img; // Keep original ID
      result.profile_img = await getProfileImageBase64(db, result.profile_img);
    }

    res.json({ success: true, result });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// GET /accounts/profile-image/:id
router.get('/profile-image/:id', async (req, res) => {
  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName: 'UserProfileImages' });

  try {
    const id = new ObjectId(req.params.id);
    const downloadStream = bucket.openDownloadStream(id);

    res.set('Content-Type', 'image/jpeg'); // Assuming JPEG as per registration code

    downloadStream.pipe(res);

    downloadStream.on('error', (err) => {
      res.status(404).send('Image not found');
    });

    downloadStream.on('end', () => {
      res.end();
    });
  } catch (err) {
    res.status(400).send('Invalid image ID');
  }
});

module.exports = router;
