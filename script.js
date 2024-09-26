// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    const compareButton = document.querySelector('.compare-button');
    const txtInput = document.getElementById('txtFile');
    const excelInput = document.getElementById('excelFile');
    const resultDiv = document.getElementById('result');
    const themeToggle = document.getElementById('theme-toggle');

    // Manejar el clic en el botón de comparar
    compareButton.addEventListener('click', () => {
        // Limpiar resultados anteriores
        resultDiv.innerHTML = '';

        // Verificar si se seleccionaron ambos archivos
        if (txtInput.files.length === 0 || excelInput.files.length === 0) {
            alert('Por favor, selecciona ambos archivos antes de comparar.');
            return;
        }

        const txtFile = txtInput.files[0];
        const excelFile = excelInput.files[0];

        // Función para leer el archivo TXT
        const readTxtFile = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const lines = e.target.result.split(/\r?\n/);
                    const cuits = new Set();
                    lines.forEach(line => {
                        const parts = line.split(',');
                        if (parts.length > 0) {
                            const cuit = parts[0].trim();
                            if (/^\d{11}$/.test(cuit)) {
                                cuits.add(cuit);
                            }
                        }
                    });
                    resolve(cuits);
                };
                reader.onerror = function() {
                    reject('Error al leer el archivo TXT.');
                };
                reader.readAsText(file, 'UTF-8');
            });
        };

        // Función para leer el archivo Excel
        const readExcelFile = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});

                    // Asumimos que los datos están en la primera hoja
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, {header: 1});

                    const cuits = new Set();

                    // Encontrar el índice de la columna F (0-based: 5)
                    const columnFIndex = 5;

                    json.forEach((row) => {
                        // Saltar filas vacías o que no tengan la columna F
                        if (row && row.length > columnFIndex && row[columnFIndex]) {
                            let cuitRaw = row[columnFIndex].toString();
                            // Eliminar guiones y espacios
                            let cuitClean = cuitRaw.replace(/-/g, '').trim();
                            if (/^\d{11}$/.test(cuitClean)) {
                                cuits.add(cuitClean);
                            }
                        }
                    });

                    resolve(cuits);
                };
                reader.onerror = function() {
                    reject('Error al leer el archivo Excel.');
                };
                reader.readAsArrayBuffer(file);
            });
        };

        // Leer ambos archivos
        Promise.all([readTxtFile(txtFile), readExcelFile(excelFile)])
            .then(([cuitTxt, cuitExcel]) => {
                // Encontrar intersección
                const coincidencias = [...cuitTxt].filter(cuit => cuitExcel.has(cuit));

                // Mostrar resultados
                if (coincidencias.length > 0) {
                    const successMsg = `<p class="success">Se encontraron ${coincidencias.length} coincidencias de CUIT:</p>`;
                    const list = `<ul>${coincidencias.map(cuit => `<li>${cuit}</li>`).join('')}</ul>`;
                    resultDiv.innerHTML = successMsg + list;
                } else {
                    const failureMsg = `<p class="failure">No se encontraron coincidencias de CUIT entre los archivos.</p>`;
                    resultDiv.innerHTML = failureMsg;
                }
            })
            .catch(error => {
                alert(error);
            });
    });

    // Manejar el cambio de tema
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme', themeToggle.checked);
    });

    // Opcional: Guardar la preferencia de tema en localStorage
    // Cargar el tema preferido al inicio
    if (localStorage.getItem('theme') === 'dark') {
        themeToggle.checked = true;
        document.body.classList.add('dark-theme');
    }

    // Guardar la preferencia al cambiar
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
});