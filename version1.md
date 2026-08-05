# หลักการทำงานของ AI UI Actions

เอกสารนี้สรุปการเชื่อมกล่องแชต Kaojai.ai เข้ากับหน้า React โดยให้ AI เปลี่ยน UI ได้เฉพาะคำสั่งที่แอปอนุญาต

## ภาพรวม

```text
ผู้ใช้พิมพ์คำสั่งในกล่องแชต
        ↓
React ส่งข้อความและข้อมูลรูปที่ import ไปยัง /api/chat
        ↓
Vite server เรียก OpenAI Responses API
        ↓
AI ส่งคำตอบและ action ในรูปแบบ JSON
        ↓
React ตรวจสอบ action และอัปเดต state
        ↓
React render หน้าจอใหม่
```

## หน้าที่ของแต่ละไฟล์

| ไฟล์ | หน้าที่ |
| --- | --- |
| `vite.config.js` | สร้าง endpoint `/api/chat`, เรียก OpenAI API, บอก AI ว่าสั่งอะไรได้ และกำหนดรูปแบบ JSON ที่ยอมรับ |
| `src/App.jsx` | ส่งข้อความไป API, รับ action, ตรวจสอบค่า และเปลี่ยน state ของหน้าเว็บ |
| `src/App.css` | กำหนดหน้าตาและ responsive layout ของ UI ที่เปลี่ยนตาม state |
| `.env` | เก็บ `OPENAI_API_KEY` และชื่อโมเดล โดยไม่ส่งคีย์ไป browser |

## รูปแบบข้อมูลตอบกลับจาก AI

AI ต้องตอบกลับเป็น JSON ตาม schema ที่กำหนด เช่น:

```json
{
  "reply": "เปลี่ยนสีปุ่มเป็นสีแดงให้แล้วค่ะ",
  "action": {
    "type": "set_explore_button_color",
    "color": "#e53935",
    "fileName": ""
  }
}
```

`reply` ใช้แสดงในกล่องแชต ส่วน `action` ใช้ควบคุมหน้าเว็บ

## Action ที่มีใน version 1

| Action | ผลลัพธ์บนหน้าเว็บ |
| --- | --- |
| `none` | ไม่เปลี่ยน UI แสดงเฉพาะข้อความตอบกลับ |
| `set_explore_button_color` | เปลี่ยนสีปุ่ม `Explore destinations` โดยรับค่าสี Hex เช่น `#e53935` |
| `set_landing_hero_image` | เลือกรูปที่ผู้ใช้ import และแสดงเป็น Hero Visual บนหน้า Landing |

> หมายเหตุ: การนำรูปออกจากหน้า Landing ยังไม่มี action ใน version 1 แม้ AI จะพิมพ์ตอบว่าลบแล้วก็ตาม จึงต้องเพิ่ม action เช่น `remove_landing_hero_image` และเพิ่ม handler ใน `App.jsx` ก่อน

## หลักความปลอดภัย

AI ไม่ได้เขียนไฟล์หรือรันคำสั่งบนเครื่องโดยตรง แต่ทำได้เฉพาะ action ที่เราระบุไว้ใน schema และมีโค้ดรองรับใน `App.jsx`

ตัวอย่างการป้องกันที่มีอยู่:

- ยอมรับสีเฉพาะรูปแบบ Hex 6 หลัก
- ยอมรับรูปเฉพาะชื่อที่ตรงกับไฟล์ภาพที่ผู้ใช้ import ใน browser
- API key อยู่ฝั่ง server และห้ามใช้ตัวแปรชื่อ `VITE_OPENAI_API_KEY`

## ข้อดีและข้อเสีย

### ข้อดี

- **ปลอดภัยกว่าให้ AI แก้โค้ดโดยตรง** — AI ส่งได้เฉพาะ action ที่ schema อนุญาต และ React เป็นผู้ตรวจสอบ/ลงมือเปลี่ยน UI
- **ผลลัพธ์ทันที** — เมื่อ action ผ่านการตรวจสอบ หน้าเว็บเปลี่ยนด้วย React state โดยไม่ต้องเขียนไฟล์หรือ reload หน้า
- **ควบคุมขอบเขตได้ชัดเจน** — ทีมกำหนดเองได้ว่า AI เปลี่ยนสี, วางรูป, ปรับข้อความ หรือทำสิ่งใดได้บ้าง
- **ทดสอบและตรวจสอบง่าย** — สามารถทดสอบ action แต่ละชนิดแยกกัน และดู JSON ที่ส่งกลับมาเพื่อหาสาเหตุของปัญหา
- **ลดความเสี่ยงจากคำสั่งผู้ใช้** — ไฟล์ภาพต้องตรงกับรายการที่ import และค่าสีต้องเป็น Hex ที่ผ่าน validation

### ข้อเสียและข้อจำกัด

- **AI ทำได้เฉพาะสิ่งที่พัฒนา action รองรับ** — หากยังไม่มี `remove_landing_hero_image` AI ไม่สามารถนำรูปออกจริง แม้ข้อความตอบกลับจะบอกว่าทำแล้ว
- **ต้องพัฒนาเพิ่มทุกความสามารถใหม่** — action ใหม่ต้องแก้ทั้ง schema, system prompt, React handler และ CSS ที่เกี่ยวข้อง
- **โมเดลอาจเลือก action ผิดหรือพิมพ์ข้อความไม่สอดคล้อง** — จึงต้องยึด action ที่ผ่าน validation เป็นความจริง ไม่ยึดเฉพาะข้อความ `reply`
- **สถานะปัจจุบันเป็น state ชั่วคราวใน browser** — เมื่อ refresh หน้า สีปุ่มและรูป Hero จะกลับค่าเริ่มต้น หากต้องการคงค่า ต้องเพิ่มการบันทึก เช่น localStorage หรือ database
- **ต้องมี backend เมื่อ deploy จริง** — `/api/chat` ที่อยู่ใน Vite dev server ใช้สำหรับพัฒนา; production ต้องย้าย endpoint เดียวกันไป backend หรือ serverless function
- **มีต้นทุนและข้อจำกัด API** — ทุกข้อความที่เรียกโมเดลมีค่าใช้จ่ายและอาจติด rate limit ตามสิทธิ์ของ OpenAI API project

## วิธีเพิ่ม Action ใหม่

1. เพิ่มชื่อ action ใน `CHAT_RESPONSE_FORMAT` ภายใน `vite.config.js`
2. เพิ่มกติกาใน `SYSTEM_PROMPT` ให้ AI เลือก action นั้นเมื่อได้รับคำสั่งที่ตรงกัน
3. เพิ่ม handler ใน `App.jsx` เพื่อตรวจสอบ action และเรียก `setState` ที่เหมาะสม
4. เพิ่มหรือปรับ CSS ใน `App.css` หาก action เปลี่ยนรูปลักษณ์หน้าเว็บ
5. ทดสอบด้วยคำสั่งจริงในกล่องแชต และตรวจว่า UI เปลี่ยนตาม action เท่านั้น

## ตัวอย่าง: เพิ่ม Action ลบรูป Hero

เพิ่ม action ใน schema:

```js
'remove_landing_hero_image'
```

เพิ่ม handler ใน `App.jsx`:

```js
if (payload.action?.type === 'remove_landing_hero_image') {
  setLandingHeroImage(null)
}
```

เมื่อผู้ใช้พิมพ์ว่า `เอารูปออกจากหน้า Landing` AI จะส่ง action นี้มา และ React จึงนำรูปออกจากหน้าจอจริงได้
