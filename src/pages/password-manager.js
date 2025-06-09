import { useState, useEffect } from 'react';
import Layout from "@components/Layout";
import { PasswordManagerService } from '../domain/password-manager/password-manager-service.js';

export default function PasswordManager() {
  const [passwordManager] = useState(() => new PasswordManagerService());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentVault, setCurrentVault] = useState(null);
  const [showSignIn, setShowSignIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password records state
  const [passwordRecords, setPasswordRecords] = useState([]);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState({});

  // Forms
  const [signInForm, setSignInForm] = useState({ email: '', masterPassword: '' });
  const [createVaultForm, setCreateVaultForm] = useState({
    name: '', description: '', email: '', masterPassword: '', confirmPassword: ''
  });
  const [recordForm, setRecordForm] = useState({
    title: '', website: '', username: '', password: '', notes: '', tags: []
  });

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Load password records when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadPasswordRecords();
    }
  }, [isAuthenticated]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const vault = await passwordManager.signInToVault(signInForm.email, signInForm.masterPassword);
      setCurrentVault(vault);
      setIsAuthenticated(true);
      showSuccess(`Welcome to ${vault.name}!`);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVault = async (e) => {
    e.preventDefault();
    if (createVaultForm.masterPassword !== createVaultForm.confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (createVaultForm.masterPassword.length < 8) {
      showError('Master password must be at least 8 characters long');
      return;
    }
    setLoading(true);
    try {
      await passwordManager.createVault(createVaultForm);
      showSuccess('Vault created successfully! You can now sign in.');
      setCreateVaultForm({ name: '', description: '', email: '', masterPassword: '', confirmPassword: '' });
      setShowSignIn(true);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    passwordManager.lockVault();
    setIsAuthenticated(false);
    setCurrentVault(null);
    setPasswordRecords([]);
    setShowSignIn(true);
    showSuccess('Signed out successfully');
  };

  const loadPasswordRecords = async () => {
    try {
      const records = await passwordManager.getPasswordRecords();
      setPasswordRecords(records);
    } catch (error) {
      showError('Failed to load password records');
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await passwordManager.addPasswordRecord(recordForm);
      setRecordForm({ title: '', website: '', username: '', password: '', notes: '', tags: [] });
      setShowAddRecord(false);
      await loadPasswordRecords();
      showSuccess('Password record added successfully!');
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await passwordManager.updatePasswordRecord(editingRecord.id, recordForm);
      setEditingRecord(null);
      setRecordForm({ title: '', website: '', username: '', password: '', notes: '', tags: [] });
      await loadPasswordRecords();
      showSuccess('Password record updated successfully!');
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!confirm('Are you sure you want to delete this password record?')) return;
    try {
      await passwordManager.deletePasswordRecord(recordId);
      await loadPasswordRecords();
      showSuccess('Password record deleted successfully!');
    } catch (error) {
      showError(error.message);
    }
  };

  const generatePassword = () => {
    const generated = passwordManager.generatePassword(16, {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true
    });
    setRecordForm({ ...recordForm, password: generated });
  };

  const togglePasswordVisibility = (recordId) => {
    setShowPasswords(prev => ({ ...prev, [recordId]: !prev[recordId] }));
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`${type} copied to clipboard!`);
    } catch (error) {
      showError('Failed to copy to clipboard');
    }
  };

  const filteredRecords = passwordRecords.filter(record =>
    record.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">🔐 Password Manager</h1>
          
          {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">{error}</div>}
          {success && <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded mb-4">{success}</div>}

          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex mb-6 border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowSignIn(true)}
                className={`flex-1 py-2 px-4 transition-colors ${showSignIn ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setShowSignIn(false)}
                className={`flex-1 py-2 px-4 transition-colors ${!showSignIn ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                Create Vault
              </button>
            </div>

            {showSignIn ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={signInForm.email}
                  onChange={(e) => setSignInForm({...signInForm, email: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="password"
                  placeholder="Master Password"
                  value={signInForm.masterPassword}
                  onChange={(e) => setSignInForm({...signInForm, masterPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateVault} className="space-y-4">
                <input
                  type="text"
                  placeholder="Vault Name"
                  value={createVaultForm.name}
                  onChange={(e) => setCreateVaultForm({...createVaultForm, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={createVaultForm.email}
                  onChange={(e) => setCreateVaultForm({...createVaultForm, email: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <input
                  type="password"
                  placeholder="Master Password"
                  value={createVaultForm.masterPassword}
                  onChange={(e) => setCreateVaultForm({...createVaultForm, masterPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={createVaultForm.confirmPassword}
                  onChange={(e) => setCreateVaultForm({...createVaultForm, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Vault'}
                </button>
              </form>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              🔐 {currentVault?.name}
            </h1>
            <p className="text-gray-400">
              {currentVault?.description || 'Secure password storage'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Lock Vault
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Search and Add Button */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search passwords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowAddRecord(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Password
          </button>
        </div>

        {/* Password Records List */}
        <div className="grid gap-4">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {searchTerm ? 'No passwords found matching your search.' : 'No passwords stored yet. Add your first password!'}
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.id} className="bg-gray-900 border border-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {record.title}
                    </h3>
                    {record.website && (
                      <p className="text-sm text-blue-400">
                        {record.website}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingRecord(record);
                        setRecordForm({
                          title: record.title,
                          website: record.website,
                          username: record.username,
                          password: record.password,
                          notes: record.notes,
                          tags: record.tags || []
                        });
                      }}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {record.username && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Username:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-white">{record.username}</span>
                        <button
                          onClick={() => copyToClipboard(record.username, 'Username')}
                          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white">
                        {showPasswords[record.id] ? record.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(record.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                      >
                        {showPasswords[record.id] ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => copyToClipboard(record.password, 'Password')}
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {record.notes && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-400">Notes:</span>
                      <p className="text-sm mt-1 text-gray-200">{record.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Record Modal */}
        {(showAddRecord || editingRecord) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-white">
                {editingRecord ? 'Edit Password' : 'Add Password'}
              </h2>

              <form onSubmit={editingRecord ? handleUpdateRecord : handleAddRecord} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={recordForm.title}
                    onChange={(e) => setRecordForm({...recordForm, title: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Gmail, Facebook"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={recordForm.website}
                    onChange={(e) => setRecordForm({...recordForm, website: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Username/Email
                  </label>
                  <input
                    type="text"
                    value={recordForm.username}
                    onChange={(e) => setRecordForm({...recordForm, username: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={recordForm.password}
                      onChange={(e) => setRecordForm({...recordForm, password: e.target.value})}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm({...recordForm, notes: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddRecord(false);
                      setEditingRecord(null);
                      setRecordForm({
                        title: '',
                        website: '',
                        username: '',
                        password: '',
                        notes: '',
                        tags: []
                      });
                    }}
                    className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Saving...' : (editingRecord ? 'Update' : 'Add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 