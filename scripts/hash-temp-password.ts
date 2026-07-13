import { hashPassword } from "../lib/admin/password";

async function main() {
  const hash = await hashPassword("TempPass123!");
  console.log("HASH:", hash);
}

main();
