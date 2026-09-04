# Microtronic Menu Online

ระบบสั่งอาหารออนไลน์ผ่าน QR Code สำหรับร้านอาหาร ร้านกาแฟ ร้านเบเกอรี่ และธุรกิจ F&B ทุกประเภท

> สแกน QR → เลือกเมนู → สั่งอาหาร → ครัวรู้ทันที — ไม่ต้องรอพนักงาน

---

## สิ่งที่ระบบนี้ทำได้

- ลูกค้าสแกน QR Code ที่โต๊ะ แล้วเปิดเมนูบนมือถือได้ทันที
- ออเดอร์ส่งตรงถึงหน้าจอครัวและแคชเชียร์แบบเรียลไทม์
- พนักงานจัดการเมนู ราคา และสถานะคำสั่งได้จาก Dashboard
- ติดตามยอดขายรายวันและประวัติการสั่งซื้อทั้งหมด
- รองรับชำระเงินเงินสด / บัตร / QR พร้อมใบเสร็จอัตโนมัติ
- ลดคิว ลดเวลารอ เพิ่มความสะดวกให้ลูกค้าและร้าน

---

## ฟีเจอร์หลัก

| สำหรับลูกค้า | สำหรับร้าน |
|---|---|
| สแกน QR Code เปิดเมนู | จัดการเมนู หมวดหมู่ รูปภาพ ราคา |
| เลือกเมนู + เพิ่มหมายเหตุ | Dashboard ครัว + แคชเชียร์ |
| ดูสถานะออเดอร์แบบเรียลไทม์ | ติดตามสถานะ: pending → preparing → served → paid |
| สั่งเพิ่มได้ตลอด | รายงานยอดขายรายวัน |
| ใบเสร็จรับเงิน | จัดการโต๊ะ + QR Code + พนักงาน |
| | รองรับหลาย Role: admin / kitchen / cashier |

---

## เทคโนโลยีที่ใช้

| | |
|---|---|
| Framework | Next.js 16 + React 19 + TypeScript |
| Database | Prisma ORM + PostgreSQL |
| Styling | Tailwind CSS v4 |
| Auth | JWT Session + bcrypt |
| QR Code | qrcode.react |
| Deploy | Vercel (Prisma Postgres) |

---

## ราคา

### แบบรายเดือน (SaaS)

| Package | ราคา/เดือน | เนื้อหา |
|---------|-----------|---------|
| **Basic** | **990** บาท | QR Menu + Dashboard + รายงานพื้นฐาน |
| **Pro** | **1,990** บาท | + Custom branding + รายงานละเอียด + support |
| **Enterprise** | **3,990** บาท | + Multi-branch + API + training + ดูแลตลอดอายุการใช้งาน |

> ทดลองใช้ฟรี 14 วัน ไม่ต้องใช้บัตรเครดิต

### แบบขายขาด (One-Time)

| Package | ราคา | เหมาะสำหรับ |
|---------|------|-------------|
| **Starter** | 29,000 - 39,000 บาท | ร้านเล็ก 1-2 สาขา |
| **Standard** | 49,000 - 69,000 บาท | ร้านที่ต้องการครบวงจร + custom branding |
| **Premium** | 79,000 - 129,000 บาท | Multi-branch + deploy + training + support 1 ปี |

> *ราคาไม่รวม domain/hosting 如果ต้องการติดตั้งเพิ่มเติม เช่น UI customization, training, หรือ migration ข้อมูล คิดเพิ่มตามขนาดงาน*

---

## ข้อมูลติดต่อ

| | |
|---|---|
| ชื่อ | **กฤษ (ฆัง)** |
| โทรศัพท์ | **035-541-9166** |
| Facebook | [facebook.com/MicrotronicTH](https://www.facebook.com/MicrotronicTH/) |
| เว็บไซต์ | [www.microtronic.biz](https://www.microtronic.biz) |

---

## สาธิตการใช้งาน (Demo)

เว็บ demo: `https://micro-menu-online.vercel.app`

| บทบาท | อีเมล | รหัสผ่าน |
|--------|-------|----------|
| ผู้ดูแล (Admin) | admin@menu.local | admin123456 |
| ครัว (Kitchen) | kitchen@menu.local | kitchen123456 |
| แคชเชียร์ (Cashier) | cashier@menu.local | cashier123456 |

---

## วิธีติดตั้ง (สำหรับ Developer)

```bash
# 1. ติดตั้ง dependencies
pnpm install

# 2. ตั้งค่า environment
cp .env.example .env
# แก้ไขค่า SESSION_SECRET, NEXT_PUBLIC_APP_URL, DATABASE_URL ใน .env

# 3. สร้างฐานข้อมูล
pnpm db:generate
pnpm db:push
pnpm db:seed

# 4. เริ่มแอป
pnpm dev
```

เปิด http://localhost:3000

---

## โครงสร้างโปรเจกต์

```
app/              → หน้าเว็บ + API routes
components/       → UI components (kitchen board, cashier board, shell)
lib/              → business logic, auth, session, data access
prisma/           → database schema
public/           → ไฟล์สาธารณะ
```

---

## หมายเหตุสำหรับ Developer

- Prisma schema (`prisma/schema.prisma`) เป็นแหล่งข้อมูลหลัก
- กรณี deploy บน Vercel ให้ตั้ง `DATABASE_URL` และ `SESSION_SECRET` ให้ถูกต้อง
- กรณีใช้งานจริง ควรเปลี่ยนรหัสผ่านเริ่มต้นและตั้ง environment ให้ปลอดภัย
- รองรับ Supabase (realtime/storage) เป็น fallback option

---

## วัตถุประสงค์

Microtronic Menu Online ออกแบบมาสำหรับผู้ประกอบการที่ต้องการ:

- ลดต้นทุนการจ้างพนักงานรับสั่งอาหาร
- ลดข้อผิดพลาดจากการรับคำสั่งด้วยมือ
- เพิ่มความเร็วในการให้บริการ
- ขยายช่องทางขายผ่านระบบ Digital ที่ใช้งานง่าย

**Microtronic** — ให้บริการระบบธุรกิจและโซลูชันสำหรับร้านอาหารที่ต้องการเปลี่ยนสู่ Digital Ordering System
