import zipfile
import xml.etree.ElementTree as ET

docx_path = 'HomeChef_Development_Brief.docx'
with zipfile.ZipFile(docx_path, 'r') as z:
    xml_content = z.read('word/document.xml')

root = ET.fromstring(xml_content)

paragraphs = []
for para in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
    texts = []
    for run in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
        if run.text:
            texts.append(run.text)
    line = ''.join(texts).strip()
    if line:
        paragraphs.append(line)

with open('brief_output.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(paragraphs))
print('Done -', len(paragraphs), 'paragraphs extracted')
