document.getElementById("extract").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["content.js"]
        });
    });
});

chrome.runtime.onMessage.addListener((message) => {

    const periods = message.periods;
    const tables = message.tables;

    let academicPeriods = [];

    for (let i = 0; i < tables.length; i++) {
        let courses = [];
        let rows = tables[i].rows;
        for (let j = 0; j < rows.length; j++) {
            let row = rows[j];
            if (row["Course"] != "") {
                let course = { course: row["Course"], grade: row["Grade"], percentageGrade: Number(row["Percentage Grades"]) || 0, credits: Number(row["Credits"]) || 0, excluded: false };
                courses.push(course);
            }
        }
        academicPeriods.push(courses);
    }

    const tableBody = document.getElementById("course-table");

    const tableContainer = document.getElementById("table-container");
    const avgGradeSpan = document.getElementById("average-grade");

    function calculateAverage() {
        const courses = academicPeriods.flat(1);
        const validWeightedGrades = courses.filter(c => !c.excluded).map(c => c.percentageGrade * c.credits);
        const sumWeightedGrades = validWeightedGrades.length ? validWeightedGrades.reduce((a, b) => a + b, 0) : 0;
        const validCredits = courses.filter(c => !c.excluded).map(c => c.credits);
        const sumCredits = validCredits.length ? validCredits.reduce((a, b) => a + b, 0) : 0;
        const avg = sumCredits ? (sumWeightedGrades / sumCredits).toFixed(2) : "N/A";
        avgGradeSpan.innerText = avg;
    }

    function renderTables() {

        tableContainer.innerHTML = "";
        academicPeriods.forEach((courses, apIndex) => {
            const container = document.createElement("div");
            container.className = "grades-container";
            const title = document.createElement("div");
            title.innerHTML = `
            <h3>${periods[apIndex]}</h3>
            <button class="period-toggle-btn" data-index="${apIndex}">
                ${courses.every(obj => obj.excluded === false) ? "Include" : "Exclude"}
            </button>
            `;
            title.className = "table-title";
            container.appendChild(title);
            const table = document.createElement("table");
            const tableHead = document.createElement("thead");
            tableHead.innerHTML = `
                <tr>
                    <th>Course</th>
                    <th>Grade</th>
                    <th>Percentage</th>
                    <th>Credits</th>
                    <th>Exclude</th>
                </tr>
            `;
            table.appendChild(tableHead);

            const tableBody = document.createElement("tbody");
            courses.forEach((course, index) => {
                const row = document.createElement("tr");
                if (course.excluded) row.classList.add("excluded");
    
                row.innerHTML = `
                    <td class="course-column">${course.course}</td>
                    <td>${course.grade}</td>
                    <td>${course.percentageGrade}</td>
                    <td>${course.credits}</td>
                    <td>
                        <button class="toggle-btn" period-index="${apIndex}" data-index="${index}">
                            ${course.excluded ? "Include" : "Exclude"}
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            table.appendChild(tableBody);
            container.appendChild(table);
            tableContainer.appendChild(container);
        });

        document.querySelectorAll(".toggle-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                const periodIndex = event.target.getAttribute("period-index");
                const index = event.target.getAttribute("data-index");
                academicPeriods[periodIndex][index].excluded = !academicPeriods[periodIndex][index].excluded;
                renderTables();
            });
        });

        document.querySelectorAll(".period-toggle-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                const index = event.target.getAttribute("data-index");
                academicPeriods[index].forEach(obj => obj.excluded = !obj.excluded);
                renderTables();
            });
        });

        calculateAverage();
    }

    renderTables();
});
