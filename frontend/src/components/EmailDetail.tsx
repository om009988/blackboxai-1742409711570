import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { emailService, Email, SuggestedReply } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  StarIcon,
  TrashIcon,
  ReplyIcon,
} from '@heroicons/react/24/outline';

const EmailDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SuggestedReply[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    fetchEmail();
  }, [id]);

  const fetchEmail = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const emailData = await emailService.getEmail(id);
      setEmail(emailData);
      fetchSuggestions(id);
    } catch (error) {
      toast.error('Failed to fetch email details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (emailId: string) => {
    setLoadingSuggestions(true);
    try {
      const suggestedReplies = await emailService.getSuggestedReplies(emailId);
      setSuggestions(suggestedReplies);
    } catch (error) {
      toast.error('Failed to load reply suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleMarkInterested = async () => {
    if (!email) return;
    
    try {
      await emailService.markInterested(email.id, !email.is_interested);
      setEmail({ ...email, is_interested: !email.is_interested });
      toast.success(
        email.is_interested
          ? 'Removed from interested emails'
          : 'Marked as interested'
      );
    } catch (error) {
      toast.error('Failed to update interest status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Email not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-500"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex space-x-2">
            <button
              onClick={handleMarkInterested}
              className={`p-2 rounded-full ${
                email.is_interested
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              <StarIcon className="h-6 w-6" />
            </button>
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-500">
              <TrashIcon className="h-6 w-6" />
            </button>
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-500">
              <ReplyIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <h1 className="text-2xl font-bold mb-4">{email.subject}</h1>
        <div className="flex items-center space-x-4 mb-6">
          <div>
            <p className="font-medium">{email.sender}</p>
            <p className="text-sm text-gray-500">{email.timestamp}</p>
          </div>
        </div>
        <div className="prose max-w-none">{email.content}</div>
      </div>

      {/* Suggested replies */}
      {loadingSuggestions ? (
        <div className="border-t border-gray-200 p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Suggested Replies
          </h3>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-gray-50"
              >
                <p className="text-sm text-gray-900">{suggestion.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Confidence: {Math.round(suggestion.confidence * 100)}%
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EmailDetail;