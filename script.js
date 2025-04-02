let currentIndex = 0; // Índice del registro actual
let rowsData = []; // Array para almacenar los datos de la tabla

function uploadNBIB() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('http://127.0.0.1:5000/convert_nbib', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert("Error: " + data.error);
            return;
        }
        populateTable(data.csvData);
    })
    .catch(error => console.error('Error al enviar archivo:', error));
}

function populateTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td> <!-- Número de fila -->
            <td>${row.PMID || 'N/A'}</td>
            <td>${row.TI || 'N/A'}</td>
            <td>${row.AU || 'N/A'}</td>
            <td>${row.YYYY || 'N/A'}</td>
            <td>${row.MMM || 'N/A'}</td>
            <td>${row.AB || 'N/A'}</td>
            <td>${row.JT || 'N/A'}</td>
            <td>${row.PT || 'N/A'}</td>
            <td>${row.DP || 'N/A'}</td>
            <td>${row.DOI || 'N/A'}</td>
            <td><a href="${row.URL || '#'}" target="_blank">${row.URL || 'N/A'}</a></td>
            <td><button onclick="showAnalysis('${index + 1}','${row.PMID}', '${row.TI}', '${row.URL}', '${row.AB}')">Análisis</button></td>
            <!-- Columna de Inclusión con un select -->
            <td id="inclusion-${index + 1}">
                <select onchange="saveInclusionStatus(${index}, this)">
                    <option value="N/A" ${localStorage.getItem(`inclusion-${index}`) === 'N/A' ? 'selected' : ''}>N/A</option>
                    <option value="incluido" ${localStorage.getItem(`inclusion-${index}`) === 'incluido' ? 'selected' : ''}>Incluido</option>
                    <option value="excluido" ${localStorage.getItem(`inclusion-${index}`) === 'excluido' ? 'selected' : ''}>Excluido</option>
                </select>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    updateNavigationButtons();
}

// Función para abrir la nueva pestaña con los datos del análisis
function showAnalysis(index, pmid, ti, url, ab) {
    console.log("index:", index, "pmid:", pmid, "ti:", ti, "url:", url, "ab:", ab);

    const ifa = document.getElementById('nombreIFA').value;
    const indicacion = document.getElementById('indicacion').value;

    const abTemplate = `
        <p>Para el artículo con PMID: ${pmid}, del siguiente párrafo que corresponde a un abstract de artículo científico indica si evalúa la eficacia y/o seguridad de <strong>${ifa}</strong> en <strong>${indicacion}</strong>, dar los resultados en español.</p>
        <p>En caso de que sí evalúe algún aspecto de eficacia, efectividad o seguridad, extraer lo siguiente:</p>
        <ul>
            <li>1- Tipo de estudio</li>
            <li>2- Objetivo, población estudiada y brazos de tratamiento</li>
            <li>3- Lista de resultados con sus datos numéricos por cada outcome medido (a modo de párrafo resumido)</li>
            <li>4- Qué se puede concluir del estudio</li>
        </ul>
        <p>Si el artículo no describe ningún aspecto de eficacia, efectividad o seguridad, indica que será excluido y el motivo de exclusión.</p>
        <p>${ab}</p>
    `;

    // Guardar los datos en sessionStorage
    sessionStorage.setItem("analysisData", JSON.stringify({ index, pmid, ti, url, ab: abTemplate }));

    // Abrir la nueva pestaña sin parámetros largos
    window.open(`analysis.html`, '_blank', 'width=1200,height=800');
}

// Fucnion que carga los datos en analysis.html
document.addEventListener("DOMContentLoaded", function () {
    console.log("Página analysis.html cargada.");
    
    if (document.getElementById("analysis-container")) {
        // Obtener datos desde sessionStorage
        const params = JSON.parse(sessionStorage.getItem("analysisData") || "{}");

        if (Object.keys(params).length > 0) {
            document.getElementById("index").textContent = params.index || "";
            document.getElementById("pmid").textContent = params.pmid || "";
            document.getElementById("ti").textContent = params.ti || "";
            document.getElementById("url").href = params.url || "#";
            document.getElementById("url").textContent = params.url || "Enlace no disponible";
            document.getElementById("ab").innerHTML = params.ab || "Sin contenido";
        } else {
            console.warn("No se encontraron datos en sessionStorage.");
        }
    }
});
