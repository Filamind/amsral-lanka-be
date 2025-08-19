const Customer = require("../models/Customer");

const seedCustomers = async () => {
  try {
    console.log("Starting customer seeding...");

    // Get existing customers count
    const existingCount = await Customer.count();

    if (existingCount > 0) {
      console.log(
        `Customers already exist (${existingCount} records). Skipping seeding.`
      );
      return;
    }

    // Sample customer data
    const sampleCustomers = [
      {
        customerCode: "CUST-001",
        firstName: "John",
        lastName: "Silva",
        email: "john.silva@email.com",
        phone: "+94771234567",
        address: "123 Main Street, Colombo 03",
        city: "Colombo",
        postalCode: "00300",
        country: "Sri Lanka",
        dateOfBirth: "1985-06-15",
        notes: "Regular customer",
      },
      {
        customerCode: "CUST-002",
        firstName: "Priya",
        lastName: "Fernando",
        email: "priya.fernando@email.com",
        phone: "+94779876543",
        address: "456 Galle Road, Dehiwala",
        city: "Dehiwala",
        postalCode: "10350",
        country: "Sri Lanka",
        dateOfBirth: "1990-03-22",
        notes: "VIP customer",
      },
      {
        customerCode: "CUST-003",
        firstName: "Rajesh",
        lastName: "Perera",
        email: "rajesh.perera@email.com",
        phone: "+94775555555",
        address: "789 Kandy Road, Kadawatha",
        city: "Kadawatha",
        postalCode: "11850",
        country: "Sri Lanka",
        dateOfBirth: "1978-11-08",
        notes: "Corporate customer",
      },
      {
        customerCode: "CUST-004",
        firstName: "Amara",
        lastName: "Wickramasinghe",
        email: "amara.wickrama@email.com",
        phone: "+94772222222",
        address: "321 Temple Road, Nugegoda",
        city: "Nugegoda",
        postalCode: "10250",
        country: "Sri Lanka",
        dateOfBirth: "1992-07-19",
        notes: "New customer",
      },
      {
        customerCode: "CUST-005",
        firstName: "Dinesh",
        lastName: "Jayawardena",
        email: "dinesh.jaya@email.com",
        phone: "+94773333333",
        address: "654 High Level Road, Maharagama",
        city: "Maharagama",
        postalCode: "10280",
        country: "Sri Lanka",
        dateOfBirth: "1987-12-03",
        notes: "Frequent customer",
      },
    ];

    // Create customers one by one to handle duplicates
    let createdCount = 0;
    const results = [];

    for (const customerData of sampleCustomers) {
      try {
        const customer = await Customer.create(customerData);
        results.push(customer);
        createdCount++;
        console.log(
          `✓ Created customer: ${customer.firstName} ${customer.lastName} (${customer.customerCode})`
        );
      } catch (error) {
        if (
          error.message === "Customer code already exists" ||
          error.message === "Email already exists"
        ) {
          console.log(
            `⚠ Customer already exists: ${customerData.firstName} ${customerData.lastName} (${customerData.customerCode})`
          );
        } else {
          console.error(
            `✗ Failed to create customer: ${customerData.firstName} ${customerData.lastName}`,
            error.message
          );
        }
      }
    }

    console.log(`\nCustomer seeding completed:`);
    console.log(`- Total sample customers: ${sampleCustomers.length}`);
    console.log(`- Successfully created: ${createdCount}`);
    console.log(
      `- Skipped (already exist): ${sampleCustomers.length - createdCount}`
    );

    return results;
  } catch (error) {
    console.error("Error seeding customers:", error);
    throw error;
  }
};

const unseedCustomers = async () => {
  try {
    console.log("Starting customer unseeding...");

    // Sample customer codes to remove
    const sampleCustomerCodes = [
      "CUST-001",
      "CUST-002",
      "CUST-003",
      "CUST-004",
      "CUST-005",
    ];

    // Find existing sample customers
    const existingCustomers = await Customer.findAll();
    const sampleCustomers = existingCustomers.filter((customer) =>
      sampleCustomerCodes.includes(customer.customerCode)
    );

    if (sampleCustomers.length === 0) {
      console.log("No sample customers found to remove.");
      return;
    }

    // Delete sample customers
    let deletedCount = 0;
    for (const customer of sampleCustomers) {
      try {
        await Customer.delete(customer.id);
        deletedCount++;
        console.log(
          `✓ Deleted customer: ${customer.firstName} ${customer.lastName} (${customer.customerCode})`
        );
      } catch (error) {
        console.error(
          `✗ Failed to delete customer: ${customer.firstName} ${customer.lastName}`,
          error.message
        );
      }
    }

    console.log(`\nCustomer unseeding completed:`);
    console.log(`- Total found: ${sampleCustomers.length}`);
    console.log(`- Successfully deleted: ${deletedCount}`);
    console.log(`- Failed to delete: ${sampleCustomers.length - deletedCount}`);
  } catch (error) {
    console.error("Error unseeding customers:", error);
    throw error;
  }
};

// Run seeder directly if this file is executed
const runSeeder = async () => {
  try {
    await seedCustomers();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

// Allow running this seeder directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedCustomers, unseedCustomers };
