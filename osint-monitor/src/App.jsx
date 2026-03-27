import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import EventFeed from './components/EventFeed/EventFeed';
import ConflictMap from './components/MapView/ConflictMap';
import TrendView from './components/Analysis/TrendView';
import SourceTracker from './components/Sources/SourceTracker';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/events" element={<EventFeed />} />
        <Route path="/map" element={<ConflictMap />} />
        <Route path="/trends" element={<TrendView />} />
        <Route path="/sources" element={<SourceTracker />} />
      </Routes>
    </Layout>
  );
}