const express = require("express");
const cors = require("cors");
const RedsysAPI = require("redsys-api");
const { writeLog } = require("./logger");
const localtunnel = require("localtunnel");
const CONFIG = require("./config");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/payment", (req, res) => {
  const redsys = new RedsysAPI();
  const order = Date.now().toString().slice(-12);

  // Mostrar valores de configuración en consola y log
  const initialPaymentLog = {
    EVENT: "Valores de configuración enviados a Redsys",
    ORDER: order,
    AMOUNT: CONFIG.AMOUNT,
    MERCHANT_CODE: CONFIG.MERCHANT_CODE,
    CURRENCY: CONFIG.CURRENCY,
    TRANSACTION_TYPE: CONFIG.TRANSACTION_TYPE,
    TERMINAL: CONFIG.TERMINAL,
    MERCHANT_URL: CONFIG.MERCHANT_URL,
    URL_OK: CONFIG.URL_OK,
    URL_KO: CONFIG.URL_KO,
    REDSYS_ENDPOINT: CONFIG.REDSYS_ENDPOINT,
    SIGNATURE_VERSION: CONFIG.SIGNATURE_VERSION,
    LOCAL_TUNNEL_SUBDOMAIN: CONFIG.LOCAL_TUNNEL_SUBDOMAIN,
  };

  console.log(initialPaymentLog);
  writeLog(JSON.stringify(initialPaymentLog));

  redsys.setParameter("DS_MERCHANT_AMOUNT", CONFIG.AMOUNT);
  redsys.setParameter("DS_MERCHANT_ORDER", order);
  redsys.setParameter("DS_MERCHANT_MERCHANTCODE", CONFIG.MERCHANT_CODE);
  redsys.setParameter("DS_MERCHANT_CURRENCY", CONFIG.CURRENCY);
  redsys.setParameter("DS_MERCHANT_TRANSACTIONTYPE", CONFIG.TRANSACTION_TYPE);
  redsys.setParameter("DS_MERCHANT_TERMINAL", CONFIG.TERMINAL);
  redsys.setParameter("DS_MERCHANT_MERCHANTURL", CONFIG.MERCHANT_URL);
  redsys.setParameter("DS_MERCHANT_URLOK", CONFIG.URL_OK);
  redsys.setParameter("DS_MERCHANT_URLKO", CONFIG.URL_KO);

  const merchantParameters = redsys.createMerchantParameters();
  const signature = redsys.createMerchantSignature(CONFIG.REDSYS_KEY);

  const formHTML = `
    <html>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="${CONFIG.REDSYS_ENDPOINT}">
          <input type="hidden" name="Ds_SignatureVersion" value="${CONFIG.SIGNATURE_VERSION}" />
          <input type="hidden" name="Ds_MerchantParameters" value="${merchantParameters}" />
          <input type="hidden" name="Ds_Signature" value="${signature}" />
          <noscript><input type="submit" value="Pagar"></noscript>
        </form>
      </body>
    </html>
  `;
  res.send(formHTML);
});

app.post("/notify", (req, res) => {
  console.log("🔔 Notificación recibida de Redsys");

  const redsys = new RedsysAPI();
  const {
    Ds_Signature: receivedSignature,
    Ds_MerchantParameters: merchantParameters,
  } = req.body;

  if (!receivedSignature || !merchantParameters) {
    return res.status(400).send("Faltan parámetros requeridos");
  }

  const expectedSignature = redsys.createMerchantSignatureNotif(
    CONFIG.REDSYS_KEY,
    merchantParameters
  );
  const isValid = expectedSignature === receivedSignature;

  let decodedParams;
  try {
    decodedParams = redsys.decodeMerchantParameters(merchantParameters);
  } catch (err) {
    decodedParams = { error: "No se pudo decodificar los parámetros." };
  }

  const responseCode = parseInt(decodedParams?.Ds_Response || "-1", 10);
  const paymentStatus =
    responseCode >= 0 && responseCode <= 99 ? "AUTORIZADO" : "DENEGADO";

  const message = JSON.stringify({
    event: "Notificación de Redsys recibida",
    receivedSignature,
    expectedSignature,
    isValid,
    paymentStatus,
    responseCode: decodedParams?.Ds_Response || null,
    decodedParams,
  });

  writeLog(message);

  if (!isValid) return res.status(400).send("Firma inválida");
  res.send("OK");
});

app.get("/success", (req, res) => {
  const logEntry =
    "✅ Cliente redirigido a /success - Pago exitoso mostrado en navegador";
  console.log(logEntry);
  writeLog(logEntry);
  writeLog(
    "-------------------------------------------------------------------\n"
  );
  res.send("<h2>Gracias por tu pago. ¡Transacción exitosa!</h2>");
});

app.get("/fail", (req, res) => {
  const logEntry =
    "❌ Cliente redirigido a /fail - Pago cancelado mostrado en navegador";
  console.log(logEntry);
  writeLog(logEntry);
  writeLog(
    "-------------------------------------------------------------------\n"
  );
  res.send("<h2>Lo sentimos. El pago no se ha completado.</h2>");
});

const server = app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  writeLog(
    "-------------------------------------------------------------------\n"
  );
  writeLog(`🟢 Servidor iniciado en http://localhost:${PORT}`);
  try {
    const tunnel = await localtunnel({
      port: PORT,
      subdomain: CONFIG.LOCAL_TUNNEL_SUBDOMAIN,
    });
    console.log(`🌐 LocalTunnel disponible en: ${tunnel.url}`);
    writeLog(`🌐 LocalTunnel disponible en: ${tunnel.url}`);

    tunnel.on("close", () => {
      console.log("🚪 Tunnel cerrado");
      writeLog("🚪 Tunnel cerrado");
    });

    const shutdown = () => {
      tunnel.close();
      server.close(() => {
        console.log("🛑 Servidor cerrado");
        writeLog("🛑 Servidor cerrado");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("❌ Error iniciando LocalTunnel:", err);
    writeLog("❌ Error iniciando LocalTunnel");
  }
});
