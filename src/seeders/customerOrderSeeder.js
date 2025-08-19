const CustomerOrder = require("../models/CustomerOrder");
const CustomerOrderLine = require("../models/CustomerOrderLine");
const CustomerOrderLineProcess = require("../models/CustomerOrderLineProcess");
const Customer = require("../models/Customer");
const ItemType = require("../models/ItemType");
const WashingType = require("../models/WashingType");
const DryingType = require("../models/DryingType");

const sampleOrders = [
  {
    customerEmail: "john.doe@email.com",
    orderLines: [
      {
        itemTypeCode: "Pant",
        quantity: 2,
        unitPrice: 350.0,
        processes: [
          {
            processType: "washing",
            typeCode: "N/W", // Normal wash
            processPrice: 150.0,
          },
          {
            processType: "drying",
            typeCode: "F/D", // Fast drying
            processPrice: 100.0,
          },
          {
            processType: "drying",
            typeCode: "N/D", // Normal drying
            processPrice: 75.0,
          },
        ],
      },
      {
        itemTypeCode: "Shirt",
        quantity: 3,
        unitPrice: 250.0,
        processes: [
          {
            processType: "washing",
            typeCode: "D/W", // Dry wash
            processPrice: 120.0,
          },
          {
            processType: "drying",
            typeCode: "N/D", // Normal drying
            processPrice: 75.0,
          },
        ],
      },
    ],
  },
  {
    customerEmail: "jane.smith@email.com",
    orderLines: [
      {
        itemTypeCode: "C/Pant",
        quantity: 1,
        unitPrice: 400.0,
        processes: [
          {
            processType: "washing",
            typeCode: "S/W", // Special wash
            processPrice: 200.0,
          },
          {
            processType: "drying",
            typeCode: "S/D", // Special drying
            processPrice: 150.0,
          },
        ],
      },
      {
        itemTypeCode: "Frock",
        quantity: 2,
        unitPrice: 450.0,
        processes: [
          {
            processType: "washing",
            typeCode: "N/W", // Normal wash
            processPrice: 150.0,
          },
          {
            processType: "drying",
            typeCode: "F/D", // Fast drying
            processPrice: 100.0,
          },
        ],
      },
    ],
  },
  {
    customerEmail: "bob.wilson@email.com",
    orderLines: [
      {
        itemTypeCode: "T/Shirt",
        quantity: 5,
        unitPrice: 200.0,
        processes: [
          {
            processType: "washing",
            typeCode: "N/W", // Normal wash
            processPrice: 150.0,
          },
          {
            processType: "drying",
            typeCode: "N/D", // Normal drying
            processPrice: 75.0,
          },
        ],
      },
    ],
  },
];

const seedCustomerOrders = async () => {
  try {
    console.log("🌱 Seeding customer orders...");

    // Check if orders already exist
    const existingOrders = await CustomerOrder.getAll({
      page: 1,
      pageSize: 1,
    });

    if (existingOrders.data.length > 0) {
      console.log("   ⚠️  Customer orders already exist, skipping...");
      return;
    }

    let ordersCreated = 0;
    let orderLinesCreated = 0;
    let processesCreated = 0;

    for (const orderData of sampleOrders) {
      // Find customer by email
      const customer = await Customer.findByEmail(orderData.customerEmail);
      if (!customer) {
        console.log(
          `   ⚠️  Customer with email ${orderData.customerEmail} not found, skipping order...`
        );
        continue;
      }

      // Create order
      const order = await CustomerOrder.create({
        customerId: customer.id,
        orderDate: new Date(),
        status: "pending",
      });

      ordersCreated++;
      console.log(
        `   ✅ Created order ${order.orderNumber} for customer ${customer.name}`
      );

      // Create order lines and processes
      for (const lineData of orderData.orderLines) {
        // Find item type by code
        const itemType = await ItemType.findByCode(lineData.itemTypeCode);
        if (!itemType) {
          console.log(
            `   ⚠️  Item type with code ${lineData.itemTypeCode} not found, skipping line...`
          );
          continue;
        }

        // Create order line
        const orderLine = await CustomerOrderLine.create({
          customerOrderId: order.id,
          itemTypeId: itemType.id,
          quantity: lineData.quantity,
          unitPrice: lineData.unitPrice,
          totalPrice: lineData.quantity * lineData.unitPrice,
        });

        orderLinesCreated++;
        console.log(
          `     📦 Created order line for ${lineData.quantity} x ${itemType.name}`
        );

        // Create processes for this order line
        let sequenceNumber = 1;
        for (const processData of lineData.processes) {
          let typeId = null;

          if (processData.processType === "washing") {
            const washingType = await WashingType.findByCode(
              processData.typeCode
            );
            if (washingType) {
              typeId = washingType.id;
            }
          } else if (processData.processType === "drying") {
            const dryingType = await DryingType.findByCode(
              processData.typeCode
            );
            if (dryingType) {
              typeId = dryingType.id;
            }
          }

          if (!typeId) {
            console.log(
              `   ⚠️  Process type ${processData.typeCode} not found, skipping process...`
            );
            continue;
          }

          await CustomerOrderLineProcess.create({
            customerOrderLineId: orderLine.id,
            processType: processData.processType,
            typeId: typeId,
            sequenceNumber: sequenceNumber,
            processPrice: processData.processPrice,
            status: "pending",
          });

          processesCreated++;
          sequenceNumber++;
          console.log(
            `       🔄 Created ${processData.processType} process (${processData.typeCode})`
          );
        }
      }
    }

    console.log(`✅ Customer order seeding completed!`);
    console.log(`   📊 Orders created: ${ordersCreated}`);
    console.log(`   📊 Order lines created: ${orderLinesCreated}`);
    console.log(`   📊 Processes created: ${processesCreated}`);
  } catch (error) {
    console.error("❌ Error seeding customer orders:", error);
    throw error;
  }
};

module.exports = seedCustomerOrders;
