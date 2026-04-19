// ═══════════════════════════════════════════════════════════════
//  TradeLog Pro+ — Auth Script (auth-script.gs)
//  วางไฟล์นี้ใน Google Apps Script Project ใหม่
//  (ไม่ใช่ Script ของ User — ต้องเป็น Project แยกต่างหาก)
//
//  วิธี Deploy:
//  1. เปิด https://script.google.com → สร้าง Project ใหม่
//  2. วาง Code ทั้งหมดนี้แทนที่ Code เดิม
//  3. กด Deploy → New Deployment → Web App
//     - Execute as: Me (บัญชี Google ของคุณ)
//     - Who has access: Anyone
//  4. Copy Deployment URL → ใส่ใน config.js
//
//  Users Sheet ที่จะถูกสร้างอัตโนมัติ (ใน Spreadsheet นี้):
//  username | passwordHash | role | scriptUrl | displayName | createdAt | lastLogin | loginCount
// ═══════════════════════════════════════════════════════════════

var USERS_SHEET = 'Users';

// ── HTTP Handlers ─────────────────────────────────────────────

function doGet(e) {
  try {
    var action = e.parameter.action || '';
    if (action === 'login')         return _json(login(e.parameter));
    if (action === 'getUsers')      return _json(getUsers(e.parameter));
    if (action === 'googleLogin')   return _json(googleLogin(e.parameter));
    return _json({ status: 'error', msg: 'Unknown action: ' + action });
  } catch (err) {
    return _json({ status: 'error', msg: err.message });
  }
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.action === 'registerUser')    return _json(registerUser(d));
    if (d.action === 'deleteUser')      return _json(deleteUser(d));
    if (d.action === 'changePassword')  return _json(changePassword(d));
    if (d.action === 'updateScriptUrl') return _json(updateScriptUrl(d));
    if (d.action === 'googleLogin')     return _json(googleLogin(d));
    return _json({ status: 'error', msg: 'Unknown action: ' + d.action });
  } catch (err) {
    return _json({ status: 'error', msg: err.message });
  }
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Sheet Helpers ──────────────────────────────────────────────

function _getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(USERS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(USERS_SHEET);
    sh.appendRow(['username', 'passwordHash', 'role', 'scriptUrl', 'displayName', 'createdAt', 'lastLogin', 'loginCount']);
    sh.setFrozenRows(1);
    // Format header row
    sh.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#1a1e2a').setFontColor('#ffffff');
    sh.setColumnWidth(1, 130);
    sh.setColumnWidth(2, 200);
    sh.setColumnWidth(4, 400);
  }
  return sh;
}

function _getAllUsers() {
  var sh   = _getSheet();
  var vals = sh.getDataRange().getValues();
  if (vals.length < 2) return [];
  var h  = vals[0];
  var gi = function(n) { return h.indexOf(n); };
  var users = [];
  for (var i = 1; i < vals.length; i++) {
    var r = vals[i];
    if (!r[gi('username')]) continue;
    users.push({
      username:     String(r[gi('username')] || '').toLowerCase().trim(),
      passwordHash: String(r[gi('passwordHash')] || '').toLowerCase().trim(),
      role:         String(r[gi('role')] || 'user'),
      scriptUrl:    String(r[gi('scriptUrl')] || ''),
      displayName:  String(r[gi('displayName')] || ''),
      createdAt:    String(r[gi('createdAt')] || ''),
      lastLogin:    r[gi('lastLogin')] ? new Date(r[gi('lastLogin')]).toISOString() : '',
      loginCount:   parseInt(r[gi('loginCount')] || 0),
      _row:         i + 1
    });
  }
  return users;
}

function _isAdmin(username, users) {
  var uname = (username || '').toLowerCase().trim();
  return users.some(function(u) { return u.username === uname && u.role === 'admin'; });
}

// ── Actions ────────────────────────────────────────────────────

/**
 * Login: ตรวจ username + passwordHash
 * Returns: { status, username, displayName, role, scriptUrl }
 */
function login(params) {
  var username = (params.username || '').toLowerCase().trim();
  var hash     = (params.passwordHash || '').toLowerCase().trim();
  if (!username || !hash) return { status: 'error', msg: 'ข้อมูลไม่ครบ' };

  var users = _getAllUsers();
  var found = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === username) { found = users[i]; break; }
  }
  if (!found) return { status: 'error', msg: 'ไม่พบ Username นี้ในระบบ' };
  if (found.passwordHash !== hash) return { status: 'error', msg: 'Password ไม่ถูกต้อง' };

  // Update lastLogin + loginCount
  var sh  = _getSheet();
  var h   = sh.getDataRange().getValues()[0];
  var gi  = function(n) { return h.indexOf(n) + 1; }; // 1-indexed for getRange
  sh.getRange(found._row, gi('lastLogin')).setValue(new Date().toISOString());
  sh.getRange(found._row, gi('loginCount')).setValue((found.loginCount || 0) + 1);

  return {
    status:      'ok',
    username:    found.username,
    displayName: found.displayName || found.username,
    role:        found.role,
    scriptUrl:   found.scriptUrl
  };
}

/**
 * getUsers: คืนรายชื่อ user ทั้งหมด (เฉพาะ admin)
 */
function getUsers(params) {
  var adminUser = (params.adminUser || '').toLowerCase().trim();
  var users     = _getAllUsers();
  if (!_isAdmin(adminUser, users)) return { status: 'error', msg: 'ไม่มีสิทธิ์ Admin' };

  return {
    status: 'ok',
    users: users.map(function(u) {
      return {
        username:    u.username,
        displayName: u.displayName,
        role:        u.role,
        scriptUrl:   u.scriptUrl,
        createdAt:   u.createdAt,
        lastLogin:   u.lastLogin,
        loginCount:  u.loginCount
      };
    })
  };
}

/**
 * registerUser: เพิ่ม user ใหม่ (เฉพาะ admin)
 */
function registerUser(d) {
  var adminUser = (d.adminUser || '').toLowerCase().trim();
  var users     = _getAllUsers();
  if (!_isAdmin(adminUser, users)) return { status: 'error', msg: 'ไม่มีสิทธิ์ Admin' };

  var uname = (d.username || '').toLowerCase().trim();
  var hash  = (d.passwordHash || '').toLowerCase().trim();
  if (!uname || !hash) return { status: 'error', msg: 'ข้อมูลไม่ครบ (username, passwordHash)' };

  // Check duplicate
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === uname) return { status: 'error', msg: 'Username "' + uname + '" มีอยู่แล้ว' };
  }

  var sh = _getSheet();
  sh.appendRow([
    uname,
    hash,
    d.role || 'user',
    d.scriptUrl || '',
    d.displayName || uname,
    new Date().toISOString(),
    '',
    0
  ]);
  return { status: 'ok' };
}

/**
 * deleteUser: ลบ user (เฉพาะ admin, ลบตัวเองไม่ได้)
 */
function deleteUser(d) {
  var adminUser = (d.adminUser || '').toLowerCase().trim();
  var uname     = (d.username  || '').toLowerCase().trim();
  var users     = _getAllUsers();
  if (!_isAdmin(adminUser, users)) return { status: 'error', msg: 'ไม่มีสิทธิ์ Admin' };
  if (adminUser === uname)         return { status: 'error', msg: 'ลบ Account ตัวเองไม่ได้' };

  var sh = _getSheet();
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === uname) {
      sh.deleteRow(users[i]._row);
      return { status: 'ok' };
    }
  }
  return { status: 'error', msg: 'ไม่พบ User "' + uname + '"' };
}

/**
 * changePassword: เปลี่ยนรหัสผ่านตัวเอง (ทุก user ทำได้)
 * ต้องใส่ oldHash (password เดิม) เพื่อยืนยัน
 */
function changePassword(d) {
  var username = (d.username || '').toLowerCase().trim();
  var oldHash  = (d.oldHash  || '').toLowerCase().trim();
  var newHash  = (d.newHash  || '').toLowerCase().trim();
  if (!username || !oldHash || !newHash) return { status: 'error', msg: 'ข้อมูลไม่ครบ' };

  var users = _getAllUsers();
  var found = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === username) { found = users[i]; break; }
  }
  if (!found)                     return { status: 'error', msg: 'ไม่พบ User' };
  if (found.passwordHash !== oldHash) return { status: 'error', msg: 'Password เดิมไม่ถูกต้อง' };

  var sh = _getSheet();
  var h  = sh.getDataRange().getValues()[0];
  var gi = function(n) { return h.indexOf(n) + 1; };
  sh.getRange(found._row, gi('passwordHash')).setValue(newHash);
  return { status: 'ok' };
}

/**
 * updateScriptUrl: User อัปเดต scriptUrl ของตัวเอง (ไม่ต้องมีสิทธิ์ Admin)
 * ต้องยืนยันตัวตนด้วย username + passwordHash
 */
function updateScriptUrl(d) {
  var username  = (d.username     || '').toLowerCase().trim();
  var hash      = (d.passwordHash || '').toLowerCase().trim();
  var scriptUrl = (d.scriptUrl    || '').trim();
  if (!username || !hash) return { status: 'error', msg: 'ข้อมูลไม่ครบ' };

  var users = _getAllUsers();
  var found = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === username) { found = users[i]; break; }
  }
  if (!found)                         return { status: 'error', msg: 'ไม่พบ User' };
  if (found.passwordHash !== hash)    return { status: 'error', msg: 'Password ไม่ถูกต้อง' };

  var sh = _getSheet();
  var h  = sh.getDataRange().getValues()[0];
  var gi = function(n) { return h.indexOf(n) + 1; };
  sh.getRange(found._row, gi('scriptUrl')).setValue(scriptUrl);
  return { status: 'ok', scriptUrl: scriptUrl };
}

/**
 * googleLogin: Login ด้วย Google Account (ตรวจสอบ email จาก Google ID token)
 * ถ้า email ตรงกับ username ใน Users Sheet → login สำเร็จ
 * ถ้าไม่เจอ → auto-register User ใหม่ (role=user, scriptUrl='')
 */
function googleLogin(params) {
  var email = (params.email || '').toLowerCase().trim();
  var name  = (params.name  || '').trim();
  if (!email) return { status: 'error', msg: 'ไม่พบ email' };

  // ใช้ email หรือ email prefix เป็น username
  var username = email;

  var users = _getAllUsers();
  var found = null;
  for (var i = 0; i < users.length; i++) {
    // ตรวจสอบทั้ง email เต็มและ username ที่ตรงกับ email
    if (users[i].username === username ||
        users[i].username === email.split('@')[0]) {
      found = users[i]; break;
    }
  }

  var sh = _getSheet();
  var h  = sh.getDataRange().getValues()[0];
  var gi = function(n) { return h.indexOf(n) + 1; };

  if (!found) {
    // Auto-register User ใหม่ด้วย Google Account
    sh.appendRow([
      username,
      'GOOGLE_AUTH',   // ไม่มี password — login ผ่าน Google เท่านั้น
      'user',
      '',              // scriptUrl ว่าง — User จะใส่เองภายหลัง
      name || email,
      new Date().toISOString(),
      new Date().toISOString(),
      1
    ]);
    return {
      status:      'ok',
      username:    username,
      displayName: name || email,
      role:        'user',
      scriptUrl:   '',
      isNew:       true
    };
  }

  // Update lastLogin + loginCount
  sh.getRange(found._row, gi('lastLogin')).setValue(new Date().toISOString());
  sh.getRange(found._row, gi('loginCount')).setValue((found.loginCount || 0) + 1);

  return {
    status:      'ok',
    username:    found.username,
    displayName: found.displayName || name || found.username,
    role:        found.role,
    scriptUrl:   found.scriptUrl,
    isNew:       false
  };
}


// ไม่ได้ถูกเรียกโดย Web App — รันเองจาก Run menu ใน Apps Script
function createFirstAdmin() {
  var USERNAME  = 'admin';        // ← เปลี่ยนได้
  var PASSWORD  = 'admin1234';    // ← เปลี่ยนก่อนรัน!
  var SCRIPT_URL = '';            // ← ใส่ Script URL ของ admin (ถ้ามี)

  var hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    PASSWORD,
    Utilities.Charset.UTF_8
  ).map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');

  var users = _getAllUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === USERNAME) {
      Logger.log('⚠️ User "' + USERNAME + '" มีอยู่แล้ว — ข้ามการสร้าง');
      return;
    }
  }

  var sh = _getSheet();
  sh.appendRow([USERNAME, hash, 'admin', SCRIPT_URL, 'Administrator', new Date().toISOString(), '', 0]);
  Logger.log('✅ สร้าง Admin "' + USERNAME + '" เสร็จแล้ว');
  Logger.log('   Username: ' + USERNAME);
  Logger.log('   Password: ' + PASSWORD);
  Logger.log('⚠️ อย่าลืมเปลี่ยน Password หลัง Login ครั้งแรก!');
}
