const { Resend } = require("resend");

// Initialize Resend with key from environment variables
const getResendInstance = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY is missing. Emails will be logged to the console instead of being sent.");
    return null;
  }
  return new Resend(apiKey);
};

/**
 * Formats a currency value as Indian Rupees (INR) or currency specified in process.env
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Compiles and sends a beautifully styled order confirmation email
 * @param {Object} order - The order document from MongoDB
 */
const sendOrderConfirmationEmail = async (order) => {
  try {
    if (!order || !order.shippingAddress || !order.shippingAddress.email) {
      console.error("❌ Cannot send order confirmation email: Invalid order or missing email.");
      return;
    }

    const recipientEmail = order.shippingAddress.email;
    const recipientName = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`;
    const supportEmail = process.env.SUPPORT_EMAIL || "support@furniro.com";
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Furniro <onboarding@resend.dev>";

    // Calculate estimated delivery date range (5 to 7 business days from order date)
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
    
    const addBusinessDays = (startDate, days) => {
      const date = new Date(startDate);
      let count = 0;
      while (count < days) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) { // Skip Sunday and Saturday
          count++;
        }
      }
      return date;
    };

    const deliveryStart = addBusinessDays(orderDate, 5);
    const deliveryEnd = addBusinessDays(orderDate, 7);

    const formatDate = (d) => {
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };

    const deliveryRangeStr = `${formatDate(deliveryStart)} - ${formatDate(deliveryEnd)}`;

    // Build the order items HTML list
    let itemsHtml = "";
    for (const item of order.items) {
      itemsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; vertical-align: middle;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px; vertical-align: middle;" />` : ""}
            <span style="font-weight: 600; color: #1a202c; vertical-align: middle;">${item.name}</span>
            <br/>
            <span style="font-size: 11px; color: #718096; margin-left: ${item.image ? "60px" : "0px"};">SKU: ${item.sku}</span>
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #4a5568; vertical-align: middle;">${item.quantity}</td>
          <td style="padding: 12px 8px; text-align: right; color: #1a202c; font-weight: 600; vertical-align: middle;">${formatCurrency(item.price)}</td>
          <td style="padding: 12px 8px; text-align: right; color: #1a202c; font-weight: 600; vertical-align: middle;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>
      `;
    }

    // Modern, warm, responsive HTML template matching Furniro branding
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 10px !important; }
            .col { display: block !important; width: 100% !important; margin-bottom: 15px !important; }
          }
        </style>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #faf8f6; color: #333333; margin: 0; padding: 20px 0; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #eae5df;">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #FAF3EA; padding: 30px 40px; text-align: center; border-bottom: 3px solid #B88E2F;">
                    <h1 style="font-size: 28px; margin: 0; color: #333333; font-weight: 700; letter-spacing: 1px;">Furniro</h1>
                    <p style="font-size: 14px; margin: 5px 0 0 0; color: #B88E2F; text-transform: uppercase; font-weight: 600; letter-spacing: 2px;">Order Confirmed</p>
                  </td>
                </tr>

                <!-- Intro -->
                <tr>
                  <td style="padding: 30px 40px;">
                    <h2 style="font-size: 20px; color: #1a202c; margin-top: 0; margin-bottom: 10px;">Thank you for your purchase, ${recipientName}!</h2>
                    <p style="font-size: 15px; color: #4a5568; line-height: 1.6; margin: 0;">
                      We've received your order and are getting it ready for shipment. You will receive another notification once your items are on their way.
                    </p>
                  </td>
                </tr>

                <!-- Summary Cards -->
                <tr>
                  <td style="padding: 0 40px 20px 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <!-- Order Details -->
                        <td class="col" width="48%" valign="top" style="background-color: #faf8f6; border-radius: 6px; padding: 15px; border: 1px solid #eae5df;">
                          <h3 style="font-size: 13px; text-transform: uppercase; color: #718096; margin-top: 0; margin-bottom: 10px; letter-spacing: 0.5px;">Order Info</h3>
                          <p style="font-size: 14px; margin: 0 0 5px 0; color: #2d3748;"><strong>Order ID:</strong> <span style="font-family: monospace;">${order.razorpayOrderId}</span></p>
                          <p style="font-size: 14px; margin: 0 0 5px 0; color: #2d3748;"><strong>Payment ID:</strong> <span style="font-family: monospace;">${order.razorpayPaymentId || "Mock Sandbox"}</span></p>
                          <p style="font-size: 14px; margin: 0; color: #2d3748;"><strong>Date:</strong> ${orderDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        </td>
                        <td width="4%">&nbsp;</td>
                        <!-- Estimated Delivery -->
                        <td class="col" width="48%" valign="top" style="background-color: #faf8f6; border-radius: 6px; padding: 15px; border: 1px solid #eae5df;">
                          <h3 style="font-size: 13px; text-transform: uppercase; color: #718096; margin-top: 0; margin-bottom: 10px; letter-spacing: 0.5px;">Estimated Delivery</h3>
                          <p style="font-size: 15px; color: #B88E2F; margin: 0 0 5px 0; font-weight: 700;">${deliveryRangeStr}</p>
                          <p style="font-size: 12px; margin: 0; color: #718096; line-height: 1.4;">Standard home delivery. Excludes holidays and weekends.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Product Table -->
                <tr>
                  <td style="padding: 10px 40px 20px 40px;">
                    <h3 style="font-size: 14px; text-transform: uppercase; color: #718096; margin-top: 0; margin-bottom: 12px; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Order Details</h3>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                      <thead>
                        <tr style="color: #718096; font-weight: 600;">
                          <th align="left" style="padding-bottom: 10px;">Product</th>
                          <th align="center" style="padding-bottom: 10px;">Qty</th>
                          <th align="right" style="padding-bottom: 10px;">Price</th>
                          <th align="right" style="padding-bottom: 10px;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                        <!-- Total -->
                        <tr>
                          <td colspan="2">&nbsp;</td>
                          <td align="right" style="padding: 20px 8px 12px 8px; font-weight: bold; color: #4a5568; border-top: 2px solid #e2e8f0;">Total Paid</td>
                          <td align="right" style="padding: 20px 8px 12px 8px; font-weight: bold; color: #B88E2F; font-size: 18px; border-top: 2px solid #e2e8f0;">${formatCurrency(order.totalAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Shipping Address -->
                <tr>
                  <td style="padding: 10px 40px 30px 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf8f6; border-radius: 6px; border: 1px solid #eae5df; padding: 20px;">
                      <tr>
                        <td>
                          <h3 style="font-size: 13px; text-transform: uppercase; color: #718096; margin-top: 0; margin-bottom: 12px; letter-spacing: 0.5px;">Shipping Address</h3>
                          <p style="font-size: 14px; color: #2d3748; margin: 0 0 5px 0;"><strong>${recipientName}</strong></p>
                          ${order.shippingAddress.companyName ? `<p style="font-size: 14px; color: #4a5568; margin: 0 0 5px 0;">${order.shippingAddress.companyName}</p>` : ""}
                          <p style="font-size: 14px; color: #4a5568; margin: 0 0 5px 0;">${order.shippingAddress.streetAddress}</p>
                          <p style="font-size: 14px; color: #4a5568; margin: 0 0 5px 0;">${order.shippingAddress.townCity}, ${order.shippingAddress.province || ""} ${order.shippingAddress.zipCode}</p>
                          <p style="font-size: 14px; color: #4a5568; margin: 0 0 5px 0;">${order.shippingAddress.country}</p>
                          <p style="font-size: 14px; color: #4a5568; margin: 10px 0 0 0;">📞 ${order.shippingAddress.phone}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer / Support -->
                <tr>
                  <td style="background-color: #333333; color: #ffffff; padding: 30px 40px; text-align: center;">
                    <p style="font-size: 14px; margin: 0 0 10px 0;">If you have any questions, reply to this email or contact us at <a href="mailto:${supportEmail}" style="color: #FAF3EA; text-decoration: underline;">${supportEmail}</a></p>
                    <p style="font-size: 12px; color: #a0aec0; margin: 0;">&copy; 2026 Furniro. All rights reserved.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const resend = getResendInstance();

    if (resend) {
      console.log(`📡 Sending order confirmation email via Resend to: ${recipientEmail}...`);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: recipientEmail,
        subject: `Your Furniro Order Confirmation [${order.razorpayOrderId}]`,
        html: htmlContent,
      });

      if (error) {
        console.error("❌ Resend API error sending email:", error);
      } else {
        console.log(`✅ Order confirmation email sent successfully. ID: ${data.id}`);
      }
    } else {
      // Development fallback log
      console.log("\n=================== DEV EMAIL LOG ===================");
      console.log(`TO: ${recipientEmail}`);
      console.log(`FROM: ${fromEmail}`);
      console.log(`SUBJECT: Your Furniro Order Confirmation [${order.razorpayOrderId}]`);
      console.log("------------------ ESTIMATED DELIVERY ------------------");
      console.log(`ESTIMATED DELIVERY: ${deliveryRangeStr}`);
      console.log("--------------------- ITEMS LIST ---------------------");
      order.items.forEach((item) => {
        console.log(` - SKU: ${item.sku} | ${item.name} | Qty: ${item.quantity} | Price: ${formatCurrency(item.price)}`);
      });
      console.log(`TOTAL PAID: ${formatCurrency(order.totalAmount)}`);
      console.log("======================================================\n");
    }
  } catch (error) {
    console.error("❌ Unhandled exception in emailService:", error);
  }
};

module.exports = {
  sendOrderConfirmationEmail
};
