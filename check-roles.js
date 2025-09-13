const { db } = require("./src/config/db");
const { roles } = require("./src/db/schema");

async function checkRoles() {
  try {
    console.log("🔍 Checking available roles...\n");

    const allRoles = await db.select().from(roles);

    console.log("📊 Available roles:");
    allRoles.forEach((role) => {
      console.log(
        `   ID: ${role.id}, Name: ${role.name}, Description: ${role.description}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkRoles();
