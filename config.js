// ═══════════════════════════════════════════════════════════════
//  TradeLog Pro+ — Config File
//  แก้ไขไฟล์นี้ก่อน deploy แอป
//  ไฟล์นี้ไม่ควรแชร์ให้ User ทั่วไป
// ═══════════════════════════════════════════════════════════════

window.AUTH_GAS_URL = 'https://script.google.com/macros/s/AKfycbxEDc9JFhOkiDosNw2JN6txEMO0C7vAl8NlVJr_ilhT8t4iiRDmFZWD-s-fEH3iehU3Og/exec';

// Google OAuth 2.0 Client ID (จาก Google Cloud Console → Credentials)
window.GOOGLE_CLIENT_ID = '1008136012501-2a6m6ulfb99f5h8jrvc8arpak85t9ckk.apps.googleusercontent.com';

// วิธีใช้:
// 1. สร้าง Google Sheet ใหม่สำหรับ Auth (ไม่ใช่ Sheet ของ User)
// 2. ไปที่ Extensions → Apps Script → วาง auth-script.gs
// 3. Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy URL ที่ได้ → แทนที่ 'YOUR_AUTH_GAS_URL_HERE' ด้านบน
// 5. บันทึกไฟล์นี้ → deploy แอป

// ตัวอย่าง URL ที่ถูกต้อง:
// window.AUTH_GAS_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
