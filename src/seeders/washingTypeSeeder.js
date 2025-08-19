const WashingType = require("../models/WashingType");

class WashingTypeSeeder {
  static async seed() {
    try {
      console.log("Starting washing types seeding...");

      // Get existing washing types count
      const existingCount = await WashingType.count();

      if (existingCount > 0) {
        console.log(
          `Washing types already exist (${existingCount} records). Skipping seeding.`
        );
        return;
      }

      // Get predefined washing types
      const predefinedWashingTypes = WashingType.getPredefinedWashingTypes();

      // Create washing types one by one to handle duplicates
      let createdCount = 0;
      const results = [];

      for (const washingTypeData of predefinedWashingTypes) {
        try {
          const washingType = await WashingType.create(washingTypeData);
          results.push(washingType);
          createdCount++;
          console.log(
            `✓ Created washing type: ${washingType.name} (${washingType.code})`
          );
        } catch (error) {
          if (error.message === "Washing type code already exists") {
            console.log(
              `⚠ Washing type already exists: ${washingTypeData.name} (${washingTypeData.code})`
            );
          } else {
            console.error(
              `✗ Failed to create washing type: ${washingTypeData.name}`,
              error.message
            );
          }
        }
      }

      console.log(`\nWashing types seeding completed:`);
      console.log(`- Total predefined: ${predefinedWashingTypes.length}`);
      console.log(`- Successfully created: ${createdCount}`);
      console.log(
        `- Skipped (already exist): ${
          predefinedWashingTypes.length - createdCount
        }`
      );

      return results;
    } catch (error) {
      console.error("Error seeding washing types:", error);
      throw error;
    }
  }

  static async unseed() {
    try {
      console.log("Starting washing types unseeding...");

      // Get predefined washing type codes
      const predefinedWashingTypes = WashingType.getPredefinedWashingTypes();
      const predefinedCodes = predefinedWashingTypes.map((wt) => wt.code);

      // Count existing predefined washing types
      const existingWashingTypes = await WashingType.findAll();
      const predefinedExisting = existingWashingTypes.filter((wt) =>
        predefinedCodes.includes(wt.code)
      );

      if (predefinedExisting.length === 0) {
        console.log("No predefined washing types found to remove.");
        return;
      }

      // Delete predefined washing types
      let deletedCount = 0;
      for (const washingType of predefinedExisting) {
        try {
          await WashingType.delete(washingType.id);
          deletedCount++;
          console.log(
            `✓ Deleted washing type: ${washingType.name} (${washingType.code})`
          );
        } catch (error) {
          console.error(
            `✗ Failed to delete washing type: ${washingType.name}`,
            error.message
          );
        }
      }

      console.log(`\nWashing types unseeding completed:`);
      console.log(`- Total found: ${predefinedExisting.length}`);
      console.log(`- Successfully deleted: ${deletedCount}`);
      console.log(
        `- Failed to delete: ${predefinedExisting.length - deletedCount}`
      );
    } catch (error) {
      console.error("Error unseeding washing types:", error);
      throw error;
    }
  }

  // Run seeder directly if this file is executed
  static async run() {
    try {
      await this.seed();
      process.exit(0);
    } catch (error) {
      console.error("Seeding failed:", error);
      process.exit(1);
    }
  }
}

// Allow running this seeder directly
if (require.main === module) {
  WashingTypeSeeder.run();
}

module.exports = WashingTypeSeeder;
