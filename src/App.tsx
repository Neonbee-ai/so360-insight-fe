import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useShellBridge } from '@so360/shell-context';
import { MfeShellInitializer } from './components/MfeShellInitializer';
import { InsightDashboard } from './pages/InsightDashboard';
import { SignalsPage } from './pages/SignalsPage';

// Flag-to-segment map: segments that require a specific plan flag
const SEGMENT_FLAG_MAP: Record<string, string> = {
    finance: 'action:insight:export',
};

// Renders InsightDashboard with the correct tab active for path-based routes
// e.g. /insight/revenue → InsightDashboard with initialTab="revenue"
// Keeps URL as-is so shell sidenav active state matches correctly.
// Segments listed in SEGMENT_FLAG_MAP are redirected to overview when their flag is hidden.
const SegmentRoute: React.FC = () => {
    const { segmentCode } = useParams<{ segmentCode: string }>();
    const shell = useShellBridge();
    const requiredFlag = segmentCode ? SEGMENT_FLAG_MAP[segmentCode] : undefined;
    if (requiredFlag) {
        const hidden = shell?.isFeatureHidden ? shell.isFeatureHidden(requiredFlag) : false;
        if (hidden) return <Navigate to="/" replace />;
    }
    return <InsightDashboard initialTab={segmentCode} />;
};

function App() {
    return (
        <MfeShellInitializer>
            <Routes>
                <Route path="/" element={<InsightDashboard />} />
                <Route path="signals" element={<SignalsPage />} />

                {/* Path-based segment routes — URL stays as /insight/revenue etc. */}
                <Route path=":segmentCode" element={<SegmentRoute />} />
            </Routes>
        </MfeShellInitializer>
    );
}

export default App;
