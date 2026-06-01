import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useShellBridge } from '@so360/shell-context';
import { FeatureRoute } from '@so360/design-system';
import { MfeShellInitializer } from './components/MfeShellInitializer';
import { InsightDashboard } from './pages/InsightDashboard';
import { SignalsPage } from './pages/SignalsPage';

// Flag-to-segment map: segments that require a specific plan flag
const SEGMENT_FLAG_MAP: Record<string, string> = {
    finance: 'action:insight:export',
};

// Route-level upgrade prompt shown when a segment's feature is `locked`.
const UpgradeLocked = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center px-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-100">This feature is part of a higher plan</h2>
                <p className="text-sm text-slate-400 mt-1">Upgrade your plan to unlock it.</p>
            </div>
            <button
                type="button"
                onClick={() => navigate('/org/billing')}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
                Upgrade plan
            </button>
        </div>
    );
};

// Route-level panel shown when a segment's feature is `disabled` (admin turned it off).
const FeatureUnavailable = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-center px-6">
        <h2 className="text-lg font-semibold text-slate-100">Feature unavailable</h2>
        <p className="text-sm text-slate-400">This feature has been turned off for your organization.</p>
    </div>
);

// Renders InsightDashboard with the correct tab active for path-based routes
// e.g. /insight/revenue → InsightDashboard with initialTab="revenue"
// Keeps URL as-is so shell sidenav active state matches correctly.
// Segments listed in SEGMENT_FLAG_MAP are gated on the resolved 5-state model:
// enabled→render · read_only→inert · locked→upgrade prompt · disabled→unavailable · hidden→redirect.
const SegmentRoute: React.FC = () => {
    const { segmentCode } = useParams<{ segmentCode: string }>();
    const shell = useShellBridge();
    const requiredFlag = segmentCode ? SEGMENT_FLAG_MAP[segmentCode] : undefined;
    const dashboard = <InsightDashboard initialTab={segmentCode} />;
    if (!requiredFlag) return dashboard;
    const state = shell?.getFeatureState ? shell.getFeatureState(requiredFlag) : 'enabled';
    return (
        <FeatureRoute
            state={state}
            loading={!(shell?.effectiveFlagsLoaded ?? false)}
            hiddenFallback={<Navigate to="/" replace />}
            lockedFallback={<UpgradeLocked />}
            disabledFallback={<FeatureUnavailable />}
        >
            {dashboard}
        </FeatureRoute>
    );
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
