import "dotenv/config";
import { db, schema } from "../lib/db";
import { hashPassword } from "../lib/auth/password";
import { uid, generateQrToken } from "../lib/utils/uid";

async function main() {
  console.log("Seeding database...");

  await db.delete(schema.payments);
  await db.delete(schema.orderItems);
  await db.delete(schema.orders);
  await db.delete(schema.products);
  await db.delete(schema.categories);
  await db.delete(schema.tables);
  await db.delete(schema.users);

  const adminPassword = await hashPassword("admin123456");
  const kitchenPassword = await hashPassword("kitchen123456");
  const cashierPassword = await hashPassword("cashier123456");

  const userValues = [
    { id: uid(), name: "ผู้ดูแลร้าน", email: "admin@menu.local", passwordHash: adminPassword, role: "admin" as const },
    { id: uid(), name: "ครัว", email: "kitchen@menu.local", passwordHash: kitchenPassword, role: "kitchen" as const },
    { id: uid(), name: "แคชเชียร์", email: "cashier@menu.local", passwordHash: cashierPassword, role: "cashier" as const },
  ];
  const result = await db.insert(schema.users).values(userValues).returning();
  const admins = Array.isArray(result) ? result : [result];
  console.log("Users created:", admins.map((u) => u.email));

  const foodCat = uid();
  const drinkCat = uid();
  const dessertCat = uid();
  await db.insert(schema.categories).values([
    { id: foodCat, name: "อาหาร", sortOrder: 1 },
    { id: drinkCat, name: "เครื่องดื่ม", sortOrder: 2 },
    { id: dessertCat, name: "ของหวาน", sortOrder: 3 },
  ]);
  console.log("Categories created");

  const products = [
    // อาหาร
    { categoryId: foodCat, name: "ข้าวผัดกุ้ง", description: "ข้าวผัดกับกุ้งสด หอมกระเทียม", price: 65 },
    { categoryId: foodCat, name: "ผัดไทยกุ้งสด", description: "เส้นจันท์ ผัดไทยสูตรต้นตำรับ", price: 60 },
    { categoryId: foodCat, name: "ต้มยำกุ้ง", description: "ต้มยำกุ้งน้ำข้นใส่เห็ดฟาง", price: 120 },
    { categoryId: foodCat, name: "ยำวุ้นเส้น", description: "ยำวุ้นเส้นหมูสับ", price: 55 },
    { categoryId: foodCat, name: "ไก่ผัดเม็ดมะม่วง", description: "ไก่ผัดเม็ดมะม่วงหิมพานต์", price: 75 },
    { categoryId: foodCat, name: "ไข่เจียวหมูสับ", description: "ไข่เจียวกรอบนอกนุ่มใน", price: 45 },
    // เครื่องดื่ม
    { categoryId: drinkCat, name: "น้ำเปล่า", description: "น้ำเปล่าขวด 350ml", price: 15 },
    { categoryId: drinkCat, name: "น้ำอัดลม", description: "โค้ก/สไปรท์ กระป๋อง", price: 25 },
    { categoryId: drinkCat, name: "ชาเขียว", description: "ชาเขียวเย็น", price: 40 },
    { categoryId: drinkCat, name: "ชามะนาว", description: "ชามะนาวเย็น", price: 35 },
    // ของหวาน
    { categoryId: dessertCat, name: "ข้าวเหนียวมะม่วง", description: "มะม่วงน้ำดอกไม้สุก", price: 50 },
    { categoryId: dessertCat, name: "ไอศกรีมกะทิ", description: "ไอศกรีมกะทิโฮมเมด", price: 30 },
  ];

  await db.insert(schema.products).values(
    products.map((p) => ({ id: uid(), ...p }))
  );
  console.log("Products created:", products.length);

  const tableNumbers = ["A1", "A2", "A3", "B1", "B2", "C1"];
  await db.insert(schema.tables).values(
    tableNumbers.map((n) => ({ id: uid(), tableNumber: n, qrToken: generateQrToken() }))
  );
  console.log("Tables created:", tableNumbers.join(", "));

  console.log("Seed complete!");
  console.log("Login: admin@menu.local / admin123456");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
