import ResumeHeatmap from './ResumeHeatmap';
import RecommendedJobs from './RecommendedJobs';
import ScannerOverlay from './ScannerOverlay';
import ResumePreviewer from './ResumePreviewer';

export default function AnalysisTab({
  // Upload state
  isUploading,
  scanStep,
  scanProgress,
  isDragging,
  setIsDragging,
  fileInputRef,
  handleFileUpload,
  handleDrop,
  error,
  // Results
  analysisResult,
  // Suggestion state
  activeSuggestionId,
  setActiveSuggestionId,
  suggestionText,
  setSuggestionText,
  isApplyingSuggestion,
  handleApplySuggestion,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── Upload / Scanner Card ── */}
      <div className="glass-card">
        <h2 className="premium-h2">Resume Analysis</h2>
        <p className="heading-tagline">
          Upload your resume to receive an in-depth ATS compatibility report and personalised career insights.
        </p>

        {isUploading && scanStep > 0 ? (
          <ScannerOverlay scanStep={scanStep} scanProgress={scanProgress} />
        ) : isUploading ? (
          <div className="upload-zone uploading">
            <div className="loader" style={{ width: '40px', height: '40px', borderTopColor: 'var(--accent-cyan)' }}></div>
            <p style={{ color: 'var(--accent-cyan)', fontWeight: 500 }}>Preparing your analysis, please wait…</p>
          </div>
        ) : (
          <div
            id="upload-zone"
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p>{isDragging ? 'Release to upload your resume' : 'Drag & Drop or Click to Upload'}</p>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Supported formats: PDF, DOCX, TXT &nbsp;·&nbsp; Max 5 MB</span>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span>⚠️</span> {error}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {analysisResult && (
        <>
          {/* ── Resume Heatmap ── */}
          <ResumeHeatmap
            sectionScores={analysisResult.sectionScores}
            overallScore={analysisResult.overallScore}
          />

          {/* Actionable Improvement Checklist */}
          {analysisResult.recommendations?.length > 0 && (
            <div className="glass-card">
              <h3 className="premium-h3" style={{ marginBottom: '0.4rem' }}>📋 Improvement Recommendations</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Address the items below to strengthen your resume score. Use <strong>"Optimise Bullet Point"</strong> to apply AI-suggested rewrites.
              </p>
              <div>
                {analysisResult.recommendations.map((rec, idx) => (
                  <div key={idx} className="rec-item">
                    <div className="rec-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={`badge ${rec.priority === 'Must-Fix' ? 'badge-must' : rec.priority === 'Important' ? 'badge-important' : 'badge-optional'}`}>
                          {rec.priority}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{rec.type?.toUpperCase()}</span>
                      </div>
                      <span className="rec-impact">+{rec.impact} pts impact</span>
                    </div>
                    <p className="rec-text">{rec.text}</p>

                    {activeSuggestionId === rec.id ? (
                      <div className="applicator-card">
                        <div className="applicator-header">✨ AI-Powered Bullet Point Optimiser</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                          Refine this suggestion to reflect your specific achievement before applying:
                        </p>
                        <textarea
                          className="applicator-textarea"
                          value={suggestionText}
                          onChange={(e) => setSuggestionText(e.target.value)}
                        />
                        <div className="applicator-actions">
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => { setActiveSuggestionId(null); setSuggestionText(''); }}
                            disabled={isApplyingSuggestion}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-small"
                            onClick={() => handleApplySuggestion(rec.id)}
                            disabled={isApplyingSuggestion || !suggestionText.trim()}
                          >
                            {isApplyingSuggestion ? 'Recalculating…' : 'Apply & Recalculate Score'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      rec.example && (
                        <button
                          className="btn btn-secondary btn-small"
                          style={{ marginTop: '0.75rem' }}
                          onClick={() => { setActiveSuggestionId(rec.id); setSuggestionText(rec.example); }}
                        >
                          🪄 Optimise Bullet Point
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Jobs */}
          <div className="glass-card">
            <h3 className="premium-h3" style={{ marginBottom: '0.4rem' }}>🖥️ Recommended Career Roles</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Based on your skills and experience profile, here are the roles you are best positioned for.
              Select any <span style={{ color: 'var(--danger)' }}>missing skill</span> to find a curated learning resource.
            </p>
            <RecommendedJobs roleMatches={analysisResult.roleMatches} />
          </div>

          {/* Resume Previewer */}
          {analysisResult.extractedText && (
            <ResumePreviewer text={analysisResult.extractedText} />
          )}
        </>
      )}
    </div>
  );
}
