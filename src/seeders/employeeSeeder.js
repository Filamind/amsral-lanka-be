const { db } = require("../config/db");
const { employees } = require("../db/schema");

async function seedEmployees() {
  console.log("Starting employee seeding...");

  const sampleEmployees = [
    {
      employeeId: "EMP001",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@amsral-lanka.com",
      phone: "+94711234567",
      department: "Finance",
      position: "Financial Analyst",
      salary: "85000",
      hireDate: "2023-01-15",
      dateOfBirth: "1990-06-15",
      address: "123 Main Street, Colombo 03",
      emergencyContact: "Jane Smith",
      emergencyPhone: "+94712345678",
    },
    {
      employeeId: "EMP002",
      firstName: "Priya",
      lastName: "Fernando",
      email: "priya.fernando@amsral-lanka.com",
      phone: "+94722345678",
      department: "Sales",
      position: "Sales Manager",
      salary: "95000",
      hireDate: "2023-02-01",
      dateOfBirth: "1988-03-22",
      address: "456 Galle Road, Colombo 06",
      emergencyContact: "Sunil Fernando",
      emergencyPhone: "+94723456789",
    },
    {
      employeeId: "EMP003",
      firstName: "Ravi",
      lastName: "Perera",
      email: "ravi.perera@amsral-lanka.com",
      phone: "+94733456789",
      department: "Finance",
      position: "Accountant",
      salary: "75000",
      hireDate: "2023-03-10",
      dateOfBirth: "1992-09-08",
      address: "789 Kandy Road, Colombo 07",
      emergencyContact: "Mala Perera",
      emergencyPhone: "+94734567890",
    },
    {
      employeeId: "EMP004",
      firstName: "Samantha",
      lastName: "Silva",
      email: "samantha.silva@amsral-lanka.com",
      phone: "+94744567890",
      department: "Sales",
      position: "Sales Representative",
      salary: "65000",
      hireDate: "2023-04-20",
      dateOfBirth: "1994-12-03",
      address: "321 Negombo Road, Colombo 05",
      emergencyContact: "Nimal Silva",
      emergencyPhone: "+94745678901",
    },
    {
      employeeId: "EMP005",
      firstName: "Kamal",
      lastName: "Wijesinghe",
      email: "kamal.wijesinghe@amsral-lanka.com",
      phone: "+94755678901",
      department: "Administration",
      position: "HR Manager",
      salary: "90000",
      hireDate: "2023-05-15",
      dateOfBirth: "1985-11-18",
      address: "567 Dehiwala Road, Colombo 04",
      emergencyContact: "Kumari Wijesinghe",
      emergencyPhone: "+94756789012",
    },
    {
      employeeId: "EMP006",
      firstName: "Niluka",
      lastName: "Jayawardena",
      email: "niluka.jayawardena@amsral-lanka.com",
      phone: "+94766789012",
      department: "Finance",
      position: "Finance Manager",
      salary: "120000",
      hireDate: "2022-11-01",
      dateOfBirth: "1983-07-25",
      address: "890 Pannipitiya Road, Colombo 08",
      emergencyContact: "Ruwan Jayawardena",
      emergencyPhone: "+94767890123",
    },
    {
      employeeId: "EMP007",
      firstName: "Chaminda",
      lastName: "Rathnayake",
      email: "chaminda.rathnayake@amsral-lanka.com",
      phone: "+94777890123",
      department: "Sales",
      position: "Regional Sales Director",
      salary: "150000",
      hireDate: "2022-08-12",
      dateOfBirth: "1980-04-14",
      address: "234 Maharagama Road, Colombo 10",
      emergencyContact: "Sandya Rathnayake",
      emergencyPhone: "+94778901234",
    },
    {
      employeeId: "EMP008",
      firstName: "Rashika",
      lastName: "Gunasekara",
      email: "rashika.gunasekara@amsral-lanka.com",
      phone: "+94788901234",
      department: "Administration",
      position: "Administrative Assistant",
      salary: "55000",
      hireDate: "2023-06-20",
      dateOfBirth: "1996-02-10",
      address: "678 Moratuwa Road, Colombo 09",
      emergencyContact: "Ajith Gunasekara",
      emergencyPhone: "+94789012345",
    },
  ];

  try {
    // Check if employees already exist
    const existingEmployees = await db.select().from(employees);

    if (existingEmployees.length > 0) {
      console.log("Employees already exist. Skipping seeding.");
      console.log(`Found ${existingEmployees.length} existing employees.`);
      process.exit(0);
    }

    // Insert sample employees
    const insertedEmployees = await db
      .insert(employees)
      .values(sampleEmployees)
      .returning();

    console.log(`Successfully seeded ${insertedEmployees.length} employees:`);
    insertedEmployees.forEach((employee) => {
      console.log(
        `- ${employee.employeeId}: ${employee.firstName} ${employee.lastName} (${employee.department} - ${employee.position})`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding employees:", error);
    process.exit(1);
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedEmployees();
}

module.exports = { seedEmployees };
