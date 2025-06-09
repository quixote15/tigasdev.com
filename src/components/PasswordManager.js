import { useState, useEffect } from 'react';
import { PasswordManagerService } from '../domain/password-manager/password-manager-service.js';

export default function PasswordManager() {
  const [passwordManager] = useState(() => new PasswordManagerService());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentVault, setCurrentVault] = useState(null);
  const [showSignIn, setShowSignIn] = useState(true);
  const [passwordRecords, setPasswordRecords] = useState([]);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({});

  // Forms
  const [signInForm, setSignInForm] = useState({ email: '', masterPassword: '' });
  const [createVaultForm, setCreateVaultForm] = useState({
    name: '', description: '', email: '', masterPassword: '', confirmPassword: ''
  });
  const [recordForm, setRecordForm] = useState({
    title: '', website: '', username: '', password: '', notes: '', tags: []
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadPasswordRecords();
    }
  }, [isAuthenticated]);

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const vault = await passwordManager.signInToVault(signInForm.email, signInForm.masterPassword);
      setCurrentVault(vault);
      setIsAuthenticated(true);
      setSignInForm({ email: '', masterPassword: '' });
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
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔐 Password Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Secure password storage with client-side encryption
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex mb-6">
            <button
              onClick={() => setShowSignIn(true)}
              className={`flex-1 py-2 px-4 rounded-l-lg font-medium ${
                showSignIn ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setShowSignIn(false)}
              className={`flex-1 py-2 px-4 rounded-r-lg font-medium ${
                !showSignIn ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <input
                type="password"
                placeholder="Master Password"
                value={signInForm.masterPassword}
                onChange={(e) => setSignInForm({...signInForm, masterPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <input
                type="text"
                placeholder="Description (Optional)"
                value={createVaultForm.description}
                onChange={(e) => setCreateVaultForm({...createVaultForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                type="email"
                placeholder="Email"
                value={createVaultForm.email}
                onChange={(e) => setCreateVaultForm({...createVaultForm, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <input
                type="password"
                placeholder="Master Password"
                value={createVaultForm.masterPassword}
                onChange={(e) => setCreateVaultForm({...createVaultForm, masterPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={createVaultForm.confirmPassword}
                onChange={(e) => setCreateVaultForm({...createVaultForm, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Creating Vault...' : 'Create Vault'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔐 {currentVault?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentVault?.description || 'Secure password storage'}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Lock Vault
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search passwords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <button
          onClick={() => setShowAddRecord(true)}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
        >
          Add Password
        </button>
      </div>

      <div className="grid gap-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No passwords found matching your search.' : 'No passwords stored yet. Add your first password!'}
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div key={record.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {record.title}
                  </h3>
                  {record.website && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
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
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {record.username && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Username:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{record.username}</span>
                      <button
                        onClick={() => copyToClipboard(record.username, 'Username')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {showPasswords[record.id] ? record.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(record.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {showPasswords[record.id] ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(record.password, 'Password')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Notes:</span>
                    <p className="text-sm mt-1 text-gray-800 dark:text-gray-200">{record.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {(showAddRecord || editingRecord) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingRecord ? 'Edit Password' : 'Add Password'}
            </h2>

            <form onSubmit={editingRecord ? handleUpdateRecord : handleAddRecord} className="space-y-4">
              <input
                type="text"
                placeholder="Title *"
                value={recordForm.title}
                onChange={(e) => setRecordForm({...recordForm, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <input
                type="url"
                placeholder="Website"
                value={recordForm.website}
                onChange={(e) => setRecordForm({...recordForm, website: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                type="text"
                placeholder="Username/Email"
                value={recordForm.username}
                onChange={(e) => setRecordForm({...recordForm, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Password *"
                  value={recordForm.password}
                  onChange={(e) => setRecordForm({...recordForm, password: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 text-sm"
                >
                  Generate
                </button>
              </div>
              <textarea
                placeholder="Notes"
                value={recordForm.notes}
                onChange={(e) => setRecordForm({...recordForm, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRecord(false);
                    setEditingRecord(null);
                    setRecordForm({ title: '', website: '', username: '', password: '', notes: '', tags: [] });
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingRecord ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 