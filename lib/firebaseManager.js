const admin = require('firebase-admin');
const crypto = require('crypto');
const logger = require('../utils/log.js');

// Cấu hình Firebase Service Account
const serviceAccount = {
  type: "service_account",
  project_id: "facebook-bot-backup",
  private_key_id: "eee45b97873985f0a5becf259e0cd9735960210e",
  private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\nT1Qw8YtNvDzCeGYshxd29CJmx+uE+t9yu1j4ECojNv6W5aH5vlmWf6I5SXHDptWr\n6U8fB0Gd0e7QtdjWuaGqBk2CRrD0MYfAAjLls3z4d2aHP/Uly82C4CdfMjO1elrR\nG3Aco3/pS9Jt8DbzWqenv0r5Sm3L4XzYqT4Z3wZRe6MYN3XrtM=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@facebook-bot-backup.iam.gserviceaccount.com",
  client_id: "111731456944411860005",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40facebook-bot-backup.iam.gserviceaccount.com"
};

// Khởi tạo Firebase Admin SDK
let firebaseApp;
try {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://facebook-bot-backup.firebaseio.com"
  });
  logger("✅ Firebase đã được khởi tạo thành công", "FIREBASE");
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    firebaseApp = admin.app();
    logger("✅ Firebase đã được khởi tạo trước đó", "FIREBASE");
  } else {
    logger(`❌ Lỗi khởi tạo Firebase: ${error.message}`, "FIREBASE");
    throw error;
  }
}

// Hàm mã hóa cookie
const encrypt = (text) => {
  try {
    const encryptionKey = process.env.ENCRYPT_KEY || "your_strong_encryption_key_here_32_chars";
    const key = Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32));
    const iv = Buffer.alloc(16, 0);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    logger(`❌ Lỗi mã hóa: ${error.message}`, "FIREBASE");
    throw error;
  }
};

// Hàm giải mã cookie
const decrypt = (text) => {
  try {
    const encryptionKey = process.env.ENCRYPT_KEY || "your_strong_encryption_key_here_32_chars";
    const key = Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32));
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger(`❌ Lỗi giải mã: ${error.message}`, "FIREBASE");
    throw error;
  }
};

// Lưu cookie lên Firebase
const saveCookie = async (cookie, email = 'ngonhatlongffff@gmail.com') => {
  try {
    const encrypted = encrypt(JSON.stringify(cookie));
    const userKey = email.replace(/[^a-zA-Z0-9]/g, '_');
    
    await admin.database().ref(`cookies/${userKey}`).set({
      data: encrypted,
      lastUsed: Date.now(),
      status: 'active',
      email: email,
      updatedAt: new Date().toISOString()
    });
    
    logger(`✅ Cookie đã được lưu thành công cho ${email}`, "FIREBASE");
    return true;
  } catch (error) {
    logger(`❌ Lỗi lưu cookie: ${error.message}`, "FIREBASE");
    return false;
  }
};

// Tải cookie từ Firebase
const loadCookie = async (email = 'ngonhatlongffff@gmail.com') => {
  try {
    const userKey = email.replace(/[^a-zA-Z0-9]/g, '_');
    const snapshot = await admin.database().ref(`cookies/${userKey}`).once('value');
    
    if (!snapshot.exists()) {
      logger(`⚠️ Không tìm thấy cookie cho ${email}`, "FIREBASE");
      return null;
    }
    
    const cookieData = snapshot.val();
    const decrypted = decrypt(cookieData.data);
    const cookie = JSON.parse(decrypted);
    
    logger(`✅ Cookie đã được tải thành công cho ${email}`, "FIREBASE");
    return cookie;
  } catch (error) {
    logger(`❌ Lỗi tải cookie: ${error.message}`, "FIREBASE");
    return null;
  }
};

// Kiểm tra trạng thái cookie
const checkCookieStatus = async (email = 'ngonhatlongffff@gmail.com') => {
  try {
    const userKey = email.replace(/[^a-zA-Z0-9]/g, '_');
    const snapshot = await admin.database().ref(`cookies/${userKey}`).once('value');
    
    if (!snapshot.exists()) {
      return { exists: false, status: 'not_found' };
    }
    
    const cookieData = snapshot.val();
    return {
      exists: true,
      status: cookieData.status,
      lastUsed: cookieData.lastUsed,
      updatedAt: cookieData.updatedAt
    };
  } catch (error) {
    logger(`❌ Lỗi kiểm tra trạng thái cookie: ${error.message}`, "FIREBASE");
    return { exists: false, status: 'error' };
  }
};

// Cập nhật trạng thái cookie
const updateCookieStatus = async (status, email = 'ngonhatlongffff@gmail.com') => {
  try {
    const userKey = email.replace(/[^a-zA-Z0-9]/g, '_');
    await admin.database().ref(`cookies/${userKey}`).update({
      status: status,
      lastUsed: Date.now(),
      updatedAt: new Date().toISOString()
    });
    
    logger(`✅ Trạng thái cookie đã được cập nhật: ${status}`, "FIREBASE");
    return true;
  } catch (error) {
    logger(`❌ Lỗi cập nhật trạng thái cookie: ${error.message}`, "FIREBASE");
    return false;
  }
};

// Xóa cookie
const deleteCookie = async (email = 'ngonhatlongffff@gmail.com') => {
  try {
    const userKey = email.replace(/[^a-zA-Z0-9]/g, '_');
    await admin.database().ref(`cookies/${userKey}`).remove();
    
    logger(`✅ Cookie đã được xóa cho ${email}`, "FIREBASE");
    return true;
  } catch (error) {
    logger(`❌ Lỗi xóa cookie: ${error.message}`, "FIREBASE");
    return false;
  }
};

// Lấy danh sách tất cả cookie
const getAllCookies = async () => {
  try {
    const snapshot = await admin.database().ref('cookies').once('value');
    const cookies = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      cookies.push({
        key: childSnapshot.key,
        email: data.email,
        status: data.status,
        lastUsed: data.lastUsed,
        updatedAt: data.updatedAt
      });
    });
    
    return cookies;
  } catch (error) {
    logger(`❌ Lỗi lấy danh sách cookie: ${error.message}`, "FIREBASE");
    return [];
  }
};

module.exports = {
  saveCookie,
  loadCookie,
  checkCookieStatus,
  updateCookieStatus,
  deleteCookie,
  getAllCookies,
  encrypt,
  decrypt
}; 