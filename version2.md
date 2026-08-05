# Version 2 — AI-generated Page Preview

Version 2 เพิ่มความสามารถให้ผู้ใช้สั่งสร้างหน้า UI ผ่านกล่อง **Ask Kaojai.ai** แล้วดูผลลัพธ์เป็น Preview ได้ทันที โดย AI จะสร้าง HTML จากคำสั่งของผู้ใช้ แต่ไม่แก้ไฟล์ React หรือเปิดใช้งานโค้ดบนเครื่องโดยตรง

## ความสามารถที่เพิ่ม

### 1. สร้าง UI จากข้อความ (Engine-generated HTML)

เมื่อผู้ใช้พิมพ์คำสั่งลักษณะต่อไปนี้ใน chat:

> สร้างหน้าใหม่สำหรับ register โดยมีเฉพาะ field username password email

AI จะตอบกลับด้วยข้อมูล JSON ที่ประกอบด้วยข้อความสรุปและ HTML สำหรับแสดงผล:

```json
{
  "reply": "สร้างหน้า Register พร้อม Username, Password และ Email แล้ว",
  "action": {
    "type": "preview_html",
    "title": "หน้า Register",
    "html": "<!doctype html><html>...</html>"
  }
}
```

คำสั่งที่เกี่ยวกับการสร้างหน้า, form, dashboard, screen หรือ UI จะถูกจัดเป็น `preview_html`.

### 2. ปุ่ม Preview page ในข้อความ AI

เมื่อ response มี `action.type` เป็น `preview_html` หน้า React จะแสดงปุ่ม **Preview page** ใต้ข้อความตอบของ AI ผู้ใช้เลือกกดปุ่มนี้เมื่อต้องการดูผลงาน จึงไม่เปิด popup รบกวนทันทีทุกครั้งที่ AI สร้างหน้า

### 3. Popup สำหรับดูหน้า Preview

เมื่อกด **Preview page** แอปจะแสดง modal พร้อมชื่อหน้าและ render HTML ที่ AI ส่งมาใน `iframe`.

HTML ที่แสดงเป็นเพียง preview ชั่วคราวใน browser ยังไม่ได้สร้าง route ใหม่, บันทึกไฟล์ component หรือเชื่อม API จริงให้กับหน้าใหม่

### 4. Sandbox และ Content Security Policy

Preview ถูกแยกจาก React app ด้วย `iframe sandbox=""` และ Content Security Policy (CSP) เพื่อช่วยป้องกัน HTML ที่ AI สร้างจากการ:

- รัน JavaScript
- ส่ง form
- เปิด popup
- เข้าถึง context หรือข้อมูลของหน้า React หลัก
- โหลด script หรือ resource ที่ไม่จำเป็น

อนุญาตเฉพาะ inline CSS และรูปภาพ `https:` หรือ `data:` สำหรับการแสดงผล UI.

### 5. กติกา field แบบรายการตายตัว

ถ้าผู้ใช้ระบุ field ชัดเจน AI ต้องใช้เฉพาะ field ที่ระบุเท่านั้น เช่น:

> สร้าง Register ที่มี username password email

HTML ที่สร้างต้องไม่มี `phone`, `confirm password`, `name`, checkbox ยอมรับเงื่อนไข หรือ input อื่นเพิ่มเอง เว้นแต่ผู้ใช้ขออย่างชัดเจน กติกานี้มีผลกับทั้ง HTML และข้อความ `reply`.

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
| --- | --- |
| `vite.config.js` | Vite development API `/api/chat`, system prompt, JSON schema และการเรียก OpenAI Responses API |
| `src/App.jsx` | ส่ง prompt, รับ `preview_html`, แสดงปุ่ม Preview และ modal iframe |
| `src/App.css` | รูปแบบปุ่ม Preview และ modal สำหรับ HTML preview |

## ขั้นตอนการทำงาน

```text
ผู้ใช้พิมพ์คำสั่งสร้าง UI
        ↓
React ส่งข้อความไป POST /api/chat
        ↓
Vite API ส่งคำสั่งและ schema ไป OpenAI Responses API
        ↓
AI คืน reply + action.preview_html + action.html
        ↓
React แสดงปุ่ม Preview page
        ↓
ผู้ใช้กดปุ่ม → แสดง HTML ใน sandboxed iframe modal
```

## ข้อจำกัดปัจจุบัน

- Endpoint `/api/chat` อยู่ใน Vite dev server จึงเหมาะกับการพัฒนาเท่านั้น; ก่อน deploy ต้องย้าย logic นี้ไป backend หรือ serverless function
- Preview ไม่บันทึกเป็นหน้าใหม่จริง และ refresh แล้วหาย
- HTML preview ไม่รองรับ JavaScript หรือการ submit form โดยเจตนา เพื่อความปลอดภัย
- หากต้องการสร้าง route/page จริง ควรเพิ่มขั้นตอนยืนยัน แล้วแปลงผลลัพธ์เป็น UI schema หรือ React component ที่ผ่าน validation ก่อนบันทึก
