import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Mic, RefreshCw, AlertCircle, Clock, TrendingUp, TrendingDown, Star, Zap, ChevronDown, ChevronUp } from 'lucide-react';

export default function PodcastInsights() {
  const [data, setData] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPresenter, setSelectedPresenter] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  const fetchInsights = useCallback(async () => {
    try {
      setError(null);
      const response = await api.getPodcastInsights();

      // Check if still processing (202 response)
      if (response.data.processing) {
        setProcessing(true);
        setProcessingStatus(response.data.status);
        setData(null);
      } else {
        setData(response.data);
        setProcessing(false);
        setProcessingStatus(null);
      }
    } catch (err) {
      if (err.response?.status === 202) {
        // Processing in progress
        setProcessing(true);
        setProcessingStatus(err.response.data?.status || 'Processing...');
        setData(null);
      } else if (err.response?.status === 404) {
        // No insights yet, check status
        fetchStatus();
      } else if (err.response?.status === 503) {
        // Feature disabled
        setError('disabled');
      } else {
        setError('Failed to load insights');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTranscript = useCallback(async () => {
    try {
      const response = await api.getPodcastTranscript();
      if (!response.data.processing) {
        setTranscriptData(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch transcript:', err);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.getPodcastStatus();
      setProcessing(response.data.isProcessing);
      setProcessingStatus(response.data.status);

      if (response.data.hasInsights && !data) {
        fetchInsights();
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, [data, fetchInsights]);

  useEffect(() => {
    fetchInsights();
    fetchTranscript();
  }, [fetchInsights, fetchTranscript]);

  // Poll while processing
  useEffect(() => {
    if (!processing) return;

    const interval = setInterval(() => {
      fetchInsights();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [processing, fetchInsights]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (dateString) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getConfidenceBadge = (confidence) => {
    const colors = {
      high: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[confidence] || colors.low;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Mic className="w-5 h-5 text-fpl-pink" />
          <h3 className="font-bold text-white">FPL Podcast Insights</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-fpl-pink" />
          <h3 className="font-bold text-white">FPL Podcast Insights</h3>
        </div>
        {data && transcriptData && (
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            {showTranscript ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Hide Transcript
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show Transcript
              </>
            )}
          </button>
        )}
      </div>

      {/* Feature disabled message */}
      {error === 'disabled' && (
        <div className="text-center py-6">
          <Mic className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">Podcast Insights Not Configured</p>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            To enable this feature, add a Google AI API key to your configuration.
            See the README for setup instructions.
          </p>
        </div>
      )}

      {/* Other error message */}
      {error && error !== 'disabled' && (
        <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Processing state */}
      {processing && (
        <div className="text-center py-8">
          <RefreshCw className="w-10 h-10 text-fpl-cyan mx-auto mb-3 animate-spin" />
          <p className="text-gray-300 mb-2">Processing latest episode...</p>
          {processingStatus && (
            <p className="text-sm text-gray-400">{processingStatus}</p>
          )}
        </div>
      )}

      {/* Insights content */}
      {!processing && data && (
        <>
          {/* Episode info */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-fpl-cyan font-medium">{data.episode.title}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
            <span>{formatDate(data.episode.pubDate)}</span>
            {data.episode.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {data.episode.duration}
              </span>
            )}
          </div>

          {/* Consensus Summary */}
          {data.insights?.consensus && (
            <div className="bg-fpl-purple/20 border border-fpl-purple/30 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1">
                <Star className="w-4 h-4 text-fpl-pink fill-fpl-pink" />
                Consensus Picks
              </h4>

              {data.insights.consensus.topTransfersIn?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-300 mb-1">Popular Transfers In:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.insights.consensus.topTransfersIn.map((player, idx) => (
                      <span key={idx} className="text-xs bg-green-700/30 text-green-300 px-2 py-0.5 rounded border border-green-600/30">
                        {player}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.insights.consensus.topTransfersOut?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-300 mb-1">Popular Transfers Out:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.insights.consensus.topTransfersOut.map((player, idx) => (
                      <span key={idx} className="text-xs bg-red-700/30 text-red-300 px-2 py-0.5 rounded border border-red-600/30">
                        {player}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.insights.consensus.captainFavorite && (
                <div className="mb-2">
                  <p className="text-xs text-gray-300 mb-1">Captain Favorite:</p>
                  <span className="text-xs bg-yellow-700/30 text-yellow-300 px-2 py-0.5 rounded border border-yellow-600/30">
                    {data.insights.consensus.captainFavorite}
                  </span>
                </div>
              )}

              {data.insights.consensus.keyAdvice?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-300 mb-1">Key Advice:</p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {data.insights.consensus.keyAdvice.map((advice, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-fpl-pink mt-0.5">•</span>
                        <span>{advice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Presenter Tabs */}
          {data.insights?.presenters?.length > 0 && (
            <>
              {data.insights.presenters.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {data.insights.presenters.map((presenter, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPresenter(idx)}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                        selectedPresenter === idx
                          ? 'bg-fpl-cyan text-gray-900'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {presenter.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Presenter's Insights */}
              {data.insights.presenters[selectedPresenter] && (
                <div className="space-y-4">
                  <PresenterInsights presenter={data.insights.presenters[selectedPresenter]} />
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
            <span>Processed {formatTimeAgo(data.processedAt)}</span>
          </div>
        </>
      )}

      {/* Show raw transcript if toggled */}
      {showTranscript && transcriptData && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Raw Transcript</h4>
          <div className="bg-gray-900/50 rounded-lg p-3 max-h-96 overflow-y-auto">
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {transcriptData.transcript}
            </p>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {transcriptData.transcriptLength?.toLocaleString()} characters
          </div>
        </div>
      )}

      {/* No insights and not processing */}
      {!processing && !data && !error && (
        <div className="text-center py-8">
          <Mic className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Insights will be available shortly...</p>
        </div>
      )}
    </div>
  );
}

// Component to display a single presenter's insights
function PresenterInsights({ presenter }) {
  const getConfidenceBadge = (confidence) => {
    const colors = {
      high: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[confidence] || colors.low;
  };

  return (
    <>
      {/* Transfers In */}
      {presenter.insights?.transfersIn?.length > 0 && (
        <div className="bg-gray-900/50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Transfers In
          </h4>
          <div className="space-y-2">
            {presenter.insights.transfersIn.map((transfer, idx) => (
              <div key={idx} className="bg-green-700/10 border border-green-600/30 rounded p-2">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="text-sm font-medium text-green-300">{transfer.playerName}</span>
                    {transfer.team && (
                      <span className="text-xs text-gray-400 ml-1">({transfer.team})</span>
                    )}
                  </div>
                  {transfer.confidence && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getConfidenceBadge(transfer.confidence)}`}>
                      {transfer.confidence}
                    </span>
                  )}
                </div>
                {transfer.reason && (
                  <p className="text-xs text-gray-300">{transfer.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfers Out */}
      {presenter.insights?.transfersOut?.length > 0 && (
        <div className="bg-gray-900/50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            Transfers Out
          </h4>
          <div className="space-y-2">
            {presenter.insights.transfersOut.map((transfer, idx) => (
              <div key={idx} className="bg-red-700/10 border border-red-600/30 rounded p-2">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="text-sm font-medium text-red-300">{transfer.playerName}</span>
                    {transfer.team && (
                      <span className="text-xs text-gray-400 ml-1">({transfer.team})</span>
                    )}
                  </div>
                  {transfer.confidence && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getConfidenceBadge(transfer.confidence)}`}>
                      {transfer.confidence}
                    </span>
                  )}
                </div>
                {transfer.reason && (
                  <p className="text-xs text-gray-300">{transfer.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Captaincy */}
      {(presenter.insights?.captaincy?.primary || presenter.insights?.captaincy?.differential) && (
        <div className="bg-gray-900/50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" />
            Captaincy
          </h4>
          <div className="space-y-2">
            {presenter.insights.captaincy.primary && (
              <div className="bg-yellow-700/10 border border-yellow-600/30 rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-yellow-400 uppercase">Primary Pick</span>
                </div>
                <p className="text-sm font-medium text-yellow-300 mb-1">
                  {presenter.insights.captaincy.primary.playerName}
                </p>
                {presenter.insights.captaincy.primary.reason && (
                  <p className="text-xs text-gray-300">{presenter.insights.captaincy.primary.reason}</p>
                )}
              </div>
            )}
            {presenter.insights.captaincy.differential && (
              <div className="bg-yellow-700/10 border border-yellow-600/30 rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-yellow-400 uppercase">Differential</span>
                </div>
                <p className="text-sm font-medium text-yellow-300 mb-1">
                  {presenter.insights.captaincy.differential.playerName}
                </p>
                {presenter.insights.captaincy.differential.reason && (
                  <p className="text-xs text-gray-300">{presenter.insights.captaincy.differential.reason}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chip Strategy */}
      {presenter.insights?.chipStrategy && (
        <div className="bg-gray-900/50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1">
            <Zap className="w-4 h-4 text-fpl-cyan" />
            Chip Strategy
          </h4>
          {presenter.insights.chipStrategy.recommendation && (
            <p className="text-sm text-gray-300 mb-2">{presenter.insights.chipStrategy.recommendation}</p>
          )}
          {presenter.insights.chipStrategy.chips?.length > 0 && (
            <div className="space-y-2">
              {presenter.insights.chipStrategy.chips.map((chip, idx) => (
                <div key={idx} className="bg-fpl-cyan/10 border border-fpl-cyan/30 rounded p-2">
                  <p className="text-xs font-semibold text-fpl-cyan uppercase mb-1">{chip.chip.replace('_', ' ')}</p>
                  {chip.advice && (
                    <p className="text-xs text-gray-300">{chip.advice}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
