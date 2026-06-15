// Scanner animation shown while resume is being processed
const SCAN_LABELS = {
  1: '🔍 Reading document elements...',
  2: '⚡ Extracting skills & parsing text content...',
  3: '🧠 Matching with role profile alignments...',
  4: '📋 Generating optimization checklist items...',
  5: '🎉 Finalizing ATS Scoring Matrix...',
};

const SCAN_STEPS = [
  'Document Text Acquisition',
  'NLP Keyword Extraction',
  'Job Profile Context Sync',
  'AI Recommendation Compiling',
];

export default function ScannerOverlay({ scanStep, scanProgress }) {
  return (
    <div className="scanner-overlay">
      <div className="scanner-bar"></div>
      <div className="scanner-doc-wrapper">
        <span className="scanner-doc-icon">📄</span>
      </div>
      <div className="scanner-progress-container">
        <div className="scanner-progress-info">
          <span>{SCAN_LABELS[scanStep] || 'Analyzing...'}</span>
          <span>{scanProgress}%</span>
        </div>
        <div className="scanner-progress-bar">
          <div className="scanner-progress-fill" style={{ width: `${scanProgress}%` }}></div>
        </div>
      </div>
      <div className="scanner-step-list">
        {SCAN_STEPS.map((label, i) => {
          const step = i + 1;
          const cls = scanStep >= step ? (scanStep > step ? 'completed' : 'active') : '';
          return (
            <div key={i} className={`scanner-step-item ${cls}`}>
              <div className="step-dot"></div>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
