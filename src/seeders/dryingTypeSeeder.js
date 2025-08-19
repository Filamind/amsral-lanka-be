const DryingType = require("../models/DryingType");

class DryingTypeSeeder {
  static async seed() {
    try {
      console.log("Starting drying types seeding...");

      // Get existing drying types count
      const existingCount = await DryingType.count();

      if (existingCount > 0) {
        console.log(
          `Drying types already exist (${existingCount} records). Skipping seeding.`
        );
        return;
      }

      // Get predefined drying types
      const predefinedDryingTypes = DryingType.getPredefinedDryingTypes();

      // Create drying types one by one to handle duplicates
      let createdCount = 0;
      const results = [];

      for (const dryingTypeData of predefinedDryingTypes) {
        try {
          const dryingType = await DryingType.create(dryingTypeData);
          results.push(dryingType);
          createdCount++;
          console.log(
            `✓ Created drying type: ${dryingType.name} (${dryingType.code})`
          );
        } catch (error) {
          if (error.message === "Drying type code already exists") {
            console.log(
              `⚠ Drying type already exists: ${dryingTypeData.name} (${dryingTypeData.code})`
            );
          } else {
            console.error(
              `✗ Failed to create drying type: ${dryingTypeData.name}`,
              error.message
            );
          }
        }
      }

      console.log(`\nDrying types seeding completed:`);
      console.log(`- Total predefined: ${predefinedDryingTypes.length}`);
      console.log(`- Successfully created: ${createdCount}`);
      console.log(
        `- Skipped (already exist): ${
          predefinedDryingTypes.length - createdCount
        }`
      );

      return results;
    } catch (error) {
      console.error("Error seeding drying types:", error);
      throw error;
    }
  }

  static async unseed() {
    try {
      console.log("Starting drying types unseeding...");

      // Get predefined drying type codes
      const predefinedDryingTypes = DryingType.getPredefinedDryingTypes();
      const predefinedCodes = predefinedDryingTypes.map((dt) => dt.code);

      // Count existing predefined drying types
      const existingDryingTypes = await DryingType.findAll();
      const predefinedExisting = existingDryingTypes.filter((dt) =>
        predefinedCodes.includes(dt.code)
      );

      if (predefinedExisting.length === 0) {
        console.log("No predefined drying types found to remove.");
        return;
      }

      // Delete predefined drying types
      let deletedCount = 0;
      for (const dryingType of predefinedExisting) {
        try {
          await DryingType.delete(dryingType.id);
          deletedCount++;
          console.log(
            `✓ Deleted drying type: ${dryingType.name} (${dryingType.code})`
          );
        } catch (error) {
          console.error(
            `✗ Failed to delete drying type: ${dryingType.name}`,
            error.message
          );
        }
      }

      console.log(`\nDrying types unseeding completed:`);
      console.log(`- Total found: ${predefinedExisting.length}`);
      console.log(`- Successfully deleted: ${deletedCount}`);
      console.log(
        `- Failed to delete: ${predefinedExisting.length - deletedCount}`
      );
    } catch (error) {
      console.error("Error unseeding drying types:", error);
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
  DryingTypeSeeder.run();
}

module.exports = DryingTypeSeeder;
