const fs = require("fs");
const path = require("path");

const LOG_PATH = path.join(__dirname, "payment.log");

// Limpia el log al iniciar el servidor
function clearLog() {
  fs.writeFileSync(LOG_PATH, "", "utf8"); // Sobrescribe con cadena vacía
}

// Llama a clearLog() justo cuando arranca tu servidor
clearLog();

// Luego aquí el resto del código writeLog, etc.

function formatDate(date) {
  const pad = (n) => (n < 10 ? "0" + n : n);
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const YYYY = date.getFullYear();
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return `${MM}/${DD}/${YYYY} ${HH}:${mm}:${ss}`;
}

function writeLog(message, level = "INFO") {
  const timestamp = formatDate(new Date());
  let msgText;

  if (typeof message === "string") {
    try {
      const parsed = JSON.parse(message);
      msgText = JSON.stringify(parsed, null, 2);
    } catch {
      msgText = message;
    }
  } else {
    msgText = JSON.stringify(message, null, 2);
  }

  const logLine = `${timestamp}: ${level.toUpperCase()} : \n${msgText}\n`;

  if (level.toLowerCase() === "error") {
    console.error(logLine);
  } else {
    console.log(logLine);
  }

  fs.appendFile(LOG_PATH, logLine + "\n", (err) => {
    if (err) {
      const errorLine = `${formatDate(
        new Date()
      )}: ERROR : Error escribiendo log: ${err.message}`;
      console.error(errorLine);
    }
  });
}

module.exports = { writeLog };
