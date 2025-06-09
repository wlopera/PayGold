const RedsysAPI = require("redsys-api");

var redsys = new RedsysAPI();

// Add some Parameters
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

var key = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";

var params = redsys.createMerchantParameters();
var signature = redsys.createMerchantSignature(key);
// console.log(`
//         <!DOCTYPE html>
//         <html>

//         <head>
//             <title>Test</title>
//         </head>

//         <body>
//             <form action="https://sis-t.redsys.es:25443/sis/realizarPago" method="POST" accept-charset="UTF-8">
//                 <div>
//                 	<input type="text" name="Ds_SignatureVersion" value="HMAC_SHA256_V1" />
//             	</div>
//             	<div>
//                 	<input type="text" name="Ds_MerchantParameters" value="${params}" />
//                 </div>
//                 <div>
//                 	<input type="text" name="Ds_Signature" value="${signature}" />
//                 </div>
//                 <input type="submit" value="Submit" />
//             </form>
//         </body>

//         </html>`);

return `
        <!DOCTYPE html>
        <html>
 
        <head>
            <title>Test</title>
        </head>
 
        <body>
            <form action="https://sis-t.redsys.es:25443/sis/realizarPago" method="POST" accept-charset="UTF-8">
                <div>
                	<input type="text" name="Ds_SignatureVersion" value="HMAC_SHA256_V1" />
            	</div>
            	<div>
                	<input type="text" name="Ds_MerchantParameters" value="${params}" />
                </div>
                <div>
                	<input type="text" name="Ds_Signature" value="${signature}" />
                </div>
                <input type="submit" value="Submit" />
            </form>
        </body>
 
        </html>`;
