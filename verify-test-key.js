// Temporary script to verify your Stripe test key
// Run this locally with: node verify-test-key.js
// DELETE THIS FILE after verification for security

console.log("Stripe Test Secret Key:", process.env.STRIPE_SECRET_KEY);
console.log(
  "Key starts with:",
  process.env.STRIPE_SECRET_KEY?.substring(0, 12) + "...",
);
console.log(
  "Is test key?",
  process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"),
);

// Also check if you have a separate test key variable
if (process.env.STRIPE_TEST_SECRET_KEY) {
  console.log(
    "Stripe Test Key (separate var):",
    process.env.STRIPE_TEST_SECRET_KEY?.substring(0, 12) + "...",
  );
}
