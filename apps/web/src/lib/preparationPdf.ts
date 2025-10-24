// src/lib/preparationPdf.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Report } from '@/types/preparation.types';

// 1. Иконки (необходимы для генерации PDF)
const icons = {
    full: {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`,
        color: '#22c55e',
    },
    partial: {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>`,
        color: '#f59e0b',
    },
    none: {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" x2="9" y1="9" y2="15"></line><line x1="9" x2="15" y1="9" y2="15"></line></svg>`,
        color: '#ef4444',
    },
};

// 2. Хелпер для конвертации SVG в PNG
const svgToPng = (svg: string, size: number): Promise<string> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        canvas.width = size;
        canvas.height = size;

        img.onload = () => {
            ctx?.drawImage(img, 0, 0, size, size);
            resolve(canvas.toDataURL('image/png'));
        };
        // btoa() конвертирует строку в Base64. Необходимо для data URL.
        img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
    });
};

// 3. Хелпер для асинхронной загрузки шрифтов
// (Убедись, что шрифты лежат в /public/fonts/Roboto-Regular.ttf и Roboto-Bold.ttf)
async function loadFonts(doc: jsPDF) {
    try {
        // Загрузка обычного шрифта
        const fontResponse = await fetch('/fonts/Roboto-Regular.ttf');
        const fontBlob = await fontResponse.blob();
        const fontData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(fontBlob);
        });
        const fontBase64 = fontData.split(',')[1];
        doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

        // Загрузка жирного шрифта
        const fontBoldResponse = await fetch('/fonts/Roboto-Bold.ttf');
        const fontBoldBlob = await fontBoldResponse.blob();
        const fontBoldData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(fontBoldBlob);
        });
        const fontBoldBase64 = fontBoldData.split(',')[1];
        doc.addFileToVFS('Roboto-Bold.ttf', fontBoldBase64);
        doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    } catch (error) {
        console.error('Не удалось загрузить шрифты. Используются стандартные.', error);
    }
}

// 4. Основная функция экспорта
export const exportPreparationPdf = async (report: Report) => {
    const doc = new jsPDF();
    await loadFonts(doc);

    // Генерируем PNG-версии иконок
    const imagePromises = report.matching_table.map((item) => {
        const iconKey = item.match.toLowerCase() as keyof typeof icons;
        return icons[iconKey]
            ? svgToPng(icons[iconKey].svg, 64) // 64x64 - исходный размер для качества
            : Promise.resolve(null);
    });
    const pngImages = await Promise.all(imagePromises);

    // --- Рендеринг документа ---

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(18);
    doc.text('Предварительная оценка кандидата', 14, 20);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(14);
    doc.text(`${report.first_name || ''} ${report.last_name || ''}`, 14, 30);
    const profileY = 30 + 10;
    doc.setFontSize(12);
    doc.text(
        `Предполагаемый профиль: ${report.candidate_profile}`,
        14,
        profileY,
    );
    const tableTitleY = profileY + 15;
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(14);
    doc.text('Соответствие ключевым критериям', 14, tableTitleY);

    // Таблица
    autoTable(doc, {
        startY: tableTitleY + 5,
        head: [['Критерий', 'Соответствие', 'Пояснение']],
        body: report.matching_table.map((item) => [
            item.criterion,
            '', // Оставляем пустым, т.к. будем рисовать иконку
            item.comment,
        ]),
        theme: 'grid',
        styles: { font: 'Roboto', fontSize: 10, fontStyle: 'normal' },
        headStyles: {
            fillColor: [41, 128, 185], // Темно-синий
            font: 'Roboto',
            fontStyle: 'bold',
            textColor: [255, 255, 255],
        },
        didDrawCell: (data) => {
            // Рисуем наши PNG иконки в ячейках второго столбца
            if (data.section === 'body' && data.column.index === 1) {
                const pngImage = pngImages[data.row.index];
                if (pngImage) {
                    const imgSize = 5; // Размер иконки в PDF (5x5 мм)
                    const x = data.cell.x + (data.cell.width - imgSize) / 2;
                    const y = data.cell.y + (data.cell.height - imgSize) / 2;
                    doc.addImage(pngImage, 'PNG', x, y, imgSize, imgSize);
                }
            }
        },
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 35, halign: 'center' },
            2: { cellWidth: 'auto' },
        },
    });

    let lastY = (doc as any).lastAutoTable.finalY + 15;

    // Хелпер для рендеринга текстовых блоков с переносом страниц
    const addTextBlock = (title: string, content: string | string[]) => {
        if (lastY > 260) { // Проверка, что не выходим за край страницы
            doc.addPage();
            lastY = 20;
        }
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(14);
        doc.text(title, 14, lastY);
        lastY += 7;
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(10);
        const textToSplit = Array.isArray(content)
            ? content.join('\n')
            : content;
        const splitText = doc.splitTextToSize(textToSplit, 180); // 180мм - ширина текста
        doc.text(splitText, 14, lastY);
        lastY += splitText.length * 5 + 5;
    };

    // Рендерим оставшиеся блоки
    addTextBlock('Общий вывод', report.conclusion.summary);
    addTextBlock('Рекомендации по развитию', report.conclusion.recommendations);
    addTextBlock(
        'Темы для технического интервью',
        report.conclusion.interview_topics,
    );
    addTextBlock(
        'Оценка соответствия ценностям',
        report.conclusion.values_assessment,
    );

    // Сохраняем файл
    const fileName = `Предварительная оценка кандидата - ${
        report.first_name || ''
    } ${report.last_name || ''}.pdf`;
    doc.save(fileName);
};
