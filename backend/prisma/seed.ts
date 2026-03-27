import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const defaultDrugs = [
  { name: 'Amoxicillin', description: 'Antibiotic for bacterial infections', isDefault: true },
  { name: 'Ibuprofen', description: 'NSAID for pain and inflammation', isDefault: true },
  { name: 'Paracetamol', description: 'Analgesic and antipyretic', isDefault: true },
  { name: 'Omeprazole', description: 'Proton pump inhibitor for acid reflux', isDefault: true },
  { name: 'Metformin', description: 'Oral diabetes medication', isDefault: true },
  { name: 'Amlodipine', description: 'Calcium channel blocker for hypertension', isDefault: true },
  { name: 'Ciprofloxacin', description: 'Fluoroquinolone antibiotic', isDefault: true },
  { name: 'Azithromycin', description: 'Macrolide antibiotic', isDefault: true },
  { name: 'Lisinopril', description: 'ACE inhibitor for blood pressure', isDefault: true },
  { name: 'Prednisone', description: 'Corticosteroid for inflammation', isDefault: true },
  { name: 'Cetirizine', description: 'Antihistamine for allergies', isDefault: true },
  { name: 'Salbutamol', description: 'Bronchodilator for asthma', isDefault: true },
];

const defaultLabTests = [
  { name: 'Complete Blood Count (CBC)', description: 'Measures blood cells and components', category: 'Hematology', isDefault: true },
  { name: 'Blood Glucose', description: 'Measures blood sugar levels', category: 'Biochemistry', isDefault: true },
  { name: 'Lipid Profile', description: 'Measures cholesterol and triglycerides', category: 'Biochemistry', isDefault: true },
  { name: 'Liver Function Tests', description: 'Measures liver enzyme levels', category: 'Biochemistry', isDefault: true },
  { name: 'Kidney Function Tests', description: 'Measures kidney performance markers', category: 'Biochemistry', isDefault: true },
  { name: 'Urinalysis', description: 'Analyzes urine composition', category: 'Urine', isDefault: true },
  { name: 'Thyroid Panel', description: 'Measures thyroid hormone levels', category: 'Endocrinology', isDefault: true },
  { name: 'HIV Test', description: 'Screens for HIV antibodies/antigens', category: 'Infectious Disease', isDefault: true },
  { name: 'Malaria Test', description: 'Rapid diagnostic test for malaria', category: 'Infectious Disease', isDefault: true },
  { name: 'Typhoid Test', description: 'Widal test for typhoid fever', category: 'Infectious Disease', isDefault: true },
  { name: 'Pregnancy Test', description: 'hCG hormone detection', category: 'Special', isDefault: true },
  { name: 'Chest X-Ray', description: 'Radiographic imaging of chest', category: 'Imaging', isDefault: true },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@telemed.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await argon2.hash(adminPassword);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Super System Admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Super Admin created with email: ${adminEmail}`);
  } else {
    console.log('Admin user already exists');
  }

  for (const drug of defaultDrugs) {
    await prisma.drug.upsert({
      where: { name: drug.name },
      update: {},
      create: drug,
    });
  }
  console.log(`✅ ${defaultDrugs.length} default drugs seeded`);

  for (const test of defaultLabTests) {
    await prisma.labTestTemplate.upsert({
      where: { name: test.name },
      update: {},
      create: test,
    });
  }
  console.log(`✅ ${defaultLabTests.length} default lab tests seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
