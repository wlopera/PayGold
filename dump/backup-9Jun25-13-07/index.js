const express = require("express");
const cors = require("cors");
const RedsysAPI = require("redsys-api");
const { writeLog } = require("./logger"); // importamos el logger

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/payment", (req, res) => {
  const redsys = new RedsysAPI();

  const order = Date.now().toString().slice(-12);
  const amount = "945";

  redsys.setParameter("DS_MERCHANT_AMOUNT", amount);
  redsys.setParameter("DS_MERCHANT_ORDER", order);
  redsys.setParameter("DS_MERCHANT_MERCHANTCODE", "139052351");
  redsys.setParameter("DS_MERCHANT_CURRENCY", "978");
  redsys.setParameter("DS_MERCHANT_TRANSACTIONTYPE", "0");
  redsys.setParameter("DS_MERCHANT_TERMINAL", "100");
  redsys.setParameter(
    "DS_MERCHANT_MERCHANTURL",
    "https://mipruebalocal.loca.lt/notify"
  );
  redsys.setParameter("DS_MERCHANT_URLOK", "http://localhost:3000/success");
  redsys.setParameter("DS_MERCHANT_URLKO", "http://localhost:3000/fail");

  const key = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";
  const merchantParameters = redsys.createMerchantParameters();
  const signature = redsys.createMerchantSignature(key);

  // Aquí decodificamos para ver qué contiene
  let decodedParams;
  try {
    decodedParams = redsys.decodeMerchantParameters(merchantParameters);
  } catch (err) {
    decodedParams = { error: "No se pudo decodificar los parámetros." };
  }

  // Guardar el JSON decodificado en el log para estudio
  writeLog(
    `📘 Parámetros antes de enviar a Redsys (decodificados):\n${JSON.stringify(
      decodedParams,
      null,
      2
    )}`
  );

  const logEntry = `
Nuevo intento de pago
Orden: ${order}
Cantidad: ${amount}
MerchantParameters: ${merchantParameters}
Firma generada: ${signature}
Redirigiendo a Redsys...
  `;
  writeLog(logEntry);

  const formHTML = `
    <html>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="https://sis-t.redsys.es:25443/sis/realizarPago">
          <input type="hidden" name="Ds_SignatureVersion" value="HMAC_SHA256_V1" />
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
  const key = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";

  const receivedSignature = req.body.Ds_Signature;
  const merchantParameters = req.body.Ds_MerchantParameters;
  const expectedSignature = redsys.createMerchantSignatureNotif(
    key,
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

  const logEntry = `
📩 Notificación de Redsys recibida
Firma recibida: ${receivedSignature}
Firma esperada: ${expectedSignature}
Firma válida: ${isValid}
Estado del pago: ${paymentStatus}
Código de respuesta: ${decodedParams?.Ds_Response || "N/A"}
Parámetros decodificados:
${JSON.stringify(decodedParams, null, 2)}
  `;
  writeLog(logEntry);

  if (!isValid) return res.status(400).send("Firma inválida");
  res.send("OK");
});

app.get("/success", (req, res) => {
  const logEntry =
    "✅ Cliente redirigido a /success - Pago exitoso mostrado en navegador";
  console.log(logEntry);
  writeLog(logEntry);
  res.send("<h2>Gracias por tu pago. ¡Transacción exitosa!</h2>");
});

app.get("/fail", (req, res) => {
  const logEntry =
    "❌ Cliente redirigido a /fail - Pago cancelado mostrado en navegador";
  console.log(logEntry);
  writeLog(logEntry);
  res.send("<h2>Lo sentimos. El pago no se ha completado.</h2>");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  writeLog(`🟢 Servidor iniciado en http://localhost:${PORT}`);
});
