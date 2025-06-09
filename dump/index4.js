const express = require("express");
const cors = require("cors");

const RedsysAPI = require("redsys-api");

const app = express();
const PORT = 3000;

app.use(cors()); // ¡IMPORTANTE! permite peticiones desde cualquier origen

app.get("/payment", (req, res) => {
  const redsys = new RedsysAPI();

  // Aquí usa los datos que necesites, por ejemplo puedes recibirlos por query params o body
  redsys.setParameter("DS_MERCHANT_AMOUNT", "945"); // importe en céntimos (9,45 €)
  redsys.setParameter("DS_MERCHANT_ORDER", "123456789101");
  redsys.setParameter("DS_MERCHANT_MERCHANTCODE", "343801064");
  redsys.setParameter("DS_MERCHANT_CURRENCY", "978");
  redsys.setParameter("DS_MERCHANT_TRANSACTIONTYPE", "0");
  redsys.setParameter("DS_MERCHANT_TERMINAL", "1");
  redsys.setParameter(
    "DS_MERCHANT_MERCHANTURL",
    "http://localhost:3000/notify"
  );
  redsys.setParameter("DS_MERCHANT_URLOK", "http://localhost:3000/success");
  redsys.setParameter("DS_MERCHANT_URLKO", "http://localhost:3000/fail");
  redsys.setParameter("DS_MERCHANT_CONSUMERLANGUAGE", "002");
  redsys.setParameter(
    "DS_MERCHANT_PRODUCTDESCRIPTION",
    "Descripción del producto"
  );

  const key = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";

  const response = {
    url: "https://sis-t.redsys.es:25443/sis/realizarPago",
    merchantParameters: redsys.createMerchantParameters(),
    signature: redsys.createMerchantSignature(key),
    signatureVersion: "HMAC_SHA256_V1",
  };

  res.json(response);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
