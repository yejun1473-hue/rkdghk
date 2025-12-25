import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon, CurrencyDollarIcon, GiftIcon } from '@heroicons/react/24/outline';

const GMPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkGMStatus();
  }, []);

  const checkGMStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const user = await response.json();
      if (user.role !== 'gm') {
        alert('Access denied. GM role required.');
        navigate('/dashboard');
        return;
      }

      loadUsers();
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    }
  };

  const loadUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setMessage('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserCurrency = async (userId, currencyType, value) => {
    const token = localStorage.getItem('token');
    const updateData = {};
    updateData[currencyType] = parseInt(value);

    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/currency`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setMessage('Currency updated successfully');
        loadUsers();
      } else {
        const error = await response.json();
        setMessage('Failed to update currency: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating currency:', error);
      setMessage('Error updating currency');
    }
  };

  const giveAllUsersCurrency = async (type, amount) => {
    const token = localStorage.getItem('token');
    
    if (!confirm(`Give all users ${amount} ${type}?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/admin/users/give-currency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, amount })
      });

      if (response.ok) {
        setMessage(`Successfully gave all users ${amount} ${type}`);
        loadUsers();
      } else {
        const error = await response.json();
        setMessage('Failed to give currency: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error giving currency:', error);
      setMessage('Error giving currency');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">GM Panel</h1>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>

        {message && (
          <div className="mb-6 bg-blue-500/20 border border-blue-500/50 text-blue-200 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => giveAllUsersCurrency('gold', 10000)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              <CurrencyDollarIcon className="h-5 w-5" />
              Give All Users +10,000 Gold
            </button>
            <button
              onClick={() => giveAllUsersCurrency('choco', 5)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <GiftIcon className="h-5 w-5" />
              Give All Users +5 Choco
            </button>
            <button
              onClick={() => giveAllUsersCurrency('money', 1)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <GiftIcon className="h-5 w-5" />
              Give All Users +1 Money
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">All Users Currency</h2>
          <div className="grid gap-4">
            {users.map((user) => (
              <div key={user.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{user.username}</h3>
                    <p className="text-sm text-gray-300">Role: {user.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-yellow-400">Gold: {user.gold?.toLocaleString() || 0}</p>
                    <p className="text-sm text-purple-400">Choco: {user.choco?.toLocaleString() || 0}</p>
                    <p className="text-sm text-green-400">Money: {user.money?.toLocaleString() || 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="number"
                    placeholder="Gold"
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id={`gold-${user.id}`}
                  />
                  <input
                    type="number"
                    placeholder="Choco"
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id={`choco-${user.id}`}
                  />
                  <input
                    type="number"
                    placeholder="Money"
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id={`money-${user.id}`}
                  />
                  <button
                    onClick={() => {
                      const gold = document.getElementById(`gold-${user.id}`).value;
                      const choco = document.getElementById(`choco-${user.id}`).value;
                      const money = document.getElementById(`money-${user.id}`).value;
                      
                      if (gold) updateUserCurrency(user.id, 'gold', gold);
                      if (choco) updateUserCurrency(user.id, 'choco', choco);
                      if (money) updateUserCurrency(user.id, 'money', money);
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GMPanel;
