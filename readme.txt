------------------------------------------------------------------------------------------------------------
LIBRERIAS:
------------------------------------------------------------------------------------------------------------
npm install cors        // Permite que tu backend acepte solicitudes de diferentes dominios, lo cual es común cuando el frontend y backend están separados.
npm install express     // Facilita la creación de rutas, manejo de solicitudes/respuestas, middleware, etc.
npm install nodemon     // Evita que tengas que parar y reiniciar manualmente el servidor cada vez que modificas el código.
npm install redsys-ap   // Facilita la integración con la pasarela de pagos Redsys para generar y validar peticiones y respuestas de pago.
npm install -g localtunnel  // Herramienta que crea una URL pública para acceder a un servidor local

------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
CODIGO
------------------------------------------------------------------------------------------------------------
index.js:  // Codigo principal
------------------------------------------------------------------------------------------------------------
const express = require("express");
const cors = require("cors");
const RedsysAPI = require("redsys-api");

const app = express();
const PORT = 3000;

app.use(cors());

app.use(express.urlencoded({ extended: true })); // Para recibir datos POST (como los de Redsys)

app.get("/payment", (req, res) => {
  const redsys = new RedsysAPI();

  redsys.setParameter("DS_MERCHANT_AMOUNT", "945");
  redsys.setParameter("DS_MERCHANT_ORDER", Date.now().toString().slice(-12));
  redsys.setParameter("DS_MERCHANT_MERCHANTCODE", "139052351");
  redsys.setParameter("DS_MERCHANT_CURRENCY", "978");
  redsys.setParameter("DS_MERCHANT_TRANSACTIONTYPE", "0");
  redsys.setParameter("DS_MERCHANT_TERMINAL", "100");
  redsys.setParameter(
    "DS_MERCHANT_MERCHANTURL",
    "http://localhost:3000/notify"
  );
  redsys.setParameter("DS_MERCHANT_URLOK", "http://localhost:3000/success");
  redsys.setParameter("DS_MERCHANT_URLKO", "http://localhost:3000/fail");

  const key = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";

  const merchantParameters = redsys.createMerchantParameters();
  const signature = redsys.createMerchantSignature(key);

  console.log("Ds_SignatureVersion: ", "HMAC_SHA256_V1");
  console.log("Ds_MerchantParameters: ", merchantParameters);
  console.log("Ds_Signature: ", signature);

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

  res.send(formHTML); // Devuelve HTML para insertar o abrir
});

app.post("/notify", (req, res) => {
  console.log("🔔 Notificación recibida de Redsys");

  const receivedSignature = req.body.Ds_Signature;
  const merchantParameters = req.body.Ds_MerchantParameters;

  // Clave secreta de Redsys (clave de firma SHA256, en base64)
  const key = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";

  // 1. Validar firma
  const expectedSignature = redsys.createResponseSignature(
    key,
    merchantParameters
  );

  if (expectedSignature !== receivedSignature) {
    console.error("❌ Firma no válida. Posible intento de fraude.");
    return res.status(400).send("Firma inválida");
  }

  // 2. Decodificar los parámetros
  const decodedParams = redsys.decodeMerchantParameters(merchantParameters);
  console.log("📝 Parámetros recibidos:", decodedParams);

  // 3. Comprobar si el pago fue autorizado
  const responseCode = parseInt(decodedParams.Ds_Response, 10);
  if (responseCode >= 0 && responseCode <= 99) {
    console.log("✅ Pago AUTORIZADO con código:", responseCode);
    // Aquí puedes actualizar tu base de datos, marcar pedido como pagado, etc.
  } else {
    console.warn("⚠️ Pago NO autorizado. Código de respuesta:", responseCode);
    // Aquí puedes registrar intento fallido, enviar alertas, etc.
  }

  res.send("OK");
});

app.get("/success", (req, res) => {
  console.log("✅ Pago realizado con éxito (navegador del cliente)");
  res.send("<h2>Gracias por tu pago. ¡Transacción exitosa!</h2>");
});

app.get("/fail", (req, res) => {
  console.log("❌ Pago cancelado o fallido (navegador del cliente)");
  res.send("<h2>Lo sentimos. El pago no se ha completado.</h2>");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

------------------------------------------------------------------------------------------------------------


------------------------------------------------------------------------------------------------------------
payment.html:     // Pagina HTML para realizar la consulta
------------------------------------------------------------------------------------------------------------
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8" />
    <title>Pago Redsys Dinámico</title>
</head>

<body>
    <h1>Pagar con Redsys</h1>
    <button id="payBtn">Generar pago</button>
    <div id="formContainer"></div>

    <script>
        document.getElementById('payBtn').addEventListener('click', async () => {
            try {
                const response = await fetch('http://localhost:3000/payment');
                const html = await response.text();

                const container = document.getElementById('formContainer');
                container.innerHTML = html;

                // Ejecuta automáticamente el form si existe
                const form = container.querySelector('form');
                if (form) {
                    form.submit();
                }
            } catch (error) {
                console.error("Error generando el formulario de pago:", error);
            }
        });
    </script>
</body>

</html>
------------------------------------------------------------------------------------------------------------
logger.js:    // Módulo personalizado (no incluido aquí) para guardar logs.
------------------------------------------------------------------------------------------------------------
const fs = require("fs");
const path = require("path");

const LOG_PATH = path.join(__dirname, "payment.log");

function writeLog(message, level = "INFO") {
  const timestamp = new Date().toISOString();

  // Si el mensaje es un objeto, lo convertimos en string legible
  const msgText =
    typeof message === "string" ? message : JSON.stringify(message);

  const logLine = `${timestamp}: ${level.toUpperCase()} : ${msgText}`;

  // Imprime en consola
  if (level.toLowerCase() === "error") {
    console.error(logLine);
  } else {
    console.log(logLine);
  }

  // Guarda en archivo
  fs.appendFile(LOG_PATH, logLine + "\n", (err) => {
    if (err) {
      const errorLine = `${new Date().toISOString()}: ERROR : Error escribiendo log: ${
        err.message
      }`;
      console.error(errorLine);
    }
  });
}

module.exports = { writeLog };
------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------------------------------------------
config.js:    // Archivo de configuración con parametros a enviar a redsys
------------------------------------------------------------------------------------------------------------
// config.js
module.exports = {
  MERCHANT_CODE: "139052351",
  TERMINAL: "100",
  TRANSACTION_TYPE: "0",
  CURRENCY: "978",
  AMOUNT: "945",
  REDSYS_KEY: "sq7HjrUOBfKmC576ILgskD5srU870gJ7",
  MERCHANT_URL: "https://mipruebalocal.loca.lt/notify",
  URL_OK: "http://localhost:3000/success",
  URL_KO: "http://localhost:3000/fail",
  REDSYS_ENDPOINT: "https://sis-t.redsys.es:25443/sis/realizarPago",
  SIGNATURE_VERSION: "HMAC_SHA256_V1",
  LOCAL_TUNNEL_SUBDOMAIN: "mipruebalocal",
};
------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------


------------------------------------------------------------------------------------------------------------
LEVANTAR EL SERIVIO
------------------------------------------------------------------------------------------------------------
node index.js     o
nodemon index.js  o   
* npm run dev    (este se agrega al package.json)
------------------------------------------------------------------------------------------------------------


------------------------------------------------------------------------------------------------------------
Para probar:
------------------------------------------------------------------------------------------------------------
Mostrar el archivo payment.html en un navegador y probar 
------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------------------------------------------
Abrir el archivo payment.log con los registro de la traza de las peticiones
------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
