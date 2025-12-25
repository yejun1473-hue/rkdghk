import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      setLoading(false);
    } else {
      navigate('/login');
    }
  }, [navigate]);

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
          <h1 className="text-3xl font-bold text-white">강화 게임</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <UserCircleIcon className="h-6 w-6" />
              <span>{user?.username}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-lg font-semibold text-yellow-400 mb-2">Gold</h2>
            <p className="text-3xl font-bold text-white">{user?.gold?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-lg font-semibold text-purple-400 mb-2">Choco</h2>
            <p className="text-3xl font-bold text-white">{user?.choco?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-lg font-semibold text-green-400 mb-2">Money</h2>
            <p className="text-3xl font-bold text-white">{user?.money?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Welcome to 강화 게임!</h2>
          <p className="text-gray-300 mb-6">
            This is the main game dashboard. Here you can manage your weapons, participate in battles, 
            and check your rankings.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Weapons
            </button>
            <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              Battles
            </button>
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              Rankings
            </button>
            <button className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors">
              Daily Check-in
            </button>
            <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              Profile
            </button>
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
