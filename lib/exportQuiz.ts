import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QuizSet } from '@/types/quiz';

type Answers = Record<string, string | undefined>;

export function exportQuizAsPdf(quiz: QuizSet, answers: Answers) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 48;
  let cursorY = 64;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`Quiz: ${quiz.topic}`, marginX, cursorY);
  cursorY += 20;

  doc.setFontSize(11);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Difficulty: ${quiz.difficulty}   Language: ${quiz.language}   Timed: ${quiz.timed ? 'Yes' : 'No'}`, marginX, cursorY);
  cursorY += 24;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Section 1: Questions', marginX, cursorY);
  cursorY += 18;

  quiz.questions.forEach((question, index) => {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`${index + 1}. ${stripMarkdown(question.question)}`, marginX, cursorY, { maxWidth: 520 });
    cursorY += 16;

    doc.setFont('Helvetica', 'normal');
    question.choices.forEach((choice, choiceIndex) => {
      doc.text(`${String.fromCharCode(65 + choiceIndex)}. ${stripMarkdown(choice.text)}`, marginX + 16, cursorY, { maxWidth: 500 });
      cursorY += 14;
    });
    cursorY += 10;

    if (cursorY > 760) {
      doc.addPage();
      cursorY = 64;
    }
  });

  doc.addPage();
  cursorY = 64;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Section 2: Solutions', marginX, cursorY);
  cursorY += 18;

  const rows = quiz.questions.map((question, index) => {
    const correctChoice = question.choices.find((choice) => choice.id === question.correctChoiceId);
    let userSelection: string | null = null;
    const answerId = answers[question.id];
    if (answerId) {
      const userChoice = question.choices.find((choice) => choice.id === answerId);
      if (userChoice) userSelection = stripMarkdown(userChoice.text);
    }
    return [
      `${index + 1}. ${stripMarkdown(question.question)}`,
      correctChoice ? stripMarkdown(correctChoice.text) : '—',
      stripMarkdown(question.explanation),
      userSelection ?? '—',
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    body: rows,
    head: [['Question', 'Correct Answer', 'Explanation', 'Your Answer']],
    styles: { font: 'Helvetica', fontSize: 10, cellPadding: 6, halign: 'left', valign: 'top', textColor: [0, 0, 0], fillColor: [255, 255, 255] },
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 247, 247] },
    columnStyles: {
      0: { cellWidth: 170 },
      1: { cellWidth: 130 },
      2: { cellWidth: 210 },
      3: { cellWidth: 110 },
    },
  });

  doc.save(`${sanitizeFilename(quiz.topic)}-quiz.pdf`);
}

function sanitizeFilename(raw: string) {
  return raw.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'quiz';
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\[(.*?)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
