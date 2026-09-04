# Menu Online — ระบบสั่งอาหารผ่าน QR Code

ระบบสั่งอาหารออนไลน์สำหรับร้านอาหารที่ให้ลูกค้าสแกน QR ที่โต๊ะเพื่อเลือกเมนูและส่งคำสั่งแบบเรียลไทม์ ไปยังหน้าจอครัวและแคชเชียร์ พร้อมระบบยืนยันตัวตน หลายบทบาท รายงานยอดขายรายวัน และประมวลผลชำระเงินแบบเบ็ดเสร็จ

ปัจจุบันโครงการใช้โครงสร้างหลักแบบ Next.js App Router ร่วมกับ Prisma ORM และฐานข้อมูล PostgreSQL ผ่าน Prisma Postgres / Vercel environment variables โดยยังคงมีบางส่วนของโค้ดที่รองรับ Supabase สำหรับ fallback หรือฟีเจอร์ที่ยังใช้งานต่อเนื่องได้

## เทคโนโลยีที่ใช้

- Next.js 16.3 + React 19 + TypeScript
- Prisma ORM + PostgreSQL
- Tailwind CSS v4 สำหรับ UI
- JWT session + bcrypt สำหรับยืนยันตัวตน
- QR code generation สำหรับโต๊ะอาหาร
- Realtime / storage support จาก Supabase สำหรับบางฟีเจอร์ที่ยังมีการใช้งานต่อ
- pnpm สำหรับ package management

## สถานะปัจจุบันของโปรเจกต์

- โครงสร้างฐานข้อมูลหลักถูกย้ายสู่ Prisma schema ใน `prisma/schema.prisma`
- ตัวแปรฐานข้อมูลหลักใช้ `DATABASE_URL`
- สำหรับการ deploy บน Vercel ใช้ค่า environment variable จาก Prisma Postgres / Vercel project
- โค้ดยังมีการอ้างอิง Supabase ในบางส่วนของระบบสำหรับ realtime และ upload fallback ซึ่งยังสามารถใช้ได้ตามสภาพแวดล้อม

## เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```bash
pnpm install
```

### 2. ตั้งค่า environment

สร้างไฟล์ `.env` จากค่า environment ของเครื่องหรือ Vercel แล้วตั้งค่าตัวแปรต่อไปนี้

```bash
cp .env.example .env
```

หรือสร้างไฟล์ `.env` เองด้วยค่าอย่างน้อย:

```bash
SESSION_SECRET=your-long-random-secret
NEXT_PUBLIC_APP_URL=http://localhost:3001
DATABASE_URL=postgresql://...your-prisma-or-postgres-url...
```

ค่าที่ควรมี:

- `SESSION_SECRET`: secret สำหรับเซ็น session JWT
- `NEXT_PUBLIC_APP_URL`: URL สาธารณะของแอป เช่น `http://localhost:3001`
- `DATABASE_URL`: PostgreSQL connection string ของฐานข้อมูลจริง

### 3. สร้างฐานข้อมูลและ seed ข้อมูลตัวอย่าง

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

คำอธิบาย:

- `db:generate`: generate Prisma Client
- `db:push`: sync schema กับฐานข้อมูล
- `db:seed`: insert ข้อมูลตัวอย่าง เช่น user, category, product, table

### 4. รันเซิร์ฟเวอร์

```bash
pnpm dev
```

เปิดที่:

- http://localhost:3000
- หรือถ้าพอร์ต 3000 ถูกใช้อยู่ ให้ใช้ `PORT=3001 pnpm dev`

## บัญชีทดลองที่ใช้ใน seed

| บทบาท | อีเมล | รหัสผ่าน |
|--------|-------|----------|
| ผู้ดูแล | `admin@menu.local` | `admin123456` |
| ครัว | `kitchen@menu.local` | `kitchen123456` |
| แคชเชียร์ | `cashier@menu.local` | `cashier123456` |

- แอดมินสามารถเข้าถึงทั้งหน้าจอครัวและแคชเชียร์
- พนักงานเข้าหน้าพื้นที่ staff ผ่าน `/staff`

## โครงสร้างหลัก

```bash
app/
  api/                  # API routes สำหรับ auth, products, orders, reports, upload
  menu/[tableId]/       # หน้า public สำหรับลูกค้า
  staff/                # dashboard, products, tables, users, reports
  receipt/[id]/         # หน้าใบเสร็จ
components/
  staff/                # kitchen-board, cashier-board, order modal, shell
lib/
  auth/                 # session, rbac, password handling
  data/                 # menu data access logic
  db/                   # Prisma DB access layer + schema wrapper
  realtime.ts           # realtime room utilities
  supabase/             # optional Supabase compatibility
prisma/
  schema.prisma         # Prisma schema หลัก
public/
  uploads/              # local upload fallback
proxy.ts                # route guard สำหรับ staff/login
```

## การ deploy บน Vercel

1. push code ไปยัง GitHub repo ที่ถูกต้อง
2. import repo ลง Vercel
3. ตั้ง environment variables ให้ครบตาม environment ที่ใช้งานจริง
4. สำหรับ Prisma ตรวจสอบให้ `DATABASE_URL` ตรงกับ database ของ Vercel / Prisma Postgres
5. deploy และตรวจสอบ logs หากมีปัญหาการเชื่อมต่อหรือ schema

## หมายเหตุสำหรับ production

- เปลี่ยน `SESSION_SECRET` เป็นค่า random ที่ปลอดภัยจริง
- ใช้ฐานข้อมูลที่เหมาะสมกับ environment (local / preview / production) แยกกัน
- ก่อน deploy ให้เรียก `pnpm db:push` หรือ migrate ตามที่ต้องการ
- หากใช้ Supabase สำหรับ realtime/storage ให้แน่ใจว่า environment variable ที่เกี่ยวข้องถูกตั้งให้ตรงตาม project

## สคริปต์ที่ใช้บ่อย

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm db:generate
pnpm db:push
pnpm db:seed
```

## ประวัติการเปลี่ยนแปลง

- โครงการเริ่มต้นด้วย Supabase-centric stack
- ปัจจุบันมีการปรับใช้ Prisma ORM + PostgreSQL เป็นโครงสร้างหลักสำหรับการพัฒนาการเชื่อมต่อ database และ deployment บน Vercel
- บางฟังก์ชันที่อยู่ใน codebase ยังคงมี compatibility สำหรับ Supabase เพื่อให้ใช้งานต่อได้ในช่วง transition
