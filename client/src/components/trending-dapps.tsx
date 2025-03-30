import React from 'react';
import { DApp } from '@/types/dapp';
import { fetchTrendingDappsFromDappRadar } from '@/lib/dappradar-service';

interface TrendingDappsProps {
  onSelectDapp: (dapp: DApp) => void;
}

const TrendingDapps: React.FC<TrendingDappsProps> = ({ onSelectDapp }) => {
  const [trendingDapps, setTrendingDapps] = React.useState<DApp[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchTrendingDapps = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const dapps = await fetchTrendingDappsFromDappRadar();
        setTrendingDapps(dapps);
      } catch (err) {
        setError('Failed to load trending dApps');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingDapps();
  }, []);

  if (isLoading) {
    return (
      <div className="nordic-card p-4 animate-pulse">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trending dApps</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-md mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || trendingDapps.length === 0) {
    return (
      <div className="nordic-card p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trending dApps</h2>
        <p className="text-gray-500 text-sm">No trending dApps found at the moment.</p>
      </div>
    );
  }

  return (
    <div className="nordic-card p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Trending dApps</h2>
      <div className="space-y-3">
        {trendingDapps.map((dapp, index) => (
          <button
            key={dapp.id || index}
            className="w-full text-left hover:bg-gray-50 p-2 rounded-md transition-colors"
            onClick={() => onSelectDapp(dapp)}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 mr-3">
                {dapp.image ? (
                  <img src={dapp.image} alt={dapp.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{dapp.name}</h3>
                {dapp.category && (
                  <span className="text-xs text-gray-500">{dapp.category}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendingDapps;
