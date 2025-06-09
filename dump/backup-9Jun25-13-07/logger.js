// logger.js
const fs = require("fs");
const path = require("path");

const LOG_PATH = path.join(__dirname, "payment.log");

function writeLog(entry) {
  const timestamp = new Date().toISOString();
  const log = `\n[${timestamp}]\n${entry}\n------------------------------------------------\n`;
  fs.appendFile(LOG_PATH, log, (err) => {
    if (err) console.error("❌ Error escribiendo log:", err);
  });
}

module.exports = { writeLog };
