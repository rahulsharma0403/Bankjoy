import fs from 'fs';
import path from 'path';

const generateHTMLReportWithAverages = (averages: any[]) => {
  const reportPath = path.join(__dirname, '..', '..','report', 'custom-report-with-averages.html');
  
  // Create HTML content with the individual averages for each currency pair
  const htmlContent = `
    <html>
      <head>
        <title>Custom Report with Averages</title>
      </head>
      <body>
        <h1>API Test Report</h1>
        <table border="1">
          <thead>
            <tr>
              <th>Currency Pair</th>
              <th>Average Exchange Rate</th>
            </tr>
          </thead>
          <tbody>
            ${averages.map((item: any) => `
              <tr>
                <td>${item.currencyPair}</td>
                <td>${item.average.toFixed(4)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  fs.writeFileSync(reportPath, htmlContent);
};

export default generateHTMLReportWithAverages;
