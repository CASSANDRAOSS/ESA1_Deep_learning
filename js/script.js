// ==========================================
// ml5 Image Classification – neue API
// ==========================================

let classifier;
let userImage;
let userChart = null; // WICHTIG: Chart-Instanz speichern

window.onload = async () => {

    // ============================
    // MENÜ-NAVIGATION
    // ============================

    const menuButtons = document.querySelectorAll(".menu-btn");
    const submenus = document.querySelectorAll(".submenu");

    menuButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.target;

            submenus.forEach(m => m.classList.remove("active"));
            document.getElementById(target).classList.add("active");
            document.getElementById(target).scrollIntoView({ behavior: "smooth" });
        });
    });

    // ============================
    // Hilfe-Text ein-/ausblenden
    // ============================

    const helpBtn = document.getElementById("help-btn");
    const helpText = document.getElementById("help-text");

    if (helpBtn && helpText) {
        helpBtn.addEventListener("click", () => {
            helpText.classList.toggle("hidden");
        });
    }

    // ============================
    // AKKORDEON
    // ============================

    document.querySelectorAll(".accordion-header").forEach(header => {
        header.addEventListener("click", () => {
            const content = header.nextElementSibling;

            if (content.classList.contains("open")) {
                content.classList.remove("open");
                content.style.maxHeight = null;
                return;
            }

            document.querySelectorAll(".accordion-content").forEach(c => {
                c.classList.remove("open");
                c.style.maxHeight = null;
            });

            content.classList.add("open");
            content.style.maxHeight = "600px";

            setTimeout(() => {
                content.style.maxHeight = content.scrollHeight + "px";
            }, 100);
        });
    });

    // ============================
    // HTML-Elemente für Upload
    // ============================

    const dropZone = document.getElementById('drop-zone');
    const uploadInput = document.getElementById('upload-input');
    userImage = document.getElementById('user-image');
    const classifyBtn = document.getElementById('classify-btn');
    const deleteBtn = document.getElementById('delete-image-btn');

    const loadingText = document.getElementById("loading-text");
    const userEvaluation = document.getElementById("user-evaluation");

    // Beispielbilder
    const correctImages = [
        'images/richtig3.jpg',
        'images/richtig2.jpg',
        'images/richtig3.png'
    ];
    const wrongImages = [
        'images/falsch1.jpg',
        'images/falsch2.jpg',
        'images/falsch3.jpg'
    ];

    // ------------------------------
    // ml5 Modell laden
    // ------------------------------

    console.log("Lade MobileNet...");
    classifier = await ml5.imageClassifier('MobileNet');
    console.log("Modell geladen!");

    classifyExamples(correctImages, 'correct-images');
    classifyExamples(wrongImages, 'wrong-images');

    // ------------------------------
    // Drag-and-Drop
    // ------------------------------

    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            handleFile(file);
        });
    }

    // ------------------------------
    // Datei-Upload
    // ------------------------------

    if (uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            handleFile(file);
        });
    }

    // ------------------------------
    // Nutzerbild klassifizieren
    // ------------------------------

    if (classifyBtn) {
        classifyBtn.addEventListener('click', async () => {

            if (!userImage.src || userImage.src === window.location.href) {
                alert("Bitte zuerst ein Bild hochladen!");
                return;
            }

            loadingText.classList.remove("hidden");

            await new Promise(resolve => {
                if (userImage.complete) resolve();
                else userImage.onload = resolve;
            });

            const canvas = document.getElementById('user-chart');

            // WICHTIG: altes Diagramm zerstören
            if (userChart) {
                userChart.destroy();
                userChart = null;
            }

            const results = await classifier.classify(userImage);

            // Diagramm erzeugen
            userChart = createChart(results, canvas);

            const top = results[0];

            // Rahmenfarbe
            if (top.confidence >= 0.7) {
                userImage.style.borderColor = "green";
            } else if (top.confidence >= 0.3) {
                userImage.style.borderColor = "gold";
            } else {
                userImage.style.borderColor = "red";
            }

            // Einschätzung
            let evaluation = "";
            if (top.confidence >= 0.7) {
                evaluation = "Die Prozentzahl ist sehr hoch. Die Klassifikation ist wahrscheinlich korrekt";
            } else if (top.confidence >= 0.3) {
                evaluation = "Das Modell ist unsicher. Die Klassifikation könnte stimmen.";
            } else {
                evaluation = "Die Wahrscheinlichkeit ist sehr gering. Die Klassifikation ist vermutlich nicht korrekt.";
            }

            userEvaluation.textContent = evaluation;

            loadingText.classList.add("hidden");
        });
    }

    // ------------------------------
    // Bild löschen
    // ------------------------------

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {

            // Bild zurücksetzen
            userImage.src = "";
            userImage.style.borderColor = "#ccc";
            userImage.onload = null;

            // Diagramm zerstören
            if (userChart) {
                userChart.destroy();
                userChart = null;
            }

            // Einschätzung löschen
            userEvaluation.textContent = "";

            // Ladeanzeige zurücksetzen
            loadingText.classList.add("hidden");

            // Dateiname löschen
            uploadInput.value = "";
        });
    }
};

// ==========================================
// Funktion: Beispielbilder klassifizieren
// ==========================================

async function classifyExamples(imageList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    for (const src of imageList) {

        const row = document.createElement('div');
        row.classList.add('example-row');
        container.appendChild(row);

        const img = document.createElement('img');
        img.src = src;
        row.appendChild(img);

        const loading = document.createElement("p");
        loading.textContent = "Modell lädt… bitte warten.";
        loading.style.fontStyle = "italic";
        row.appendChild(loading);

        img.onload = async () => {
            const results = await classifier.classify(img);

            loading.remove();

            const chartContainer = document.createElement("div");
            chartContainer.classList.add("chart-container");
            row.appendChild(chartContainer);

            const canvas = document.createElement('canvas');
            chartContainer.appendChild(canvas);

            createChart(results, canvas);

            const top = results[0];
            const sentence = document.createElement("p");
            sentence.classList.add("result-sentence");
            sentence.textContent =
                `Das Modell erkennt in diesem Bild am wahrscheinlichsten: ${top.label} (${(top.confidence * 100).toFixed(2)}%).`;

            chartContainer.appendChild(sentence);

            if (src.includes('richtig')) img.style.borderColor = 'green';
            if (src.includes('falsch')) img.style.borderColor = 'red';
        };
    }
}

// ==========================================
// Funktion: Diagramm erstellen
// ==========================================

function createChart(results, canvas) {
    const labels = results.map(r => r.label);
    const data = results.map(r => (r.confidence * 100).toFixed(2));

    return new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Confidence (%)',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

// ==========================================
// Funktion: Nutzerbild laden
// ==========================================

function handleFile(file) {
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert("Nur JPG oder PNG Dateien erlaubt!");
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        // Bild-URL mit Zeitstempel
        userImage.src = reader.result + "#" + new Date().getTime();
        userImage.onload = null;
    
    };

    reader.readAsDataURL(file); 
}
