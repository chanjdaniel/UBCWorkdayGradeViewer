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
    const creditsSpan = document.getElementById("included-credits");
    const topAvgGradeSpan = document.getElementById("top-average-grade");
    const nlaCheckbox = document.getElementById("nla-checkbox");
    const creditsInput = document.getElementById('credits-input');

    nlaCheckbox.addEventListener("click", () => {
        const letterGrades = new Set(['A','B','C','D','F']);
        for (let i = 0; i < academicPeriods.length; i++) {
            const courses = academicPeriods[i];

            for (let j = 0; j < courses.length; j++) {
                let course = courses[j];
                if (course.grade && course.grade.length > 0) {
                    if (!letterGrades.has(course.grade[0])) {
                        course.excluded = nlaCheckbox.checked;
                    }
                }
            }
        }
        renderTables();
    })

    document.querySelectorAll(".course-level-checkbox").forEach(button => {
        button.addEventListener("click", (event) => {
            const level = event.target.getAttribute("data");
            for (let i = 0; i < academicPeriods.length; i++) {
                const courses = academicPeriods[i];
    
                for (let j = 0; j < courses.length; j++) {
                    let course = courses[j];
                    const courseName = course.course;
                    const courseNameStrings = courseName.split(" ");
                    const courseCode = courseNameStrings[1];
                    const courseLevel = courseCode[0];
                    if (courseLevel == level) {
                        course.excluded = button.checked;
                    }
                }
            }
            renderTables();
        });
    });

    creditsInput.addEventListener("change", () => {
        calculateAverage();
        renderTables();
    })

    function calculateAverage() {
        const courses = academicPeriods.flat(1);
        const sortedValidGrades = courses.filter(c => !c.excluded).map(c => [c.percentageGrade, c.credits]).sort((a, b) => b[0] - a[0]);
        let sumWeightedGrades = 0;
        let sumCredits = 0;
        let sumTopWeightedGrades = 0;
        let sumTopCredits = 0;
        for (let i = 0; i < sortedValidGrades.length; i++) {
            let percentage = sortedValidGrades[i][0];
            let credits = sortedValidGrades[i][1];
            let weightedGrade = percentage * credits;

            sumWeightedGrades += weightedGrade;
            sumCredits += credits;

            if (sumTopCredits + credits <= creditsInput.value) {
                sumTopWeightedGrades += weightedGrade;
                sumTopCredits += credits;
            }
        }
        
        const avg = sumCredits ? (sumWeightedGrades / sumCredits).toFixed(2) : "N/A";
        avgGradeSpan.innerText = avg;
        creditsSpan.innerText = sumCredits;

        const topAvg = sumTopCredits ? (sumTopWeightedGrades / sumTopCredits).toFixed(2) : "N/A";
        topAvgGradeSpan.innerText = topAvg;
        creditsInput.value = sumTopCredits;
        console.log(sumTopWeightedGrades);
        console.log(sumTopCredits);
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
                const letterGrades = new Set(['A','B','C','D','F']);
                if (nlaCheckbox.checked && course.grade) {
                    if (course.grade.length > 0 && !letterGrades.has(course.grade[0])) {
                        course.excluded = true;
                    }
                }

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
