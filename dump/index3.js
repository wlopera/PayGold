const express = require("express");
const RedsysAPI = require("redsys-api");

const app = express();

app.get("/pago", (req, res) => {
  const redsys = new RedsysAPI();

  redsys.setParameter("DS_MERCHANT_AMOUNT", 945);
  redsys.setParameter("DS_MERCHANT_ORDER", "123456789101");
  redsys.setParameter("DS_MERCHANT_MERCHANTCODE", "343801064");
  redsys.setParameter("DS_MERCHANT_CURRENCY", "978");
  redsys.setParameter("DS_MERCHANT_TRANSACTIONTYPE", "0");
  redsys.setParameter("DS_MERCHANT_TERMINAL", "1");
  redsys.setParameter("DS_MERCHANT_MERCHANTURL", "http://some_url.com");
  redsys.setParameter("DS_MERCHANT_URLOK", "http://some_other_url.com");
  redsys.setParameter("DS_MERCHANT_URLKO", "http://another_url.com");
  redsys.setParameter("DS_MERCHANT_CONSUMERLANGUAGE", "002");
  redsys.setParameter("DS_MERCHANT_PRODUCTDESCRIPTION", "Some description");

  const key = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";

  const params = redsys.createMerchantParameters();
  const signature = redsys.createMerchantSignature(key);

  const htmlForm = `
    <!DOCTYPE html>
    <html>
      <head><title>Pago Redsys</title></head>
      <body>
        <form action="https://sis-t.redsys.es:25443/sis/realizarPago" method="POST" accept-charset="UTF-8" id="redsysForm">
          <input type="hidden" name="Ds_SignatureVersion" value="HMAC_SHA256_V1" />
          <input type="hidden" name="Ds_MerchantParameters" value="${params}" />
          <input type="hidden" name="Ds_Signature" value="${signature}" />
          <input type="submit" value="Pagar" />
        </form>
        <script>document.getElementById('redsysForm').submit();</script>
      </body>
    </html>`;

  res.send(htmlForm);
});

app.listen(3000, () => {
  console.log("Servidor escuchando en http://localhost:3000");
});
