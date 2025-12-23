import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FullReport, TopicAssessment, AssessedValue } from '@/types/results.types';
import { toast } from 'sonner';

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

async function loadFonts(doc: jsPDF) {
    try {
        const fontNormalResponse = await fetch('/fonts/Roboto-Light.ttf');
        const fontNormalBuffer = await fontNormalResponse.arrayBuffer();
        doc.addFileToVFS('Roboto-Light.ttf', arrayBufferToBase64(fontNormalBuffer));
        doc.addFont('Roboto-Light.ttf', 'Roboto', 'normal');

        const fontBoldResponse = await fetch('/fonts/Roboto-SemiBold.ttf');
        const fontBoldBuffer = await fontBoldResponse.arrayBuffer();
        doc.addFileToVFS('Roboto-SemiBold.ttf', arrayBufferToBase64(fontBoldBuffer));
        doc.addFont('Roboto-SemiBold.ttf', 'Roboto', 'bold');
    } catch (error) {
        console.error('Не удалось загрузить кастомные шрифты для PDF:', error);
        toast.error('Ошибка загрузки шрифтов', {
            description: 'PDF будет сгенерирован со стандартными шрифтами.',
        });
    }
}


export const exportResultsPdf = async (report: FullReport) => {
    const doc = new jsPDF();
    await loadFonts(doc);

    doc.setFont('Roboto');
    let lastY = 15;
    let sectionCounter = 1;

    const addText = (
        text: string,
        x: number,
        y: number,
        options: {
            maxWidth?: number;
            fontStyle?: 'normal' | 'bold';
            fontSize?: number;
        } = {},
    ) => {
        const { maxWidth = 180, fontStyle = 'normal', fontSize = 10 } = options;
        doc.setFont('Roboto', fontStyle);
        doc.setFontSize(fontSize);
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, x, y);
        return y + doc.getTextDimensions(splitText).h + 2; // Возвращаем новую Y-позицию
    };

    const checkPageBreak = (currentY: number) => {
        if (currentY > 260) {
            doc.addPage();
            return 15;
        }
        return currentY;
    };

    const title = report.cvSummary
        ? `Фидбек на кандидата ${report.cvSummary.fullName}`
        : 'Фидбек на кандидата';
    lastY = addText(title, 15, lastY, { fontStyle: 'bold', fontSize: 14 });
    lastY += 5;

    lastY = checkPageBreak(lastY);
    lastY = addText('AI-generated summary:', 15, lastY, {
        fontStyle: 'bold',
        fontSize: 12,
    });
    lastY = addText(report.aiSummary.overallSummary, 15, lastY);
    lastY = addText('Сильные стороны:', 20, lastY, { fontStyle: 'bold' });
    lastY = addText(
        report.aiSummary.keyStrengths.map((s) => `• ${s}`).join('\n'),
        20,
        lastY,
    );
    lastY = addText('Зоны роста:', 20, lastY, { fontStyle: 'bold' });
    lastY = addText(
        report.aiSummary.keyWeaknesses.map((s) => `• ${s}`).join('\n'),
        20,
        lastY,
    );
    lastY += 5;

    if (report.cvSummary) {
        lastY = checkPageBreak(lastY);
        lastY = addText(`$${sectionCounter++}. Информация о кандидате (из CV)`, 15, lastY, {
            fontStyle: 'bold',
            fontSize: 12,
        });
        lastY = addText(
            `• Имя: ${report.cvSummary.fullName}\n` +
            `• Опыт: ${report.cvSummary.yearsOfExperience} лет\n` +
            `• Локация: ${report.cvSummary.location}\n` +
            `• Навыки: ${report.cvSummary.skills.join(', ')}`,
            20,
            lastY,
        );
        lastY += 5;
    }

    lastY = checkPageBreak(lastY);
    lastY = addText(`$${sectionCounter++}. Техническая оценка`, 15, lastY, {
        fontStyle: 'bold',
        fontSize: 12,
    });
    lastY = addText(report.technicalAssessment.summary, 15, lastY);

    autoTable(doc, {
        startY: lastY,
        head: [['Тема', 'Оценка', 'Комментарий']],
        body: report.technicalAssessment.topicAssessments.map((item: TopicAssessment) => [
            item.topic,
            item.grade,
            item.summary,
        ]),
        theme: 'grid',
        styles: { font: 'Roboto', fontSize: 9 },
        headStyles: { fillColor: [40, 40, 40], font: 'Roboto', fontStyle: 'bold' },
    });
    lastY = (doc as any).lastAutoTable.finalY + 10;

    if (report.languageAssessment) {
        lastY = checkPageBreak(lastY);
        lastY = addText(`$${sectionCounter++}. Оценка языка`, 15, lastY, {
            fontStyle: 'bold',
            fontSize: 12,
        });
        lastY = addText(report.languageAssessment.summary, 15, lastY);
        lastY = addText(
            `• Уровень: ${report.languageAssessment.overallLevel}\n` +
            `• Беглость: ${report.languageAssessment.fluency}\n` +
            `• Словарь: ${report.languageAssessment.vocabulary}`,
            20,
            lastY,
        );
        lastY += 5;
    }

    lastY = checkPageBreak(lastY);
    lastY = addText(`$${sectionCounter++}. Соответствие ценностям`, 15, lastY, {
        fontStyle: 'bold',
        fontSize: 12,
    });
    lastY = addText(report.valuesFit.overallSummary, 15, lastY);

    autoTable(doc, {
        startY: lastY,
        head: [['Ценность', 'Соответствие', 'Комментарий']],
        body: report.valuesFit.assessedValues.map((item: AssessedValue) => [
            item.value,
            item.match,
            item.evidence,
        ]),
        theme: 'grid',
        styles: { font: 'Roboto', fontSize: 9 },
        headStyles: { fillColor: [40, 40, 40], font: 'Roboto', fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 25 } },
    });
    lastY = (doc as any).lastAutoTable.finalY + 10;

    lastY = checkPageBreak(lastY);
    lastY = addText(`$${sectionCounter++}. Заключение`, 15, lastY, {
        fontStyle: 'bold',
        fontSize: 12,
    });
    lastY = addText(
        `Рекомендация: ${report.overallConclusion.recommendation}`,
        15,
        lastY,
        { fontStyle: 'bold', fontSize: 11 },
    );
    lastY = addText(report.overallConclusion.finalJustification, 15, lastY);
    lastY += 5;

    lastY = addText('Ключевые позитивные моменты:', 20, lastY, { fontStyle: 'bold' });
    lastY = addText(
        report.overallConclusion.keyPositives.map((s) => `• ${s}`).join('\n'),
        20,
        lastY,
    );
    lastY += 5;

    lastY = addText('Ключевые опасения:', 20, lastY, { fontStyle: 'bold' });
    lastY = addText(
        report.overallConclusion.keyConcerns.map((s) => `• ${s}`).join('\n'),
        20,
        lastY,
    );

    const baseName = report.cvSummary ? report.cvSummary.fullName : 'кандидата';
    const safeFullName = baseName.replace(/\s+/g, '_');
    doc.save(`Фидбек на кандидата ${safeFullName}.pdf`);
};
