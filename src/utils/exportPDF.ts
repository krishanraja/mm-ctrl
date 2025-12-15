import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportData {
  leaderName: string;
  companyName: string;
  benchmarkScore: number;
  benchmarkTier: string;
  dimensionScores: Array<{
    dimension: string;
    score: number;
    tier: string;
  }>;
  firstMoves: string[];
  riskSignals: Array<{
    risk_key: string;
    level: string;
    description: string;
  }>;
  tensions: Array<{
    dimension_key: string;
    summary_line: string;
  }>;
  scenarios: Array<{
    scenario_key: string;
    summary: string;
  }>;
}

export async function exportDiagnosticPDF(data: ExportData): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper to add page if needed
  const checkPageBreak = (spaceNeeded: number) => {
    if (yPos + spaceNeeded > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header
  pdf.setFontSize(24);
  pdf.setTextColor(20, 20, 20);
  pdf.text('AI Leadership Growth Benchmark', margin, yPos);
  yPos += 12;

  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`${data.leaderName} | ${data.companyName}`, margin, yPos);
  yPos += 15;

  // Benchmark Score
  checkPageBreak(30);
  pdf.setFontSize(16);
  pdf.setTextColor(20, 20, 20);
  pdf.text('Overall Benchmark', margin, yPos);
  yPos += 8;

  pdf.setFontSize(28);
  pdf.setTextColor(59, 130, 246);
  pdf.text(`${data.benchmarkScore}/100`, margin, yPos);
  yPos += 8;

  pdf.setFontSize(14);
  pdf.setTextColor(100, 100, 100);
  pdf.text(data.benchmarkTier, margin, yPos);
  yPos += 15;

  // Dimension Scores
  checkPageBreak(60);
  pdf.setFontSize(16);
  pdf.setTextColor(20, 20, 20);
  pdf.text('6 Dimensions of AI Leadership', margin, yPos);
  yPos += 10;

  pdf.setFontSize(11);
  data.dimensionScores.forEach((dim) => {
    checkPageBreak(12);
    pdf.setTextColor(60, 60, 60);
    const dimensionText = pdf.splitTextToSize(
      `${dim.dimension}: ${dim.score}/100 (${dim.tier})`,
      contentWidth
    );
    pdf.text(dimensionText, margin, yPos);
    yPos += 8;
  });
  yPos += 10;

  // First Moves
  checkPageBreak(40);
  pdf.setFontSize(16);
  pdf.setTextColor(20, 20, 20);
  pdf.text('Your First 3 Moves', margin, yPos);
  yPos += 10;

  pdf.setFontSize(11);
  data.firstMoves.forEach((move, idx) => {
    checkPageBreak(20);
    pdf.setTextColor(60, 60, 60);
    const moveText = pdf.splitTextToSize(`${idx + 1}. ${move}`, contentWidth - 5);
    pdf.text(moveText, margin + 5, yPos);
    yPos += moveText.length * 6 + 5;
  });
  yPos += 10;

  // Risk Signals
  if (data.riskSignals.length > 0) {
    checkPageBreak(40);
    pdf.setFontSize(16);
    pdf.setTextColor(20, 20, 20);
    pdf.text('Risk Signals', margin, yPos);
    yPos += 10;

    pdf.setFontSize(11);
    data.riskSignals.forEach((risk) => {
      checkPageBreak(20);
      pdf.setTextColor(60, 60, 60);
      const levelColor: [number, number, number] = risk.level === 'high' ? [220, 38, 38] : 
                         risk.level === 'medium' ? [234, 179, 8] : [34, 197, 94];
      pdf.setTextColor(levelColor[0], levelColor[1], levelColor[2]);
      pdf.text(`● ${risk.risk_key.replace(/_/g, ' ').toUpperCase()} (${risk.level})`, margin, yPos);
      yPos += 6;
      
      pdf.setTextColor(80, 80, 80);
      const descText = pdf.splitTextToSize(risk.description, contentWidth - 5);
      pdf.text(descText, margin + 5, yPos);
      yPos += descText.length * 5 + 8;
    });
    yPos += 5;
  }

  // Tensions
  if (data.tensions.length > 0) {
    checkPageBreak(40);
    pdf.setFontSize(16);
    pdf.setTextColor(20, 20, 20);
    pdf.text('Key Tensions', margin, yPos);
    yPos += 10;

    pdf.setFontSize(11);
    data.tensions.forEach((tension) => {
      checkPageBreak(15);
      pdf.setTextColor(60, 60, 60);
      const tensionText = pdf.splitTextToSize(`• ${tension.summary_line}`, contentWidth - 5);
      pdf.text(tensionText, margin + 5, yPos);
      yPos += tensionText.length * 5 + 6;
    });
    yPos += 5;
  }

  // Scenarios
  if (data.scenarios.length > 0) {
    checkPageBreak(40);
    pdf.setFontSize(16);
    pdf.setTextColor(20, 20, 20);
    pdf.text('Organizational Scenarios', margin, yPos);
    yPos += 10;

    pdf.setFontSize(11);
    data.scenarios.forEach((scenario) => {
      checkPageBreak(25);
      pdf.setTextColor(59, 130, 246);
      pdf.text(`${scenario.scenario_key.replace(/_/g, ' ').toUpperCase()}`, margin, yPos);
      yPos += 6;
      
      pdf.setTextColor(80, 80, 80);
      const summaryText = pdf.splitTextToSize(scenario.summary, contentWidth - 5);
      pdf.text(summaryText, margin + 5, yPos);
      yPos += summaryText.length * 5 + 10;
    });
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Generated by MindMaker AI | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save
  const fileName = `AI-Leadership-Benchmark-${data.leaderName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
