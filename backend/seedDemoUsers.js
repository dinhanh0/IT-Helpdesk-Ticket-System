const bcrypt = require("bcrypt");
const pool = require("./db");

async function seedDemoUsers() {
    const demoUsers = [
    {
        name: "Anh Dinh",
        email: "anh@example.com",
        password: "DemoHelpdeskTech!2026",
        role: "technician",
    },
    {
        name: "Demo User One",
        email: "user1@example.com",
        password: "DemoHelpdeskUser1!2026",
        role: "user",
    },
    {
        name: "Demo User Two",
        email: "user2@example.com",
        password: "DemoHelpdeskUser2!2026",
        role: "user",
    },
    ];

  try {
    for (const user of demoUsers) {
      const passwordHash = await bcrypt.hash(
        user.password,
        12
      );

      await pool.query(
        `
          INSERT INTO users (
            name,
            email,
            password_hash,
            role
          )
          VALUES ($1, $2, $3, $4)

          ON CONFLICT (email)
          DO UPDATE SET
            name = EXCLUDED.name,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role
        `,
        [
          user.name,
          user.email.toLowerCase(),
          passwordHash,
          user.role,
        ]
      );

      console.log(
        `Created/updated demo user: ${user.email}`
      );
    }

    console.log("Demo users seeded successfully.");
  } catch (error) {
    console.error(
      "Error seeding demo users:",
      error
    );
  } finally {
    await pool.end();
  }
}

seedDemoUsers();