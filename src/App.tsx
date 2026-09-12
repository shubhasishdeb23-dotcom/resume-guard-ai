import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import { RecruiterProvider } from './context/RecruiterContext';
import { ToastProvider } from './context/ToastContext';
import LandingPage from './pages/LandingPage';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';
import VerificationPage from './pages/VerificationPage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidateDetailPage from './pages/CandidateDetailPage';
import ChallengeResumePage from './pages/ChallengeResumePage';
import CompareCandidatesPage from './pages/CompareCandidatesPage';

function App() {
  return (
    <AuthProvider>
      <ResumeProvider>
        <RecruiterProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/verification" element={<VerificationPage />} />
                <Route path="/recruiter" element={<RecruiterDashboard />} />
                <Route path="/recruiter/candidate/:candidateId" element={<CandidateDetailPage />} />
                <Route path="/recruiter/challenge/:candidateId" element={<ChallengeResumePage />} />
                <Route path="/recruiter/compare" element={<CompareCandidatesPage />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </RecruiterProvider>
      </ResumeProvider>
    </AuthProvider>
  );
}

export default App;
