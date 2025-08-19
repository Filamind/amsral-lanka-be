const ItemType = require("../models/ItemType");

const seedItemTypes = async () => {
  try {
    console.log("Starting item types seeding...");

    // Get existing item types count
    const existingCount = await ItemType.count();

    if (existingCount > 0) {
      console.log(
        `Item types already exist (${existingCount} records). Skipping seeding.`
      );
      return;
    }

    // Get predefined item types
    const predefinedItemTypes = ItemType.getPredefinedItemTypes();

    // Create item types one by one to handle duplicates
    let createdCount = 0;
    const results = [];

    for (const itemTypeData of predefinedItemTypes) {
      try {
        const itemType = await ItemType.create(itemTypeData);
        results.push(itemType);
        createdCount++;
        console.log(`✓ Created item type: ${itemType.name} (${itemType.code})`);
      } catch (error) {
        if (error.message === "Item type code already exists") {
          console.log(
            `⚠ Item type already exists: ${itemTypeData.name} (${itemTypeData.code})`
          );
        } else {
          console.error(
            `✗ Failed to create item type: ${itemTypeData.name}`,
            error.message
          );
        }
      }
    }

    console.log(`\nItem types seeding completed:`);
    console.log(`- Total predefined: ${predefinedItemTypes.length}`);
    console.log(`- Successfully created: ${createdCount}`);
    console.log(
      `- Skipped (already exist): ${predefinedItemTypes.length - createdCount}`
    );

    return results;
  } catch (error) {
    console.error("Error seeding item types:", error);
    throw error;
  }
};

const unseedItemTypes = async () => {
  try {
    console.log("Starting item types unseeding...");

    // Get predefined item type codes
    const predefinedItemTypes = ItemType.getPredefinedItemTypes();
    const predefinedCodes = predefinedItemTypes.map((it) => it.code);

    // Count existing predefined item types
    const existingItemTypes = await ItemType.findAll();
    const predefinedExisting = existingItemTypes.filter((it) =>
      predefinedCodes.includes(it.code)
    );

    if (predefinedExisting.length === 0) {
      console.log("No predefined item types found to remove.");
      return;
    }

    // Delete predefined item types
    let deletedCount = 0;
    for (const itemType of predefinedExisting) {
      try {
        await ItemType.delete(itemType.id);
        deletedCount++;
        console.log(`✓ Deleted item type: ${itemType.name} (${itemType.code})`);
      } catch (error) {
        console.error(
          `✗ Failed to delete item type: ${itemType.name}`,
          error.message
        );
      }
    }

    console.log(`\nItem types unseeding completed:`);
    console.log(`- Total found: ${predefinedExisting.length}`);
    console.log(`- Successfully deleted: ${deletedCount}`);
    console.log(
      `- Failed to delete: ${predefinedExisting.length - deletedCount}`
    );
  } catch (error) {
    console.error("Error unseeding item types:", error);
    throw error;
  }
};

// Run seeder directly if this file is executed
const runSeeder = async () => {
  try {
    await seedItemTypes();
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

module.exports = { seedItemTypes, unseedItemTypes };
