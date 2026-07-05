import bcrypt from "bcryptjs";

const users = [
  {
    username: "admin",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    plain: "password",
  },
  {
    username: "halifa81",
    password: "$2b$10$NHjw7GrEcNuRFzc0ohscbelRgHmN41fJoJ55KhbQ0GoF0FaAvDRmW",
    plain: "halifane1",
  },
];

for (const user of users) {
  const ok = await bcrypt.compare(user.plain, user.password);
  console.log(`${user.username}: ${ok ? "OK" : "FAIL"}`);
}