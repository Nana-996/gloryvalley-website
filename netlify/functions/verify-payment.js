// Netlify Function: Verify Payment Reference with Paystack
// This uses the Paystack secret key for server-side verification
// Required environment variable: PAYSTACK_SECRET_KEY

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_8ee33765dae3fd6e8910e7dff798ae47fd46e1f8";

exports.handler = async (event, context) => {
  // Only accept POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const reference = body.reference;

    if (!reference) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Reference is required" })
      };
    }

    // Verify with Paystack API
    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const response = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const result = await response.json();

    if (result.status && result.data) {
      const data = result.data;
      
      // Check if payment was successful and not a duplicate
      if (data.status === "success" && data.paid_at) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            verified: true,
            status: "success",
            message: "Payment verified successfully",
            data: data
          })
        };
      } else {
        return {
          statusCode: 200,
          body: JSON.stringify({
            verified: false,
            status: data.status,
            message: "Payment not yet confirmed or failed",
            data: data
          })
        };
      }
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Unable to verify payment", details: result })
      };
    }
  } catch (error) {
    console.error("Verification error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error during verification" })
    };
  }
};
