require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PAYU_URL = process.env.PAYU_URL;
const MERCHANT_KEY = process.env.MERCHANT_KEY;
const MERCHANT_SALT = process.env.MERCHANT_SALT;
const FRONTEND_URL = process.env.FRONTEND;

console.log("PayU URL:", PAYU_URL);
console.log("Merchant Key:", MERCHANT_KEY);
console.log("Merchant Salt:", MERCHANT_SALT);
console.log("Frontend URL:", FRONTEND_URL);

app.post("/api/create-payu-order", async (req, res) => {
  const {
    price,
    productName,
    email,
    firstName,
    user,
    product,
    shippingAddress,
    appliedCoupon,
  } = req.body;

  console.log("Request Body:", req.body);

  if (
    !price ||
    !productName ||
    !email ||
    !firstName ||
    !user ||
    !product ||
    !shippingAddress
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Generate a unique txnid (transaction ID) using the current timestamp
  const txnid = "ORDER_" + Date.now();

  // Prepare the hash string with necessary fields (adjust based on PayU documentation)
  const hashString = `${MERCHANT_KEY}|${txnid}|${price}|${productName}|${firstName}|${email}|||||||||||${MERCHANT_SALT}`;

  // Calculate the SHA512 hash
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  // PayU Success and Failure URLs
  const successUrl = `${FRONTEND_URL}/success`;
  const failureUrl = `${FRONTEND_URL}/failure`;

  const paymentData = {
    key: MERCHANT_KEY,
    txnid: txnid,
    amount: price,
    productinfo: productName,
    firstname: firstName,
    email: email,
    surl: successUrl,
    furl: failureUrl,
    hash: hash,
    user,
    product,
    shippingAddress,
    appliedCoupon,
  };

  try {
    return res.status(200).json({
      paymentData,
      payUrl: PAYU_URL,
      success: true,
    });
  } catch (error) {
    console.error("Error creating PayU order:", error);
    return res.status(500).json({ error: "Failed to create PayU order" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
