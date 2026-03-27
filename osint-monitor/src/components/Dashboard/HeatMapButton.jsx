import { Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeatMapButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/map')}
      className="bg-bg-card border border-border-primary rounded-xl p-4 glow-border card-hover-effect flex items-center gap-3 w-full text-left"
    >
      <div className="p-2 bg-accent-blue/15 rounded-lg">
        <Map className="w-5 h-5 text-accent-blue" />
      </div>
      <div>
        <span className="text-sm font-semibold text-text-primary block">
          Heat Map
        </span>
        <span className="text-xs text-text-muted">
          View conflict geography
        </span>
      </div>
    </button>
  );
}