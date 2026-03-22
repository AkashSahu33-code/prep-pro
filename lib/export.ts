// Export study notes to various formats — no external libraries needed

export function exportToMarkdown(notes: any): string {
  let md = `# ${notes.title}\n\n`;
  md += `**Subject:** ${notes.subject} | **Duration:** ${notes.duration}\n\n`;
  md += `## Summary\n${notes.summary}\n\n`;
  if (notes.hindiSummary) md += `> 🇮🇳 ${notes.hindiSummary}\n\n`;

  if (notes.keyTopics?.length) {
    md += `## Key Topics\n${notes.keyTopics.map((t: string) => `- ${t}`).join('\n')}\n\n`;
  }

  if (notes.structuredNotes?.length) {
    md += `## Structured Notes\n\n`;
    notes.structuredNotes.forEach((s: any) => {
      md += `### ${s.section}${s.timestamp ? ` _(${s.timestamp})_` : ''}\n\n`;
      md += `${s.content}\n\n`;
      if (s.keyPoints?.length) md += `**Key Points:**\n${s.keyPoints.map((p: string) => `- ${p}`).join('\n')}\n\n`;
      if (s.formulas?.filter((f: string) => f).length) md += `**Formulas:**\n${s.formulas.filter((f: string) => f).map((f: string) => `\`${f}\``).join(' | ')}\n\n`;
    });
  }

  if (notes.conceptMap?.length) {
    md += `## Concept Map\n\n`;
    notes.conceptMap.forEach((c: any) => {
      md += `### ${c.concept}\n${c.definition}\n\n`;
      if (c.examples?.length) md += `**Examples:** ${c.examples.join(', ')}\n`;
      if (c.relatedConcepts?.length) md += `**Related:** ${c.relatedConcepts.join(', ')}\n`;
      md += '\n';
    });
  }

  if (notes.flashcards?.length) {
    md += `## Flashcards\n\n`;
    notes.flashcards.forEach((f: any, i: number) => {
      md += `**Q${i + 1}:** ${f.front}\n**A:** ${f.back}\n\n`;
    });
  }

  if (notes.practiceQuestions?.length) {
    md += `## Practice Questions\n${notes.practiceQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\n\n`;
  }

  if (notes.furtherReading?.length) {
    md += `## Further Reading\n${notes.furtherReading.map((r: string) => `- ${r}`).join('\n')}\n`;
  }

  return md;
}

export function downloadAsMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click(); URL.revokeObjectURL(url);
}

export function downloadAsJSON(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click(); URL.revokeObjectURL(url);
}

export function exportConceptsToCSV(concepts: any[]): string {
  const header = 'Name,Subject,Topic,Repetitions,Ease Factor,Next Review,Last Studied';
  const rows = concepts.map(c =>
    `"${c.name}","${c.subject}","${c.topic}",${c.repetitions},${c.easeFactor?.toFixed(2)},"${new Date(c.nextReview).toLocaleDateString()}","${new Date(c.lastStudied).toLocaleDateString()}"`
  );
  return [header, ...rows].join('\n');
}

export function downloadAsCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click(); URL.revokeObjectURL(url);
}
