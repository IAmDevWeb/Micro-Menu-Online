# Menu Online — สั่งอาหารผ่าน QR Code

ระบบสั่งอาหารออนไลน์สำหรับร้านอาหาร (Restaurant Micro-SaaS) ลูกค้าสแกน QR ที่โต๊ะ สั่งอาหารแล้วส่ง**แบบเรียลไทม์**ไปยังหน้าจอครัวและแคชเชียร์ พร้อมระบบยืนยันตัวตน หลายบทบาท รายงานยอดขายรายวัน และพิมพ์ใบเสร็จ

ออกแบบให้ deploy บน **Vercel** (serverless) โดยใช้ **Supabase** เป็นทั้งฐานข้อมูล Postgres, เรียลไทม์ (Realtime) และที่เก็บรูป (Storage)

## เทคโนโลยีที่ใช้

- **Next.js 16.3** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS v4** สำหรับ UI (ภาษาไทย)
- **Drizzle ORM** + **Postgres** (Supabase) — schema ใน `lib/db/schema.ts`
- **Supabase Realtime** สำหรับเรียลไทม์ (broadcast ไปยังห้องห้องต่าง ๆ)
- **Supabase Storage** สำหรับเก็บรูปเมนู (bucket `product-images`)
- **jose** (JWT) + **bcryptjs** สำหรับยืนยันตัวตน (session cookie)
- **qrcode.react** สำหรับสร้าง QR โต๊ะ
- จัดการ package ด้วย **pnpm**

## เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```bash
pnpm install
```

### 2. ตั้งค่า environment

คัดลอก `.env.example` เป็น `.env` แล้วกรอกค่า (ดูหัวข้อ "ตั้งค่า Supabase" ด้านล่าง)

```bash
cp .env.example .env
```

| ตัวแปร | รายละเอียด |
|--------|-----------|
| `SESSION_SECRET` | คีย์สำหรับเซ็น JWT session (ควรเปลี่ยนเป็น string ยาว ๆ ที่สุ่มเอง) |
| `NEXT_PUBLIC_APP_URL` | URL สาธารณะของแอป ใช้ต่อ QR link (local: `http://localhost:3000`, prod: โดเมน Vercel) |
| `DATABASE_URL` | connection string ของ Postgres (Supabase) |
| `SUPABASE_URL` | Project URL ของ Supabase (server-side) |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL เดียวกัน (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (**server-side เท่านั้น ห้ามรั่วไหล**) ใช้สำหรับ broadcast + อัปโหลด |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (เปิดเผยได้) ใช้ให้เบราว์เซอร์ subscribe Realtime |

### 3. สร้างฐานข้อมูลและ seed ข้อมูลตัวอย่าง

```bash
pnpm db:push   # สร้าง/ซิงก์ schema ลง Postgres
pnpm db:seed   # ใส่ข้อมูลตัวอย่าง (user, เมนู, โต๊ะ) — รันซ้ำได้ไม่ซ้ำข้อมูล
```

### 4. รันเซิร์ฟเวอร์

```bash
pnpm dev
```

เปิดที่ **http://localhost:3000**

> ถ้าพอร์ต 3000 ถูกใช้อยู่ ให้ระบุพอร์ตอื่น เช่น `PORT=3001 pnpm dev` แล้วเปิด `http://localhost:3001`

## ตั้งค่า Supabase

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com) แล้วเปิด **SQL Editor** รัน migration/SQL ของ schema (หรือใช้ `pnpm db:push` กับ `DATABASE_URL`)
2. เปิดไอคอนรูปเฟือง → **API** เพื่อคัดลอก Project URL, anon key และ service-role key
3. **Realtime**: ใน SQL Editor ต้อง**เปิด Realtime ให้ตาราง**ที่ต้อง sync (`orders`, `order_items`, `payments` ฯลฯ) เพราะระบบใช้ broadcast แบบ Realtime
4. **Storage**: สร้าง bucket ชื่อ `product-images` (public) ไว้เก็บรูปเมนู

## บัญชีทดลอง (จาก seed)

| บทบาท   | อีเมล               | รหัสผ่าน         |
|---------|--------------------|-------------------|
| ผู้ดูแล  | `admin@menu.local` | `admin123456`    |
| ครัว    | `kitchen@menu.local`| `kitchen123456`  |
| แคชเชียร์ | `cashier@menu.local`| `cashier123456`  |

- แอดมินเห็นทั้งหน้าจอครัวและแคชเชียร์
- เข้าพื้นที่ staff ผ่าน `/staff` (บังคับล็อกอินผ่าน `proxy.ts`)

## โครงสร้างหลัก

```
proxy.ts               # ตรวจสิทธิ์ /staff*, /login
lib/
  db/schema.ts         # ตารางทั้งหมด + relations (Drizzle, Postgres)
  db/index.ts          # Drizzle client (lazy, server-only)
  supabase/
    server.ts          # client service-role (lazy) + emitToKitchen/Cashier/Staff/Table
    client.ts          # client anon + subscribeRoom() สำหรับเบราว์เซอร์
  realtime.ts          # roomName() + ประเภทเหตุการณ์เรียลไทม์
  auth/                # password (bcrypt), session (JWT), rbac (requireRole)
  data/                # orders, menu, qr, public (data access)
  cart.ts, format.ts, types.ts
db/seed.ts             # seed ข้อมูล idempotent
app/api/               # auth, categories, products, tables, users,
                       # orders (+active, receipt), payments, reports/daily, menu, upload
app/menu/[tableId]/    # หน้าสั่งอาหารฝั่งลูกค้า (เรียลไทม์)
app/staff/             # dashboard (kitchen/cashier), products, tables(+print), users, reports
app/receipt/[id]/      # หน้าใบเสร็จสำหรับพิมพ์
components/staff/      # kitchen-board, cashier-board, order-modal, shell
```

## ระบบเรียลไทม์ (Supabase Realtime)

- เซิร์ฟเวอร์ broadcast เหตุการณ์ไปยังห้องด้วย service-role (`lib/supabase/server.ts`)
- เบราว์เซอร์ subscribe ด้วย anon client (`lib/supabase/client.ts` → `subscribeRoom()`)
- ห้อง (room): `kitchen`, `cashier`, `table:{tableId}`
- เหตุการณ์: `NEW_ORDER`, `ORDER_STATUS`, `ORDER_CANCELLED`, `ORDER_PAID`
- แอดมิน subscribe ทั้ง `kitchen` และ `cashier` ส่วนครัว/แคชเชียร์ subscribe ตามบทบาทตนเอง

> เพย์โหลดถูกส่งเป็น `{type:"broadcast", event:"message", payload:<event>}` — กรองด้วย event `"message"` ฝั่ง client

## QR โต๊ะ

- หน้า Admin → โต๊ะ (`/staff/tables`) จะมีปุ่มพิมพ์ QR ของแต่ละโต๊ะ
- QR ชี้ไปที่ `/menu/{tableId}?t={token}` (เส้นทางนี้เป็น public ไม่ต้องล็อกอิน)
- ลูกค้าสแกนแล้วสั่งอาหารได้ทันที สถานะออเดอร์อัปเดตแบบเรียลไทม์

## รูปภาพเมนู

- Admin → จัดการเมนู (`/staff/products`) สามารถอัปโหลดรูปเมนูได้ 1 รูปต่อรายการ (แก้ไขได้ด้วยปุ่ม "แก้ไข")
- รูปถูกอัปโหลดไปที่ **Supabase Storage** (bucket `product-images`) ผ่าน API `/api/upload` (จำกัดเฉพาะ admin, ชนิด jpg/png/webp/gif/avif, ขนาดไม่เกิน 5MB)
- รูปแสดงบนหน้ารายการเมนูฝั่งลูกค้า, หน้าจอสั่งอาหารของพนักงาน และหน้าจัดการเมนู
- หากเมนูใดยังไม่มีรูป ระบบจะแสดงไอคอน 🍽️ แทน

## สคริปต์ (pnpm)

| คำสั่ง | ความหมาย |
|--------|-----------|
| `dev` | รัน dev server (`next dev`) |
| `build` | build แอป (`next build`) |
| `start` | รันแบบ production (`next start`) |
| `lint` | ตรวจ ESLint |
| `typecheck` | ตรวจ TypeScript |
| `db:push` / `db:migrate` | สร้าง / migrate schema |
| `db:generate` | generate migration จาก schema |
| `db:seed` | seed ข้อมูลตัวอย่าง (idempotent) |

## Deploy บน Vercel

1. push โปรเจกต์ไป GitHub แล้ว import ที่ [vercel.com](https://vercel.com)
2. ตั้ง **Environment Variables** ทั้งหมดจาก `.env.example` (รวม `SUPABASE_SERVICE_ROLE_KEY` และ `DATABASE_URL`)
3. กด deploy

## หมายเหตุ production

- เปลี่ยน `SESSION_SECRET` เป็นค่าสุ่มที่ปลอดภัยเสมอ
- `SUPABASE_SERVICE_ROLE_KEY` ต้องเป็น server-side เท่านั้น (อย่าใส่ใน `NEXT_PUBLIC_*`)
- ขั้นตอนรัน production local: `pnpm db:push && pnpm db:seed && pnpm build && pnpm start`
