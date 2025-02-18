const path = require('path');
const fs = require('fs');
const open = require('open');

module.exports = async () => {
  const reportPath = path.resolve(__dirname, 'coverage/html-report/report.html');

  console.log(`\n📝 Jest tests finished. Checking for report at: ${reportPath}\n`);

  if (fs.existsSync(reportPath)) {
    console.log('📂 Opening Jest Test Report...');
    await open(reportPath);
  } else {
    console.warn('⚠️ Test report not found! Ensure coverage is generated properly.');
  }
};
