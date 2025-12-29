import express from "express";

const app = express();

// This builds the Barcodify QR URL
function barcodifyQrUrl(shopDomain, customerId) {
  return `https://select-customer-barcode-prod.herokuapp.com/public-api/v1/barcodes/qr/${encodeURIComponent(
    shopDomain
  )}/${encodeURIComponent(customerId)}`;
}

// This endpoint will be called by Shopify
app.get("/proxy/qr", async (req, res) => {
  try {
    const shop = req.query.shop;
    const customerId = req.query.customer_id;

    if (!shop || !customerId) {
      return res.status(400).send("Missing shop or customer_id");
    }

    const upstream = barcodifyQrUrl(shop, customerId);
    const upstreamRes = await fetch(upstream, { cache: "no-store" });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send("Upstream error");
    }

    const contentType =
      upstreamRes.headers.get("content-type") || "image/png";
    const buf = Buffer.from(await upstreamRes.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(buf);
  } catch (err) {
    res.status(500).send("Proxy error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("QR proxy running on", port));
