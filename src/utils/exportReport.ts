export interface ExportData {
  candidateName: string;
  fileName: string;
  uploadedAt: string;
  overallScore: number;
  atsScore: number;
  evidenceScore: number;
  skillMatch: number;
  breakdown: {
    name: string;
    score: number;
    recommendation: string;
  }[];
  skills: {
    name: string;
    supportLevel: string;
    evidence: string[];
  }[];
  projects: {
    name: string;
    depthScore: number;
    technologies: string[];
  }[];
  verification?: {
    overallEvidenceScore: number;
    supported: number;
    needsVerification: number;
    suspicious: number;
    triggeredRules: string[];
  };
  summary?: string;
  jobTitle?: string;
  recommendation?: string;
  shortlistScore?: number;
  trust?: {
    score: number;
    band: string;
    label: string;
    caveat: string;
    factors: {
      label: string;
      value: number;
      weight: number;
      detail: string;
    }[];
  };
  brief?: {
    headline: string;
    strengths: string[];
    gaps: string[];
    verificationAsks: string[];
    interviewFocus: string[];
    nextSteps: string[];
  };
  // When true, emit a short employer-facing one-pager (no technical score/skill/project detail).
  simpleOnly?: boolean;
}

export function generatePDFReport(data: ExportData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export the report');
    return;
  }

  const simple = !!data.simpleOnly;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>ResumeGuard AI Report - ${data.candidateName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #10b981; margin-bottom: 10px; }
    .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
    .subtitle { color: #64748b; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
    .score-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
    .score-value { font-size: 32px; font-weight: bold; }
    .score-label { font-size: 12px; color: #64748b; margin-top: 5px; }
    .score-green { color: #10b981; }
    .score-blue { color: #0ea5e9; }
    .score-amber { color: #f59e0b; }
    .score-red { color: #ef4444; }
    .breakdown-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .breakdown-name { font-weight: 500; }
    .breakdown-score { font-weight: bold; }
    .breakdown-rec { font-size: 12px; color: #64748b; max-width: 50%; }
    .skill-table { width: 100%; border-collapse: collapse; }
    .skill-table th, .skill-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .skill-table th { background: #f8fafc; font-weight: 600; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .badge-supported { background: #d1fae5; color: #065f46; }
    .badge-weak { background: #fef3c7; color: #92400e; }
    .badge-unsupported { background: #fee2e2; color: #991b1b; }
    .project-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 10px; }
    .project-name { font-weight: 600; margin-bottom: 5px; }
    .project-tech { font-size: 12px; color: #0ea5e9; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
    .verification-section { background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
    .warning { color: #b45309; font-weight: 500; }
    .page-break { page-break-before: always; }
    .factor-row { margin-bottom: 12px; }
    .factor-head { display: flex; justify-content: space-between; font-size: 13px; }
    .factor-detail { font-size: 12px; color: #64748b; margin-top: 2px; }
    .factor-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 4px; }
    .factor-bar > span { display: block; height: 100%; background: #10b981; }
    .brief-block { margin-bottom: 16px; }
    .brief-block h4 { font-size: 14px; margin-bottom: 6px; color: #0f172a; }
    .brief-block ul { margin-left: 20px; }
    .brief-block li { margin-bottom: 4px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🛡️ ResumeGuard AI</div>
    <div class="title">${simple ? 'Employer Candidate Summary' : 'Resume Analysis Report'}</div>
    <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
  </div>

  <div class="section">
    <div class="section-title">Candidate Information</div>
    <p><strong>Name:</strong> ${data.candidateName}</p>
    <p><strong>File:</strong> ${data.fileName}</p>
    <p><strong>Uploaded:</strong> ${data.uploadedAt}</p>
    ${data.jobTitle ? `<p><strong>Job:</strong> ${data.jobTitle}</p>` : ''}
    ${data.recommendation ? `<p><strong>Engine recommendation:</strong> ${data.recommendation.replace(/_/g, ' ')}</p>` : ''}
    ${typeof data.shortlistScore === 'number' ? `<p><strong>Shortlist score:</strong> ${data.shortlistScore}</p>` : ''}
  </div>
  ${data.summary ? `
  <div class="section">
    <div class="section-title">Candidate Summary</div>
    <p>${data.summary}</p>
  </div>
  ` : ''}

  ${simple ? '' : `
  <div class="section">
    <div class="section-title">Overall Scores</div>
    <div class="score-grid">
      <div class="score-card">
        <div class="score-value ${getScoreClass(data.overallScore)}">${data.overallScore}%</div>
        <div class="score-label">Overall Score</div>
      </div>
      <div class="score-card">
        <div class="score-value ${getScoreClass(data.atsScore)}">${data.atsScore}%</div>
        <div class="score-label">ATS Compatibility</div>
      </div>
      <div class="score-card">
        <div class="score-value ${getScoreClass(data.evidenceScore)}">${data.evidenceScore}%</div>
        <div class="score-label">Evidence Strength</div>
      </div>
      <div class="score-card">
        <div class="score-value ${getScoreClass(data.skillMatch)}">${data.skillMatch}%</div>
        <div class="score-label">Skill Match</div>
      </div>
    </div>
  </div>
  `}

  ${data.verification && !simple ? `
  <div class="section">
    <div class="section-title">Verification Summary</div>
    <div class="verification-section">
      <p><strong>Evidence Strength:</strong> <span class="${data.verification.overallEvidenceScore >= 70 ? 'score-green' : 'score-amber'}">${data.verification.overallEvidenceScore}%</span></p>
      <p style="margin-top: 10px;"><strong>Distribution:</strong></p>
      <ul style="margin-left: 20px; margin-top: 5px;">
        <li>Supported: ${data.verification.supported}%</li>
        <li>Needs Verification: ${data.verification.needsVerification}%</li>
        <li>Suspicious: ${data.verification.suspicious}%</li>
      </ul>
      ${data.verification.triggeredRules.length > 0 ? `
        <p style="margin-top: 10px;" class="warning">⚠️ ${data.verification.triggeredRules.length} verification rule(s) triggered</p>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${data.trust ? `
  <div class="section">
    <div class="section-title">Trust Score (plausibility &amp; consistency)</div>
    <div class="score-card" style="text-align: left;">
      <div class="score-value ${getScoreClass(data.trust.score)}" style="font-size: 40px;">${data.trust.score}<span style="font-size: 18px;">/100</span></div>
      <div class="score-label" style="font-size: 14px; margin-bottom: 15px;">${data.trust.label}</div>
      ${data.trust.factors.map(f => `
        <div class="factor-row">
          <div class="factor-head"><span>${f.label}</span><strong>${f.value}%</strong></div>
          <div class="factor-bar"><span style="width: ${f.value}%;"></span></div>
          <div class="factor-detail">${f.detail}</div>
        </div>
      `).join('')}
      <div class="factor-detail" style="margin-top: 10px;">${data.trust.caveat}</div>
    </div>
  </div>
  ` : ''}

  ${data.brief ? `
  <div class="section ${simple ? '' : 'page-break'}">
    <div class="section-title">Employer Brief</div>
    <p style="font-weight: 600; margin-bottom: 15px;">${data.brief.headline}</p>
    <div class="brief-block">
      <h4>Strengths</h4>
      <ul>${data.brief.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
    </div>
    <div class="brief-block">
      <h4>Gaps &amp; Questions</h4>
      <ul>${data.brief.gaps.map(s => `<li>${s}</li>`).join('')}</ul>
    </div>
    <div class="brief-block">
      <h4>Verify Before Advancing</h4>
      <ul>${data.brief.verificationAsks.map(s => `<li>${s}</li>`).join('')}</ul>
    </div>
    <div class="brief-block">
      <h4>Interview Focus</h4>
      <ul>${data.brief.interviewFocus.map(s => `<li>${s}</li>`).join('')}</ul>
    </div>
    <div class="brief-block">
      <h4>Suggested Next Steps</h4>
      <ul>${data.brief.nextSteps.map(s => `<li>${s}</li>`).join('')}</ul>
    </div>
  </div>
  ` : ''}

  ${simple ? '' : `
  <div class="section">
    <div class="section-title">Score Breakdown</div>
    ${data.breakdown.map(item => `
      <div class="breakdown-item">
        <div>
          <div class="breakdown-name">${item.name}</div>
          <div class="breakdown-rec">${item.recommendation}</div>
        </div>
        <div class="breakdown-score ${getScoreClass(item.score)}">${item.score}%</div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">Skills Analysis</div>
    <table class="skill-table">
      <thead>
        <tr>
          <th>Skill</th>
          <th>Support Level</th>
          <th>Evidence</th>
        </tr>
      </thead>
      <tbody>
        ${data.skills.map(skill => `
          <tr>
            <td>${skill.name}</td>
            <td><span class="badge ${getSkillBadge(skill.supportLevel)}">${formatSupportLevel(skill.supportLevel)}</span></td>
            <td>${skill.evidence.length > 0 ? skill.evidence.join(', ') : 'No evidence'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Projects</div>
    ${data.projects.map(project => `
      <div class="project-card">
        <div class="project-name">${project.name} <span style="color: ${project.depthScore >= 70 ? '#10b981' : '#f59e0b'}">(${project.depthScore}%)</span></div>
        <div class="project-tech">${project.technologies.join(', ')}</div>
      </div>
    `).join('')}
  </div>
  `}

  <div class="footer">
    <p>Generated by ResumeGuard AI - Evidence-Based Resume Intelligence</p>
    <p style="margin-top: 5px;">This report is for informational purposes only. All findings should be verified through direct communication.</p>
  </div>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

export function generateTextReport(data: ExportData): string {
  const simple = !!data.simpleOnly;
  let report = `ResumeGuard AI Analysis Report\n`;
  report += `${'='.repeat(50)}\n\n`;
  report += `Candidate: ${data.candidateName}\n`;
  report += `File: ${data.fileName}\n`;
  report += `Uploaded: ${data.uploadedAt}\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;

  if (!simple) {
    report += `OVERALL SCORES\n`;
    report += `-`.repeat(30) + `\n`;
    report += `Overall Score: ${data.overallScore}%\n`;
    report += `ATS Compatibility: ${data.atsScore}%\n`;
    report += `Evidence Strength: ${data.evidenceScore}%\n`;
    report += `Skill Match: ${data.skillMatch}%\n\n`;
  }
  
  if (data.verification && !simple) {
    report += `VERIFICATION SUMMARY\n`;
    report += `-`.repeat(30) + `\n`;
    report += `Evidence Score: ${data.verification.overallEvidenceScore}%\n`;
    report += `Supported: ${data.verification.supported}%\n`;
    report += `Needs Verification: ${data.verification.needsVerification}%\n`;
    report += `Suspicious: ${data.verification.suspicious}%\n`;
    if (data.verification.triggeredRules.length > 0) {
      report += `Rules Triggered: ${data.verification.triggeredRules.length}\n`;
    }
    report += `\n`;
  }

  if (data.trust) {
    report += `TRUST SCORE (plausibility & consistency)\n`;
    report += `-`.repeat(30) + `\n`;
    report += `${data.trust.score}/100 — ${data.trust.label}\n`;
    data.trust.factors.forEach(f => {
      report += `  ${f.label}: ${f.value}% (weight ${Math.round(f.weight * 100)}%) — ${f.detail}\n`;
    });
    report += `${data.trust.caveat}\n\n`;
  }

  if (data.brief) {
    report += `EMPLOYER BRIEF\n`;
    report += `-`.repeat(30) + `\n`;
    report += `${data.brief.headline}\n\n`;
    report += `Strengths:\n` + data.brief.strengths.map(s => `  - ${s}`).join('\n') + `\n\n`;
    report += `Gaps:\n` + data.brief.gaps.map(s => `  - ${s}`).join('\n') + `\n\n`;
    report += `Verify before advancing:\n` + data.brief.verificationAsks.map(s => `  - ${s}`).join('\n') + `\n\n`;
    report += `Interview focus:\n` + data.brief.interviewFocus.map(s => `  - ${s}`).join('\n') + `\n\n`;
    report += `Next steps:\n` + data.brief.nextSteps.map(s => `  - ${s}`).join('\n') + `\n\n`;
  }

  if (!simple) {
    report += `SCORE BREAKDOWN\n`;
    report += `-`.repeat(30) + `\n`;
    data.breakdown.forEach(item => {
      report += `${item.name}: ${item.score}%\n`;
      report += `  ${item.recommendation}\n`;
    });
    report += `\n`;
    
    report += `SKILLS ANALYSIS\n`;
    report += `-`.repeat(30) + `\n`;
    data.skills.forEach(skill => {
      report += `${skill.name} [${formatSupportLevel(skill.supportLevel)}]\n`;
      if (skill.evidence.length > 0) {
        report += `  Evidence: ${skill.evidence.join(', ')}\n`;
      }
    });
    report += `\n`;
    
    report += `PROJECTS\n`;
    report += `-`.repeat(30) + `\n`;
    data.projects.forEach(project => {
      report += `${project.name} (${project.depthScore}%)\n`;
      report += `  Technologies: ${project.technologies.join(', ')}\n`;
    });
    report += `\n`;
  }
  
  report += `${'='.repeat(50)}\n`;
  report += `Generated by ResumeGuard AI\n`;
  report += `This report is for informational purposes only.\n`;
  
  return report;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function shareViaEmail(subject: string, body: string): void {
  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
}

export function getShareableLink(): string {
  return window.location.href;
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'score-green';
  if (score >= 60) return 'score-blue';
  if (score >= 40) return 'score-amber';
  return 'score-red';
}

function getSkillBadge(level: string): string {
  if (level === 'supported') return 'badge-supported';
  if (level === 'weakly_supported') return 'badge-weak';
  return 'badge-unsupported';
}

function formatSupportLevel(level: string): string {
  return level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}
