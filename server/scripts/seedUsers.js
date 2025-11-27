const bcrypt = require("bcryptjs");
const { User, UserProfile } = require("../models");

async function seedUsers() {
  try {
    console.log("🌱 Seeding users...");

    // Create admin user
    const adminPassword = await bcrypt.hash("Admin123!", 10);
    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: "admin@volunteer.com" },
      defaults: {
        email: "admin@volunteer.com",
        password_hash: adminPassword,
        role: "admin",
      },
    });

    if (adminCreated) {
      console.log("✅ Created admin user:");
      console.log("   Email: admin@volunteer.com");
      console.log("   Password: Admin123!");
      console.log("   Role: admin");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Create volunteer user
    const volunteerPassword = await bcrypt.hash("Volunteer123!", 10);
    const [volunteer, volunteerCreated] = await User.findOrCreate({
      where: { email: "volunteer@volunteer.com" },
      defaults: {
        email: "volunteer@volunteer.com",
        password_hash: volunteerPassword,
        role: "volunteer",
      },
    });

    if (volunteerCreated) {
      console.log("✅ Created volunteer user:");
      console.log("   Email: volunteer@volunteer.com");
      console.log("   Password: Volunteer123!");
      console.log("   Role: volunteer");

      // Create sample profile for volunteer
      await UserProfile.create({
        userId: volunteer.id,
        fullName: "John Volunteer",
        address1: "123 Main St",
        address2: "Apt 4B",
        city: "Houston",
        state: "TX",
        zip: "77001",
        skills: ["Communication", "Teamwork", "Organized"],
        preferences: "Available on weekends",
        availability: ["2024-12-01", "2024-12-15", "2024-12-22"],
      });

      console.log("✅ Created sample profile for volunteer");
    } else {
      console.log("ℹ️  Volunteer user already exists");
    }

    console.log("\n🎉 Seeding complete!");
    console.log("\n📝 Test Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("ADMIN:");
    console.log("  Email: admin@volunteer.com");
    console.log("  Password: Admin123!");
    console.log("\nVOLUNTEER:");
    console.log("  Email: volunteer@volunteer.com");
    console.log("  Password: Volunteer123!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
}

seedUsers();

