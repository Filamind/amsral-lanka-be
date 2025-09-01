const { db } = require("../config/db");
const { users } = require("../db/schema");

async function seedUsers() {
  console.log("Starting user seeding...");

  const sampleUsers = [
    {
      username: "admin",
      email: "admin@amsral.com",
      firstName: "Admin",
      lastName: "User",
      passwordHash:
        "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // admin123
      phone: "+94771234567",
      dateOfBirth: "1985-01-01",
      roleId: 1,
      isActive: true,
    },
    {
      username: "john.doe",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      passwordHash: "hashedpassword123", // In real app, this would be properly hashed
      phone: "+94712345678",
      dateOfBirth: "1990-05-15",
    },
    {
      username: "jane.smith",
      email: "jane.smith@example.com",
      firstName: "Jane",
      lastName: "Smith",
      passwordHash: "hashedpassword456",
      phone: "+94723456789",
      dateOfBirth: "1992-08-22",
    },
    {
      username: "bob.wilson",
      email: "bob.wilson@example.com",
      firstName: "Bob",
      lastName: "Wilson",
      passwordHash: "hashedpassword789",
      phone: "+94734567890",
      dateOfBirth: "1988-12-03",
    },
    {
      username: "alice.brown",
      email: "alice.brown@example.com",
      firstName: "Alice",
      lastName: "Brown",
      passwordHash: "hashedpassword101",
      phone: "+94745678901",
      dateOfBirth: "1995-03-18",
    },
    {
      username: "charlie.davis",
      email: "charlie.davis@example.com",
      firstName: "Charlie",
      lastName: "Davis",
      passwordHash: "hashedpassword202",
      phone: "+94756789012",
      dateOfBirth: "1987-11-25",
    },
  ];

  try {
    // Clear existing users (optional - remove this in production)
    // await db.delete(users);

    // Insert sample users
    const insertedUsers = await db
      .insert(users)
      .values(sampleUsers)
      .returning();

    console.log(`Successfully seeded ${insertedUsers.length} users:`);
    insertedUsers.forEach((user) => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedUsers();
}

module.exports = { seedUsers };
