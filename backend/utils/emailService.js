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
 * Formats a currency value as Indian Rupees (INR)
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

/**
 * Helper to calculate business day delivery ranges
 */
const getDeliveryRangeString = (orderDate, startDays = 5, endDays = 7) => {
  const baseDate = orderDate ? new Date(orderDate) : new Date();
  const addBusinessDays = (startDate, days) => {
    const date = new Date(startDate);
    let count = 0;
    while (count < days) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
    }
    return date;
  };

  const deliveryStart = addBusinessDays(baseDate, startDays);
  const deliveryEnd = addBusinessDays(baseDate, endDays);

  const formatDate = (d) => {
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return `${formatDate(deliveryStart)} - ${formatDate(deliveryEnd)}`;
};

/**
 * Shared base HTML template generator for Furniro emails
 */
const buildFurniroEmailHtml = ({ title, badgeText, badgeColor = "#B88E2F", introTitle, introBody, highlightBoxHtml = "", order, extraSectionsHtml = "" }) => {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@furniro.com";
  const recipientName = order.shippingAddress ? `${order.shippingAddress.firstName || ""} ${order.shippingAddress.lastName || ""}`.trim() : "Valued Customer";

  // Build items summary rows
  let itemsHtml = "";
  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      itemsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; vertical-align: middle;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px; margin-right: 10px; vertical-align: middle;" />` : ""}
            <span style="font-weight: 600; color: #1a202c; vertical-align: middle;">${item.name}</span>
            <br/>
            <span style="font-size: 11px; color: #718096; margin-left: ${item.image ? "58px" : "0px"};">SKU: ${item.sku}</span>
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #4a5568; vertical-align: middle;">${item.quantity}</td>
          <td style="padding: 12px 8px; text-align: right; color: #1a202c; font-weight: 600; vertical-align: middle;">${formatCurrency(item.price)}</td>
          <td style="padding: 12px 8px; text-align: right; color: #1a202c; font-weight: 600; vertical-align: middle;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>
      `;
    }
  }

  const shipping = order.shippingAddress || {};

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
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
                <td style="background-color: #FAF3EA; padding: 28px 40px; text-align: center; border-bottom: 3px solid ${badgeColor};">
                  <h1 style="font-size: 28px; margin: 0; color: #333333; font-weight: 700; letter-spacing: 1px;">Furniro</h1>
                  <p style="font-size: 13px; margin: 6px 0 0 0; color: ${badgeColor}; text-transform: uppercase; font-weight: 700; letter-spacing: 2px;">${badgeText}</p>
                </td>
              </tr>

              <!-- Intro Section -->
              <tr>
                <td style="padding: 28px 40px 16px 40px;">
                  <h2 style="font-size: 20px; color: #1a202c; margin-top: 0; margin-bottom: 10px;">${introTitle}</h2>
                  <p style="font-size: 15px; color: #4a5568; line-height: 1.6; margin: 0;">${introBody}</p>
                </td>
              </tr>

              ${highlightBoxHtml ? `
              <!-- Highlight / Tracking / Notice Box -->
              <tr>
                <td style="padding: 0 40px 20px 40px;">
                  ${highlightBoxHtml}
                </td>
              </tr>` : ""}

              <!-- Order Overview Card -->
              <tr>
                <td style="padding: 0 40px 20px 40px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td class="col" width="48%" valign="top" style="background-color: #faf8f6; border-radius: 6px; padding: 14px; border: 1px solid #eae5df;">
                        <h3 style="font-size: 12px; text-transform: uppercase; color: #718096; margin-top: 0; margin-bottom: 8px; letter-spacing: 0.5px;">Order Details</h3>
                        <p style="font-size: 13px; margin: 0 0 4px 0; color: #2d3748;"><strong>Order ID:</strong> <span style="font-family: monospace;">${order.razorpayOrderId || order._id}</span></p>
                        <p style="font-size: 13px; margin: 0 0 4px 0; color: #2d3748;"><strong>Status:</strong> <span style="text-transform: capitalize; color: ${badgeColor}; font-weight: 600;">${order.status}</span></p>
                        <p style="font-size: 13px; margin: 0; color: #2d3748;"><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today"}</p>
                      </td>
                      <td width="4%">&nbsp;</td>
                      <td class="col" width="48%" valign="top" style="background-color: #faf8f6; border-radius: 6px; padding: 14px; border: 1px solid #eae5df;">
                        <h3 style="font-size: 12px; text-transform: uppercase; color: #718096; margin-top: 0; margin-bottom: 8px; letter-spacing: 0.5px;">Recipient Info</h3>
                        <p style="font-size: 13px; margin: 0 0 4px 0; color: #2d3748;"><strong>${recipientName}</strong></p>
                        <p style="font-size: 13px; margin: 0 0 4px 0; color: #4a5568;">${shipping.townCity || ""}, ${shipping.province || ""} ${shipping.zipCode || ""}</p>
                        <p style="font-size: 13px; margin: 0; color: #4a5568;">📞 ${shipping.phone || "N/A"}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 10px 40px 20px 40px;">
                  <h3 style="font-size: 13px; text-transform: uppercase; color: #718096; margin-top: 0; margin-bottom: 12px; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Order Items</h3>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
                    <thead>
                      <tr style="color: #718096; font-weight: 600;">
                        <th align="left" style="padding-bottom: 8px;">Item</th>
                        <th align="center" style="padding-bottom: 8px;">Qty</th>
                        <th align="right" style="padding-bottom: 8px;">Price</th>
                        <th align="right" style="padding-bottom: 8px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                      <tr>
                        <td colspan="2">&nbsp;</td>
                        <td align="right" style="padding: 16px 8px 10px 8px; font-weight: bold; color: #4a5568; border-top: 2px solid #e2e8f0;">Grand Total</td>
                        <td align="right" style="padding: 16px 8px 10px 8px; font-weight: bold; color: #B88E2F; font-size: 16px; border-top: 2px solid #e2e8f0;">${formatCurrency(order.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              ${extraSectionsHtml}

              <!-- Footer / Support -->
              <tr>
                <td style="background-color: #333333; color: #ffffff; padding: 24px 40px; text-align: center;">
                  <p style="font-size: 13px; margin: 0 0 8px 0;">Need assistance? Reply directly or contact us at <a href="mailto:${supportEmail}" style="color: #FAF3EA; text-decoration: underline;">${supportEmail}</a></p>
                  <p style="font-size: 11px; color: #a0aec0; margin: 0;">&copy; 2026 Furniro. Luxury Furniture & Living.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Universal email dispatcher based on order status
 */
const sendOrderStatusNotification = async (order, previousStatus = null) => {
  try {
    if (!order || !order.shippingAddress || !order.shippingAddress.email) {
      console.warn("⚠️ Cannot send status email: Missing recipient email or order details.");
      return;
    }

    const recipientEmail = order.shippingAddress.email;
    const recipientName = `${order.shippingAddress.firstName || ""} ${order.shippingAddress.lastName || ""}`.trim() || "Customer";
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Furniro <onboarding@resend.dev>";
    
    // Normalize status string
    let rawStatus = String(order.status || "").toLowerCase().trim();
    if (rawStatus === "refund") rawStatus = "refunded";
    if (rawStatus === "replace") rawStatus = "replaced";
    if (rawStatus === "exchange") rawStatus = "exchange_requested";
    if (rawStatus === "return") rawStatus = "returned";
    const status = rawStatus;

    let subject = "";
    let emailHtml = "";

    switch (status) {
      // 🟢 1. Paid / Order Placed
      case "paid":
        subject = `Your Furniro Order Confirmation [#${order.razorpayOrderId}]`;
        emailHtml = buildFurniroEmailHtml({
          title: "Order Confirmation",
          badgeText: "Order Confirmed",
          badgeColor: "#2ecc71",
          introTitle: `Thank you for your purchase, ${recipientName}!`,
          introBody: "We have received your payment and our team is preparing your handcrafted furniture items for warehouse dispatch.",
          highlightBoxHtml: `
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px 18px; color: #166534;">
              <p style="margin: 0; font-size: 14px;"><strong>Estimated Delivery Window:</strong> ${getDeliveryRangeString(order.createdAt, 5, 7)}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #15803d;">Standard insured white-glove furniture delivery.</p>
            </div>
          `,
          order,
        });
        break;

      // 📦 2. Dispatched
      case "dispatched":
        subject = `Order Dispatched: Your Furniro Order [#${order.razorpayOrderId}] Is Ready 📦`;
        emailHtml = buildFurniroEmailHtml({
          title: "Order Dispatched",
          badgeText: "Warehouse Dispatched 📦",
          badgeColor: "#3498db",
          introTitle: `Great news, ${recipientName}!`,
          introBody: "Your order has been inspected, carefully packed, and dispatched from our fulfillment center to our logistics partner.",
          highlightBoxHtml: `
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 14px 18px; color: #1e40af;">
              <p style="margin: 0; font-size: 14px;"><strong>Status:</strong> Dispatched from Warehouse</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #2563eb;">You will receive live tracking information as soon as transit begins.</p>
            </div>
          `,
          order,
        });
        break;

      // 🚚 3. Shipped / In Transit
      case "shipped":
        subject = `Your Furniro Order [#${order.razorpayOrderId}] Has Shipped! 🚚`;
        emailHtml = buildFurniroEmailHtml({
          title: "Order Shipped",
          badgeText: "Shipped & In Transit 🚚",
          badgeColor: "#9b59b6",
          introTitle: `Your order is on the way, ${recipientName}!`,
          introBody: "Your furniture shipment is currently in transit with our logistics carrier.",
          highlightBoxHtml: `
            <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 16px; color: #6b21a8;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase;">Tracking Details</h4>
              <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Courier Partner:</strong> ${order.courierPartner || "Furniro Express Freight"}</p>
              <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Tracking Number:</strong> <span style="font-family: monospace; font-weight: 700; color: #7e22ce;">${order.trackingNumber || "Assigned on Transit"}</span></p>
              <p style="margin: 0; font-size: 13px;"><strong>Estimated Delivery:</strong> ${getDeliveryRangeString(order.createdAt, 2, 4)}</p>
            </div>
          `,
          order,
        });
        break;

      // 🛵 4. Out for Delivery
      case "out_for_delivery":
        subject = `Out for Delivery Today: Your Furniro Order [#${order.razorpayOrderId}] 🛵`;
        emailHtml = buildFurniroEmailHtml({
          title: "Out for Delivery",
          badgeText: "Out for Delivery Today 🛵",
          badgeColor: "#e67e22",
          introTitle: `Arriving today, ${recipientName}!`,
          introBody: "Our local delivery team has loaded your order and will arrive at your address today.",
          highlightBoxHtml: `
            <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 14px 18px; color: #92400e;">
              <p style="margin: 0; font-size: 14px;"><strong>Delivery Destination:</strong> ${order.shippingAddress.streetAddress}, ${order.shippingAddress.townCity}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #b45309;">Please ensure an authorized person is available at 📞 ${order.shippingAddress.phone} to inspect and receive the package.</p>
            </div>
          `,
          order,
        });
        break;

      // ✅ 5. Delivered
      case "delivered":
        subject = `Delivered: Your Furniro Order [#${order.razorpayOrderId}] Has Arrived! ✅`;
        emailHtml = buildFurniroEmailHtml({
          title: "Order Delivered",
          badgeText: "Delivered Successfully ✅",
          badgeColor: "#27ae60",
          introTitle: `Welcome home to luxury, ${recipientName}!`,
          introBody: "Your order has been officially delivered. We hope your new furniture transforms your living space.",
          highlightBoxHtml: `
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px 18px; color: #166534;">
              <p style="margin: 0; font-size: 14px; font-weight: 600;">✨ 30-Day Hassle-Free Returns & Warranty Coverage</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #15803d;">If you need assistance with assembly, maintenance, or returns, our support team is always here for you.</p>
            </div>
          `,
          order,
        });
        break;

      // ❌ 6. Cancelled
      case "cancelled":
        subject = `Order Cancellation Notice: [#${order.razorpayOrderId}] ❌`;
        emailHtml = buildFurniroEmailHtml({
          title: "Order Cancelled",
          badgeText: "Order Cancelled ❌",
          badgeColor: "#e74c3c",
          introTitle: `Order Cancellation, ${recipientName}`,
          introBody: "Your order has been cancelled as requested.",
          highlightBoxHtml: `
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 14px 18px; color: #991b1b;">
              <p style="margin: 0; font-size: 13px;"><strong>Cancellation Reason:</strong> ${order.cancellationReason || "Cancelled by admin/customer support"}</p>
              ${order.refundId ? `<p style="margin: 6px 0 0 0; font-size: 13px;"><strong>Refund Status:</strong> Full refund of ${formatCurrency(order.refundAmount || order.totalAmount)} initiated (Ref: <span style="font-family: monospace;">${order.refundId}</span>). Takes 3-5 business days.</p>` : ""}
            </div>
          `,
          order,
        });
        break;

      // 💰 7. Refunded
      case "refunded":
        subject = `Refund Processed: ${formatCurrency(order.refundAmount || order.totalAmount)} for Order [#${order.razorpayOrderId}] 💰`;
        emailHtml = buildFurniroEmailHtml({
          title: "Refund Processed",
          badgeText: "Refund Issued 💰",
          badgeColor: "#8e44ad",
          introTitle: `Refund Confirmation, ${recipientName}`,
          introBody: `A refund of <strong>${formatCurrency(order.refundAmount || order.totalAmount)}</strong> has been successfully processed for your order.`,
          highlightBoxHtml: `
            <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 14px 18px; color: #6b21a8;">
              <p style="margin: 0; font-size: 13px;"><strong>Refund Transaction ID:</strong> <span style="font-family: monospace;">${order.refundId || "Razorpay Direct Refund"}</span></p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #7e22ce;">Funds will reflect in your original payment method (Bank/UPI/Card) within 3-5 banking days.</p>
            </div>
          `,
          order,
        });
        break;

      // 🔄 8. Return Requested
      case "return_requested":
        subject = `Return Request Received for Order [#${order.razorpayOrderId}] 🔄`;
        emailHtml = buildFurniroEmailHtml({
          title: "Return Request Received",
          badgeText: "Return In Review 🔄",
          badgeColor: "#d97706",
          introTitle: `We've received your return request, ${recipientName}`,
          introBody: "Your return request is currently being reviewed by our support team. We will schedule a courier pickup once approved.",
          highlightBoxHtml: `
            <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 14px 18px; color: #92400e;">
              <p style="margin: 0; font-size: 13px;"><strong>Return Reason:</strong> ${order.returnReason || "Customer Return Request"}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #b45309;">Please keep items in original packaging with tags intact for pickup verification.</p>
            </div>
          `,
          order,
        });
        break;

      // ↩️ 9. Returned (Item returned & accepted)
      case "returned":
        subject = `Return Completed: Order [#${order.razorpayOrderId}] ↩️`;
        emailHtml = buildFurniroEmailHtml({
          title: "Return Completed",
          badgeText: "Item Returned ↩️",
          badgeColor: "#059669",
          introTitle: `Return Processed, ${recipientName}`,
          introBody: "We have received and verified your returned furniture items at our fulfillment facility.",
          highlightBoxHtml: `
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 14px 18px; color: #065f46;">
              <p style="margin: 0; font-size: 13px; font-weight: 600;">Return verification approved.</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #047857;">Any applicable refund or store credit will be issued promptly to your original payment method.</p>
            </div>
          `,
          order,
        });
        break;

      // 🔁 10. Exchange Requested
      case "exchange_requested":
        subject = `Exchange Request Received for Order [#${order.razorpayOrderId}] 🔁`;
        emailHtml = buildFurniroEmailHtml({
          title: "Exchange Requested",
          badgeText: "Exchange In Progress 🔁",
          badgeColor: "#0284c7",
          introTitle: `Exchange Request Received, ${recipientName}!`,
          introBody: "Your exchange/replacement request has been logged. Our logistics team will contact you to coordinate pickup and replacement shipment.",
          highlightBoxHtml: `
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 14px 18px; color: #0369a1;">
              <p style="margin: 0; font-size: 13px;"><strong>Exchange Details:</strong> ${order.exchangeReason || order.returnReason || "Customer Requested Exchange"}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #0284c7;">A replacement tracking number will be provided as soon as the package is dispatched.</p>
            </div>
          `,
          order,
        });
        break;

      // ✨ 11. Replaced
      case "replaced":
        subject = `Replacement Confirmed: Your Furniro Order [#${order.razorpayOrderId}] ✨`;
        emailHtml = buildFurniroEmailHtml({
          title: "Replacement Fulfilled",
          badgeText: "Replacement Confirmed ✨",
          badgeColor: "#16a085",
          introTitle: `Replacement Scheduled, ${recipientName}!`,
          introBody: "Your replacement item request has been approved and scheduled with our warehouse team.",
          highlightBoxHtml: `
            <div style="background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 14px 18px; color: #115e59;">
              <p style="margin: 0; font-size: 13px;"><strong>Replacement Reason:</strong> ${order.exchangeReason || order.returnReason || "Customer Exchange"}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #0d9488;">New package will be dispatched with complimentary expedited courier.</p>
            </div>
          `,
          order,
        });
        break;

      // ⚠️ 12. Payment Failed
      case "failed":
        subject = `Payment Notice for Order [#${order.razorpayOrderId}] ⚠️`;
        emailHtml = buildFurniroEmailHtml({
          title: "Payment Incomplete",
          badgeText: "Payment Failed ⚠️",
          badgeColor: "#dc2626",
          introTitle: `Action required for your order, ${recipientName}`,
          introBody: "We encountered an issue while processing your payment. Your furniture items are reserved for a limited time.",
          highlightBoxHtml: `
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 14px 18px; color: #991b1b;">
              <p style="margin: 0; font-size: 13px;">You can retry your payment or complete the checkout anytime from your Furniro Order History.</p>
            </div>
          `,
          order,
        });
        break;

      default:
        console.log(`ℹ️ No automated email trigger configured for status: "${status}"`);
        return;
    }

    // Send via Resend or log to console
    const resend = getResendInstance();
    if (resend) {
      console.log(`📡 Sending [${status.toUpperCase()}] email via Resend to ${recipientEmail}...`);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: recipientEmail,
        subject,
        html: emailHtml,
      });

      if (error) {
        console.error(`❌ Resend API error for order #${order.razorpayOrderId} (${status}):`, error);
      } else {
        console.log(`✅ [${status.toUpperCase()}] email sent successfully to ${recipientEmail}. Resend ID: ${data.id}`);
      }
    } else {
      console.log(`\n=================== RESEND DEV EMAIL LOG [${status.toUpperCase()}] ===================`);
      console.log(`TO: ${recipientEmail}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`ORDER ID: ${order.razorpayOrderId}`);
      console.log(`STATUS: ${status}`);
      console.log("=========================================================================\n");
    }
  } catch (err) {
    console.error(`❌ Unhandled exception sending order status email (${order?.status}):`, err);
  }
};

// Aliases for backward compatibility
const sendOrderConfirmationEmail = (order) => sendOrderStatusNotification(order);

module.exports = {
  sendOrderStatusNotification,
  sendOrderConfirmationEmail,
};
