import type { QuizSet } from '@/types/quiz';

type Answers = Record<string, string | undefined>;

export function exportQuizAsPdf(quiz: QuizSet, answers: Answers) {
  if (typeof window === 'undefined') return;

  const printableHtml = buildPrintableHtml(quiz, answers);
  const blob = new Blob([printableHtml], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);

  const exportWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!exportWindow) {
    alert('Pop-up blocked. Please allow pop-ups to export the quiz.');
    URL.revokeObjectURL(blobUrl);
    return;
  }

  const cleanup = () => URL.revokeObjectURL(blobUrl);

  const handleLoad = () => {
    exportWindow.focus();
    exportWindow.print();
    setTimeout(() => {
      exportWindow.close();
      cleanup();
    }, 400);
    exportWindow.removeEventListener('load', handleLoad);
  };

  if (exportWindow.document?.readyState === 'complete') {
    handleLoad();
  } else {
    exportWindow.addEventListener('load', handleLoad);
  }
}

function buildPrintableHtml(quiz: QuizSet, answers: Answers): string {
  const questionsMarkup = quiz.questions
    .map((question, index) => {
      const options = question.choices
        .map((choice, choiceIdx) => `<li><span class="choice-label">${String.fromCharCode(65 + choiceIdx)}.</span> ${escapeHtml(toPlainText(choice.text))}</li>`)
        .join('');
      return `
        <article class="question">
          <h3>${index + 1}. ${escapeHtml(toPlainText(question.question))}</h3>
          <ul>${options}</ul>
        </article>
      `;
    })
    .join('');

  const solutionsMarkup = quiz.questions
    .map((question, index) => {
      const correctChoice = question.choices.find((choice) => choice.id === question.correctChoiceId);
      const userChoiceId = answers[question.id];
      const userChoice = userChoiceId ? question.choices.find((choice) => choice.id === userChoiceId) : undefined;
      return `
        <article class="solution">
          <h3>${index + 1}. ${escapeHtml(toPlainText(question.question))}</h3>
          <p><strong>Correct:</strong> ${escapeHtml(toPlainText(correctChoice?.text ?? '—'))}</p>
          ${userChoice ? `<p><strong>Your answer:</strong> ${escapeHtml(toPlainText(userChoice.text))}</p>` : ''}
          <p><strong>Explanation:</strong> ${escapeHtml(toPlainText(question.explanation))}</p>
        </article>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(toPlainText(quiz.topic))} — Quiz Export</title>
        <style>
          :root {
            color-scheme: only light;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: "Noto Sans", "Segoe UI", system-ui, sans-serif;
            color: #111;
            background: #fff;
            margin: 32px;
            line-height: 1.5;
          }
          header {
            text-align: center;
            margin-bottom: 32px;
          }
          h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }
          h2 {
            font-size: 18px;
            margin: 32px 0 16px;
            border-top: 1px solid #000;
            padding-top: 16px;
          }
          h3 {
            margin: 0 0 8px;
            font-size: 15px;
            font-weight: 600;
          }
          ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          li {
            margin: 4px 0;
          }
          .choice-label {
            display: inline-block;
            width: 20px;
            font-weight: 600;
          }
          article {
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #d4d4d4;
          }
          article:last-of-type {
            border-bottom: none;
          }
          @media print {
            body {
              margin: 10mm 12mm;
              font-size: 12pt;
            }
            h1 { font-size: 20pt; }
            h2 { font-size: 16pt; page-break-after: avoid; }
            h3 { font-size: 13pt; }
            article { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>${escapeHtml(toPlainText(quiz.topic))}</h1>
          <div>Difficulty: ${escapeHtml(quiz.difficulty)} | Language: ${escapeHtml(quiz.language)} | Timed: ${quiz.timed ? 'Yes' : 'No'}</div>
        </header>
        <section>
          <h2>Section 1: Questions</h2>
          ${questionsMarkup}
        </section>
        <section>
          <h2>Section 2: Solutions</h2>
          ${solutionsMarkup}
        </section>
      </body>
    </html>
  `;
}

function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toPlainText(input: string | undefined): string {
  if (!input) return '';
  return input
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\[(.*?)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
