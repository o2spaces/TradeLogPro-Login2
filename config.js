// ═══════════════════════════════════════════════════════════════
//  TradeLog Pro+ — Config File
//  แก้ไขไฟล์นี้ก่อน deploy แอป
//  ไฟล์นี้ไม่ควรแชร์ให้ User ทั่วไป
// ═══════════════════════════════════════════════════════════════

window.AUTH_GAS_URL = 'https://script.google.com/macros/s/AKfycbxZ_Og81D5wqtijoLkNh3C4W2iFJUc7A6D8j8ylbpoe1416fvNa__m4ifehdkUw5RrqPw/exec';

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
