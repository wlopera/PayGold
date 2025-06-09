------------------------------------------------------------------------------------------------------------
LIBRERIAS:
------------------------------------------------------------------------------------------------------------
npm install cors        // Permite que tu backend acepte solicitudes de diferentes dominios, lo cual es común cuando el frontend y backend están separados.
npm install express     // Facilita la creación de rutas, manejo de solicitudes/respuestas, middleware, etc.
npm install nodemon     // Evita que tengas que parar y reiniciar manualmente el servidor cada vez que modificas el código.
npm install redsys-api  // Facilita la integración con la pasarela de pagos Redsys para generar y validar peticiones y respuestas de pago.

------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
CODIGO
------------------------------------------------------------------------------------------------------------
index.js:  // Codigo principal
------------------------------------------------------------------------------------------------------------
cconst express = require("express");
const cors = require("cors");

const RedsysAPI = require("redsys-api");
const CONFIG = require("./config");
const config = require("./config");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/payment", (req, res) => {
  const redsys = new RedsysAPI();
  const order = Date.now().toString().slice(-12);

  // Mostrar valores de configuración en consola y log
  console.log({
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
  });

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

app.listen(config.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${CONFIG.PORT}`);
});

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
http://localhost:3000/payment
------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
