const { db } = require("../config/db");
const { users } = require("../db/schema");

async function seedUsers() {
  console.log("Starting user seeding...");

  const sampleUsers = [
    {
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      passwordHash: "hashedpassword123", // In real app, this would be properly hashed
      phone: "+94712345678",
      dateOfBirth: "1990-05-15",
    },
    {
      email: "jane.smith@example.com",
      firstName: "Jane",
      lastName: "Smith",
      passwordHash: "hashedpassword456",
      phone: "+94723456789",
      dateOfBirth: "1992-08-22",
    },
    {
      email: "bob.wilson@example.com",
      firstName: "Bob",
      lastName: "Wilson",
      passwordHash: "hashedpassword789",
      phone: "+94734567890",
      dateOfBirth: "1988-12-03",
    },
    {
      email: "alice.brown@example.com",
      firstName: "Alice",
      lastName: "Brown",
      passwordHash: "hashedpassword101",
      phone: "+94745678901",
      dateOfBirth: "1995-03-18",
    },
    {
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
