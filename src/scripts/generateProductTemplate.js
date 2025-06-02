import XLSX from "xlsx";

// Sample product data with actual category IDs
const products = [
  {
    name: "Paracetamol 500mg",
    description: "Effective pain relief and fever reducer",
    price: 5.99,
    categoryId: "f6684de7-7545-4c45-ad2c-a20389cfe1fc",
    subCategory: "b2f5091e-943c-40b8-9d47-628a10b31313",
    availability: "IN_STOCK",
    requiresPrescription: false,
    details: "Take 1-2 tablets every 4-6 hours as needed",
    medicineCode: "MED001",
    weight: 100,
  },
  {
    name: "Ibuprofen 200mg",
    description: "Anti-inflammatory and pain relief",
    price: 7.99,
    categoryId: "f6684de7-7545-4c45-ad2c-a20389cfe1fc",
    subCategory: "b2f5091e-943c-40b8-9d47-628a10b31313",
    availability: "IN_STOCK",
    requiresPrescription: false,
    details: "Take 1 tablet every 6-8 hours with food",
    medicineCode: "MED002",
    weight: 150,
  },
  {
    name: "Amoxicillin 500mg",
    description: "Antibiotic for bacterial infections",
    price: 12.99,
    categoryId: "f6684de7-7545-4c45-ad2c-a20389cfe1fc",
    subCategory: "b2f5091e-943c-40b8-9d47-628a10b31313",
    availability: "IN_STOCK",
    requiresPrescription: true,
    details: "Take 1 capsule every 8 hours for 7 days",
    medicineCode: "MED003",
    weight: 50,
  },
  {
    name: "Vitamin C 1000mg",
    description: "Dietary supplement for immune support",
    price: 8.99,
    categoryId: "f6684de7-7545-4c45-ad2c-a20389cfe1fc",
    subCategory: "b2f5091e-943c-40b8-9d47-628a10b31313",
    availability: "IN_STOCK",
    requiresPrescription: false,
    details: "Take 1 tablet daily with food",
    medicineCode: "MED004",
    weight: 200,
  },
  {
    name: "Omeprazole 20mg",
    description: "Acid reducer for heartburn relief",
    price: 9.99,
    categoryId: "f6684de7-7545-4c45-ad2c-a20389cfe1fc",
    subCategory: "b2f5091e-943c-40b8-9d47-628a10b31313",
    availability: "IN_STOCK",
    requiresPrescription: false,
    details: "Take 1 capsule daily before breakfast",
    medicineCode: "MED005",
    weight: 75,
  },
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Convert products to worksheet
const worksheet = XLSX.utils.json_to_sheet(products);

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

// Write the workbook to a file
XLSX.writeFile(workbook, "product_template.xlsx");

console.log("Excel file generated successfully!");
