from flask import Flask, request, jsonify
import csv
import re
from Bio import Medline
from flask_cors import CORS
import io

app = Flask(__name__)
CORS(app)  # Habilitar CORS para permitir solicitudes desde el frontend

# Función para limpiar el texto y escapar caracteres especiales
def clean_text(text):
    if not text:
        return ''
    cleaned_text = re.sub(r'[\n\r"]', ' ', text)  # Remueve saltos de línea, retornos de carro y comillas
    cleaned_text = cleaned_text.replace(';', ',')  # Reemplaza punto y coma por coma
    return cleaned_text.strip()

# Función para extraer solo el año del campo DP
def extract_year(dp):
    if not dp:
        return ''
    match = re.search(r'\d{4}', dp)
    return match.group(0) if match else ''

# Función para extraer el mes del campo DP
def extract_month(dp):
    if not dp:
        return ''
    match = re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', dp)
    return match.group(0) if match else ''

# Función para extraer el DOI
def extract_doi(record):
    doi_fields = ['LID', 'AID']
    for field in doi_fields:
        if field in record:
            entries = record[field] if isinstance(record[field], list) else [record[field]]
            for entry in entries:
                if '[doi]' in entry:
                    return entry.split('[doi]')[0].strip()
    return ''

# Función para procesar el archivo .nbib y convertirlo a JSON
def procesar_nbib(file):
    records = Medline.parse(io.StringIO(file.read().decode('utf-8')))
    data = []

    for record in records:
        pmid = record.get('PMID', '')
        title = clean_text(record.get('TI', ''))
        authors = clean_text(', '.join(record.get('AU', [])))
        year = extract_year(record.get('DP', ''))
        month = extract_month(record.get('DP', ''))
        abstract = clean_text(record.get('AB', ''))
        journal = clean_text(record.get('JT', ''))
        article_type = clean_text(', '.join(record.get('PT', [])))
        date_of_publication = record.get('DP', '')
        doi = extract_doi(record)
        url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else ''

        data.append({
            "PMID": pmid,
            "TI": title,
            "AU": authors,
            "YYYY": year,
            "MMM": month,
            "AB": abstract,
            "JT": journal,
            "PT": article_type,
            "DP": date_of_publication,
            "DOI": doi,
            "URL": url
        })

    return data

@app.route('/convert_nbib', methods=['POST'])
def convert_nbib():
    if 'file' not in request.files:
        return jsonify({"error": "No se ha subido un archivo"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Archivo no válido"}), 400

    try:
        datos_csv = procesar_nbib(file)
        return jsonify({"csvData": datos_csv})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
