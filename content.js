(function() {
    let tables = document.querySelectorAll('table[data-testid="table"]');
    if (!tables.length) {
        console.warn("No tables found");
        return;
    }

    let allTablesData = [];

    tables.forEach((table, tableIndex) => {
        let tableData = {
            tableIndex: tableIndex,
            tableName: table.querySelector("caption")?.innerText.trim() || `Table ${tableIndex + 1}`,
            rows: []
        };

        let headers = [];
        table.querySelectorAll("thead th").forEach(th => {
            let headerText = th.querySelector("span")?.innerText.trim() || th.innerText.trim();
            headers.push(headerText);
        });

        let rows = table.querySelectorAll("tbody tr");
        rows.forEach(row => {
            let rowData = {};
            let cells = row.querySelectorAll("td");

            cells.forEach((cell, index) => {
                let cellText = cell.innerText.trim();
                rowData[headers[index] || `Column ${index + 1}`] = cellText;
            });

            tableData.rows.push(rowData);
        });

        allTablesData.push(tableData);
    });

    let xpath = "//div[contains(@data-automation-label, 'Session')]";
    let sessionElements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    
    let sessionTexts = [];
    for (let i = 0; i < sessionElements.snapshotLength; i++) {
        sessionTexts.push(sessionElements.snapshotItem(i).innerText.trim());
    }

    chrome.runtime.sendMessage({ tables: allTablesData, periods: sessionTexts });
})();
