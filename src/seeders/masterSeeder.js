const { seedRoles } = require("./roleSeeder");
const { seedUsers } = require("./userSeeder");
const { seedEmployees } = require("./employeeSeeder");
const WashingTypeSeeder = require("./washingTypeSeeder");
const DryingTypeSeeder = require("./dryingTypeSeeder");
const { seedCustomers } = require("./customerSeeder");
const { seedItemTypes } = require("./itemTypeSeeder");
const seedCustomerOrders = require("./customerOrderSeeder");

class MasterSeeder {
  static async seedAll() {
    try {
      console.log("🌱 Starting master seeding process...\n");

      // Seed roles first (required for users)
      console.log("1. Seeding Roles...");
      await seedRoles();
      console.log("");

      // Seed users (depends on roles)
      console.log("2. Seeding Users...");
      await seedUsers();
      console.log("");

      // Seed employees (independent)
      console.log("3. Seeding Employees...");
      await seedEmployees();
      console.log("");

      // Seed washing types (independent)
      console.log("4. Seeding Washing Types...");
      await WashingTypeSeeder.seed();
      console.log("");

      // Seed drying types (independent)
      console.log("5. Seeding Drying Types...");
      await DryingTypeSeeder.seed();
      console.log("");

      // Seed customers (independent)
      console.log("6. Seeding Customers...");
      await seedCustomers();
      console.log("");

      // Seed item types (independent)
      console.log("7. Seeding Item Types...");
      await seedItemTypes();
      console.log("");

      // Seed customer orders (depends on customers, item types, washing types, drying types)
      console.log("8. Seeding Customer Orders...");
      await seedCustomerOrders();
      console.log("");

      console.log("🎉 Master seeding completed successfully!");
    } catch (error) {
      console.error("❌ Master seeding failed:", error);
      throw error;
    }
  }

  static async unseedAll() {
    try {
      console.log("🧹 Starting master unseeding process...\n");

      // Unseed in reverse order to handle dependencies
      console.log("1. Unseeding Washing Types...");
      await WashingTypeSeeder.unseed();
      console.log("");

      console.log("2. Unseeding Drying Types...");
      await DryingTypeSeeder.unseed();
      console.log("");

      console.log(
        "Note: Users, Employees, and Roles unseeding not implemented in original seeders."
      );
      console.log("You may need to manually clear these tables if needed.");
      console.log("");

      console.log("🎉 Master unseeding completed successfully!");
    } catch (error) {
      console.error("❌ Master unseeding failed:", error);
      throw error;
    }
  }

  static async reseedAll() {
    try {
      console.log("🔄 Starting master reseeding process...\n");

      await this.unseedAll();
      console.log("\n");
      await this.seedAll();

      console.log("🎉 Master reseeding completed successfully!");
    } catch (error) {
      console.error("❌ Master reseeding failed:", error);
      throw error;
    }
  }

  // Run seeder based on command line argument
  static async run() {
    try {
      const command = process.argv[2] || "seed";

      switch (command) {
        case "seed":
          await this.seedAll();
          break;
        case "unseed":
          await this.unseedAll();
          break;
        case "reseed":
          await this.reseedAll();
          break;
        default:
          console.log("Usage: node masterSeeder.js [seed|unseed|reseed]");
          process.exit(1);
      }

      process.exit(0);
    } catch (error) {
      console.error("Seeding operation failed:", error);
      process.exit(1);
    }
  }
}

// Allow running this seeder directly
if (require.main === module) {
  MasterSeeder.run();
}

module.exports = MasterSeeder;
