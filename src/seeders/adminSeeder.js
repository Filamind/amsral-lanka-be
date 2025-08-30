const bcrypt = require("bcrypt");
const { db } = require("../config/db");
const { users, roles } = require("../db/schema");
const { eq } = require("drizzle-orm");

async function seedAdmin() {
  console.log("Starting admin user seeding...");

  try {
    // First, ensure admin role exists
    const adminRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "admin"));

    if (adminRole.length === 0) {
      console.log("Admin role not found. Creating admin role first...");
      const newAdminRole = await db
        .insert(roles)
        .values({
          name: "admin",
          description:
            "Administrator with full system access and user management capabilities",
        })
        .returning();
      console.log("Admin role created successfully.");
    }

    // Get the admin role ID
    const adminRoleData = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "admin"));
    const adminRoleId = adminRoleData[0].id;

    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@amsral.com"));

    if (existingAdmin.length > 0) {
      console.log("Admin user already exists:");
      console.log(`- Email: ${existingAdmin[0].email}`);
      console.log(
        `- Name: ${existingAdmin[0].firstName} ${existingAdmin[0].lastName}`
      );
      console.log(
        "If you need to reset the password, please delete the existing admin user first."
      );
      return;
    }

    // Create admin user with hashed password
    const adminPassword = "Admin123!"; // You can change this password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const adminUser = {
      email: "admin@amsral.com",
      firstName: "System",
      lastName: "Administrator",
      passwordHash: hashedPassword,
      phone: "+94701234567",
      dateOfBirth: "1980-01-01",
      roleId: adminRoleId,
      isActive: true,
    };

    const insertedAdmin = await db.insert(users).values(adminUser).returning();

    console.log("\n✅ Admin user created successfully!");
    console.log("==========================================");
    console.log(`Email: ${insertedAdmin[0].email}`);
    console.log(`Password: ${adminPassword}`);
    console.log(
      `Name: ${insertedAdmin[0].firstName} ${insertedAdmin[0].lastName}`
    );
    console.log(`Role: admin`);
    console.log("==========================================");
    console.log(
      "\n⚠️  IMPORTANT: Please change the admin password after first login!"
    );
    console.log(
      "   You can use the PUT /api/users/:id endpoint to update the password."
    );
  } catch (error) {
    console.error("Error seeding admin user:", error);
    throw error;
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log("Admin seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Admin seeding failed:", error);
      process.exit(1);
    });
}

module.exports = { seedAdmin };
