import React, { useEffect, useState } from 'react';
import { emailService, EmailsResponse } from '../services/api';
import { Email } from '../services/api';
import { toast } from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response: EmailsResponse = await emailService.getEmails();
      setEmails(response.emails);
    } catch (error) {
      toast.error('Failed to fetch emails. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      {loading ? (
        <div className="text-center">Loading emails...</div>
      ) : (
        <div className="space-y-4">
          {emails.length === 0 ? (
            <div>No emails found.</div>
          ) : (
            emails.map((email) => (
              <div key={email.id} className="bg-white shadow rounded-lg p-4">
                <h2 className="font-bold">{email.subject}</h2>
                <p className="text-gray-600">{email.sender}</p>
                <p className="text-gray-500">{email.timestamp}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;