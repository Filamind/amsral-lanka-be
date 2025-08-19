const { db } = require("../config/db");
const { roles } = require("../db/schema");

async function seedRoles() {
  console.log("Starting role seeding...");

  const predefinedRoles = [
    {
      name: "admin",
      description:
        "Administrator with full system access and user management capabilities",
    },
    {
      name: "finance",
      description:
        "Finance team member with access to financial data, reports, and transactions",
    },
    {
      name: "sales",
      description:
        "Sales team member with access to sales data, customer management, and quotations",
    },
  ];

  try {
    // Check if roles already exist
    const existingRoles = await db.select().from(roles);

    if (existingRoles.length > 0) {
      console.log("Roles already exist. Skipping seeding.");
      console.log("Existing roles:");
      existingRoles.forEach((role) => {
        console.log(`- ${role.name}: ${role.description}`);
      });
      process.exit(0);
    }

    // Insert predefined roles
    const insertedRoles = await db
      .insert(roles)
      .values(predefinedRoles)
      .returning();

    console.log(`Successfully seeded ${insertedRoles.length} roles:`);
    insertedRoles.forEach((role) => {
      console.log(`- ${role.name}: ${role.description}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding roles:", error);
    process.exit(1);
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedRoles();
}

module.exports = { seedRoles };
