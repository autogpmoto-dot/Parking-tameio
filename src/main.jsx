import React, { useState, useEffect } from 'react';
import { Trash2, Plus, LogOut, Eye, EyeOff, Edit2, Download, ArrowRightLeft } from 'lucide-react';

const TamieioApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [shops] = useState(['NOX', 'VOX', 'ΟΙΚΟΝΟΝΟΠΟΥΛΟΣ', 'ΚΕΝΤΡΟ ΑΘΗΝΩΝ', 'ΠΑΟΛΑ', 'ΥΠΑΙΘΡΙΟ', 'EVENTS']);
  const [showForm, setShowForm] = useState(false);
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedShopReport, setSelectedShopReport] = useState('NOX');
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');

  const [expenseCategories, setExpenseCategories] = useState(() => {
    const saved = localStorage.getItem('expenseCategories');
    return saved ? JSON.parse(saved) : ['Μισθοδοσία', 'ΙΚΑ', 'Ενοίκιο', 'ΕΦΚΑ', 'ΦΠΑ', 'Λοιπά έξοδα'];
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shop: 'NOX',
    cash: '',
    card: '',
    wages: '',
    wagesDescription: '',
    expenses: '',
    expenseCategory: 'Λοιπά έξοδα',
    expenseSource: 'cash',
    notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('tamieioData');
    if (saved) {
      const data = JSON.parse(saved);
      setTransactions(data.transactions || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tamieioData', JSON.stringify({ transactions }));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  const handleLogin = (username) => {
    setCurrentUser(username);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    
    const cash = parseFloat(formData.cash) || 0;
    const card = parseFloat(formData.card) || 0;
    const wages = parseFloat(formData.wages) || 0;
    const expenses = parseFloat(formData.expenses) || 0;

    if (cash === 0 && card === 0 && wages === 0 && expenses === 0) {
      alert('Παρακαλώ συμπληρώστε τουλάχιστον ένα ποσό');
      return;
    }

    if (editingId) {
      setTransactions(transactions.map(t => 
        t.id === editingId 
          ? {
              ...t,
              date: formData.date,
              shop: formData.shop,
              cash,
              card,
              wages,
              wagesDescription: formData.wagesDescription,
              expenses,
              expenseCategory: formData.expenseCategory,
              expenseSource: formData.expenseSource,
              notes: formData.notes,
              lastModified: new Date().toISOString()
            }
          : t
      ));
      setEditingId(null);
    } else {
      const newTransaction = {
        id: Date.now(),
        type: 'transaction',
        date: formData.date,
        shop: formData.shop,
        cash,
        card,
        totalIncome: cash + card,
        wages,
        wagesDescription: formData.wagesDescription,
        expenses,
        expenseCategory: formData.expenseCategory,
        expenseSource: formData.expenseSource,
        notes: formData.notes,
        user: currentUser,
        timestamp: new Date().toISOString()
      };
      setTransactions([newTransaction, ...transactions]);
    }
    
    setFormData({
      date: new Date().toISOString().split('T')[0],
      shop: 'NOX',
      cash: '',
      card: '',
      wages: '',
      wagesDescription: '',
      expenses: '',
      expenseCategory: 'Λοιπά έξοδα',
      expenseSource: 'cash',
      notes: ''
    });
    setShowForm(false);
  };

  const handleEditTransaction = (transaction) => {
    setFormData({
      date: transaction.date,
      shop: transaction.shop,
      cash: transaction.cash.toString(),
      card: transaction.card.toString(),
      wages: transaction.wages.toString(),
      wagesDescription: transaction.wagesDescription,
      expenses: transaction.expenses.toString(),
      expenseCategory: transaction.expenseCategory,
      expenseSource: transaction.expenseSource,
      notes: transaction.notes
    });
    setEditingId(transaction.id);
    setShowForm(true);
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm('Διαγραφή;')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    
    if (amount <= 0) {
      alert('Ποσό?');
      return;
    }

    setTransactions([
      {
        id: Date.now(),
        type: 'transfer',
        date: new Date().toISOString().split('T')[0],
        amount,
        user: currentUser,
        timestamp: new Date().toISOString()
      },
      ...transactions
    ]);
    setTransferAmount('');
    setShowTransferForm(false);
  };

  const calculateWallets = () => {
    let cashWallet = 0;
    let bankWallet = 0;
    let totalIncome = 0;

    transactions.forEach(t => {
      if (t.type === 'transaction') {
        const income = t.cash + t.card;
        totalIncome += income;
        cashWallet += t.cash;
        bankWallet += t.card;
        
        if (t.expenseSource === 'cash') {
          cashWallet -= t.expenses;
        } else {
          bankWallet -= t.expenses;
        }
      } else if (t.type === 'transfer') {
        bankWallet -= t.amount;
        cashWallet += t.amount;
      }
    });

    return { cashWallet, bankWallet, totalIncome };
  };

  const wallets = calculateWallets();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border-4 border-amber-200">
          <h1 className="text-4xl font-bold text-center mb-2 text-amber-600">Ταμείο</h1>
          <p className="text-center text-gray-600 mb-8 text-lg">💰 Δύο Ταμεία 🏦</p>
          
          <div className="space-y-4">
            <button
              onClick={() => handleLogin('ΓΙΩΡΓΟΣ')}
              className="w-full bg-amber-300 hover:bg-amber-400 text-white font-bold py-4 rounded-2xl transition"
            >
              ΓΙΩΡΓΟΣ
            </button>
            <button
              onClick={() => handleLogin('Σταύρος')}
              className="w-full bg-orange-300 hover:bg-orange-400 text-white font-bold py-4 rounded-2xl transition"
            >
              Σταύρος
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="bg-gradient-to-r from-amber-300 via-orange-200 to-emerald-300 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Ταμείο - Δύο Ταμεία</h1>
            <p className="text-amber-800 font-semibold">{currentUser}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/30 hover:bg-white/50 px-4 py-2 rounded-xl font-semibold"
          >
            Αποσύνδεση
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-2xl font-semibold ${activeTab === 'dashboard' ? 'bg-amber-300 text-amber-900 shadow-lg' : 'bg-white text-gray-700 border-2 border-amber-100'}`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-3 rounded-2xl font-semibold ${activeTab === 'daily' ? 'bg-orange-300 text-orange-900 shadow-lg' : 'bg-white text-gray-700 border-2 border-orange-100'}`}
          >
            📅 Ημερήσιο
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-6 py-3 rounded-2xl font-semibold ${activeTab === 'expenses' ? 'bg-red-300 text-red-900 shadow-lg' : 'bg-white text-gray-700 border-2 border-red-100'}`}
          >
            💸 Έξοδα
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 rounded-2xl font-semibold ${activeTab === 'transactions' ? 'bg-emerald-300 text-emerald-900 shadow-lg' : 'bg-white text-gray-700 border-2 border-emerald-100'}`}
          >
            📋 Καταχωρήσεις
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-6 py-3 rounded-2xl font-semibold ${activeTab === 'export' ? 'bg-cyan-300 text-cyan-900 shadow-lg' : 'bg-white text-gray-700 border-2 border-cyan-100'}`}
          >
            💾 Backup
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl p-8 border-2 border-emerald-300 shadow-lg">
                <h2 className="text-2xl font-bold text-emerald-900 mb-4">💰 Μετρητά</h2>
                <p className="text-5xl font-bold text-emerald-700">{wallets.cashWallet.toFixed(2)}€</p>
              </div>

              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-8 border-2 border-blue-300 shadow-lg">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">🏦 Τράπεζα</h2>
                <p className="text-5xl font-bold text-blue-700">{wallets.bankWallet.toFixed(2)}€</p>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-500 hover:to-amber-400 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg"
              >
                <Plus size={20} />
                Νέα Καταχώρηση
              </button>
              <button
                onClick={() => setShowTransferForm(!showTransferForm)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-400 to-purple-300 hover:from-purple-500 hover:to-purple-400 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg"
              >
                <ArrowRightLeft size={20} />
                Ανάληψη
              </button>
            </div>

            {showTransferForm && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-purple-200">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Ανάληψη από Τράπεζα</h2>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ποσό (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg bg-white"
                      placeholder="0.00"
                      max={wallets.bankWallet}
                    />
                    <p className="text-sm text-purple-700 mt-2">Διαθέσιμο: {wallets.bankWallet.toFixed(2)}€</p>
                  </div>

                  <div className="flex gap-4">
                    <button type="submit" className="flex-1 bg-purple-400 hover:bg-purple-500 text-white font-bold py-2 rounded-lg">
                      Ανάληψη
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTransferForm(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg"
                    >
                      Άκυρο
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showForm && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-amber-200">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">{editingId ? 'Ενημέρωση' : 'Νέα Καταχώρηση'}</h2>
                <form onSubmit={handleAddTransaction} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ημερομηνία</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg bg-amber-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Μαγαζί</label>
                      <select
                        value={formData.shop}
                        onChange={(e) => setFormData({ ...formData, shop: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg bg-amber-50"
                      >
                        {shops.map(shop => (
                          <option key={shop} value={shop}>{shop}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border-2 border-emerald-200">
                    <h3 className="text-lg font-bold text-emerald-700 mb-4">💰 ΕΣΟΔΑ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Μετρητά (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.cash}
                          onChange={(e) => setFormData({ ...formData, cash: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-emerald-300 rounded-lg bg-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Κάρτες (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.card}
                          onChange={(e) => setFormData({ ...formData, card: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-emerald-300 rounded-lg bg-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border-2 border-yellow-200">
                    <h3 className="text-lg font-bold text-yellow-700 mb-4">💵 ΜΕΡΟΚΑΜΑΤΑ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ποσό (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.wages}
                          onChange={(e) => setFormData({ ...formData, wages: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-yellow-300 rounded-lg bg-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Περιγραφή</label>
                        <input
                          type="text"
                          value={formData.wagesDescription}
                          onChange={(e) => setFormData({ ...formData, wagesDescription: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-yellow-300 rounded-lg bg-white"
                          placeholder="π.χ. 5 άτομα"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border-2 border-orange-200">
                    <h3 className="text-lg font-bold text-orange-700 mb-4">💸 ΑΛΛΑ ΕΞΟΔΑ</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ποσό (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.expenses}
                          onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg bg-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Κατηγορία</label>
                        <select
                          value={formData.expenseCategory}
                          onChange={(e) => setFormData({ ...formData, expenseCategory: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg bg-white"
                        >
                          {expenseCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Πληρωμή Από:</label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="cash"
                              checked={formData.expenseSource === 'cash'}
                              onChange={(e) => setFormData({ ...formData, expenseSource: e.target.value })}
                              className="mr-2"
                            />
                            <span className="font-semibold">💰 Μετρητά</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="bank"
                              checked={formData.expenseSource === 'bank'}
                              onChange={(e) => setFormData({ ...formData, expenseSource: e.target.value })}
                              className="mr-2"
                            />
                            <span className="font-semibold">🏦 Τράπεζα</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-2 rounded-lg"
                    >
                      {editingId ? 'Ενημέρωση' : 'Αποθήκευση'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg"
                    >
                      Άκυρο
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'daily' && (
          <div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Μαγαζί:</label>
              <select
                value={selectedShopReport}
                onChange={(e) => setSelectedShopReport(e.target.value)}
                className="px-4 py-2 border-2 border-orange-200 rounded-lg bg-orange-50 font-semibold w-full md:w-64"
              >
                {shops.map(shop => (
                  <option key={shop} value={shop}>{shop}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-orange-200">
              <div className="bg-gradient-to-r from-orange-300 to-orange-100 text-orange-900 p-6">
                <h2 className="text-2xl font-bold">📅 Ημερήσιο - {selectedShopReport}</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-orange-50 border-b-2 border-orange-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Ημερομηνία</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">💰 Μετρητά</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">🏦 Κάρτες</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">📊 Σύνολο</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">💵 Μεροκάματα</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(t => t.type === 'transaction' && t.shop === selectedShopReport)
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((t, idx) => (
                        <tr key={t.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-orange-50'} border-b border-orange-100`}>
                          <td className="px-4 py-3 text-sm font-semibold">{t.date}</td>
                          <td className="px-4 py-3 text-sm text-right text-emerald-700 font-semibold">{t.cash.toFixed(2)}€</td>
                          <td className="px-4 py-3 text-sm text-right text-blue-700 font-semibold">{t.card.toFixed(2)}€</td>
                          <td className="px-4 py-3 text-sm text-right text-green-700 font-bold">{t.totalIncome.toFixed(2)}€</td>
                          <td className="px-4 py-3 text-sm text-right text-yellow-700 font-semibold">{t.wages.toFixed(2)}€</td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-orange-100 border-t-2 border-orange-300 font-bold">
                    <tr>
                      <td className="px-4 py-3 text-sm">ΣΥΝΟΛΑ</td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-700">
                        {transactions.filter(t => t.type === 'transaction' && t.shop === selectedShopReport).reduce((sum, t) => sum + t.cash, 0).toFixed(2)}€
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-700">
                        {transactions.filter(t => t.type === 'transaction' && t.shop === selectedShopReport).reduce((sum, t) => sum + t.card, 0).toFixed(2)}€
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-700">
                        {transactions.filter(t => t.type === 'transaction' && t.shop === selectedShopReport).reduce((sum, t) => sum + t.totalIncome, 0).toFixed(2)}€
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-yellow-700">
                        {transactions.filter(t => t.type === 'transaction' && t.shop === selectedShopReport).reduce((sum, t) => sum + t.wages, 0).toFixed(2)}€
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-red-200">
            <div className="bg-gradient-to-r from-red-300 to-red-100 text-red-900 p-6">
              <h2 className="text-2xl font-bold">💸 Έξοδα</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-50 border-b-2 border-red-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Ημερομηνία</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Μαγαζί</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Ποσό</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Κατηγορία</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Από</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter(t => t.type === 'transaction' && t.expenses > 0)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((t, idx) => (
                      <tr key={t.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-red-50'} border-b border-red-100`}>
                        <td className="px-4 py-3 text-sm font-semibold">{t.date}</td>
                        <td className="px-4 py-3 text-sm"><span className="bg-amber-200 text-amber-900 px-2 py-1 rounded text-xs font-semibold">{t.shop}</span></td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-red-700">{t.expenses.toFixed(2)}€</td>
                        <td className="px-4 py-3 text-sm">{t.expenseCategory}</td>
                        <td className="px-4 py-3 text-sm">{t.expenseSource === 'cash' ? '💰 Μετρητά' : '🏦 Τράπεζα'}</td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="bg-red-100 border-t-2 border-red-300 font-bold">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-sm">ΣΥΝΟΛΑ ΕΞΟΔΩΝ</td>
                    <td className="px-4 py-3 text-sm text-right text-red-700">
                      {transactions.filter(t => t.type === 'transaction' && t.expenses > 0).reduce((sum, t) => sum + t.expenses, 0).toFixed(2)}€
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {transactions.map(t => (
              <div key={t.id} className="bg-white rounded-2xl shadow border-2 border-emerald-200 p-4">
                {t.type === 'transaction' && (
                  <div>
                    <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2" onClick={() => setExpandedTransaction(expandedTransaction === t.id ? null : t.id)}>
                      <div className="flex-1">
                        <p className="font-semibold">{t.date} - {t.shop}</p>
                        <p className="text-sm text-gray-600">{t.user}</p>
                      </div>
                      <p className="text-lg font-bold text-emerald-700">{t.totalIncome.toFixed(2)}€</p>
                    </div>

                    {expandedTransaction === t.id && (
                      <div className="p-4 bg-gray-50 border-t-2 mt-2">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-emerald-100 p-3 rounded">
                            <p className="text-xs text-gray-600">Μετρητά</p>
                            <p className="font-bold text-emerald-700">{t.cash.toFixed(2)}€</p>
                          </div>
                          <div className="bg-blue-100 p-3 rounded">
                            <p className="text-xs text-gray-600">Κάρτες</p>
                            <p className="font-bold text-blue-700">{t.card.toFixed(2)}€</p>
                          </div>
                          <div className="bg-yellow-100 p-3 rounded">
                            <p className="text-xs text-gray-600">Μεροκάματα</p>
                            <p className="font-bold text-yellow-700">{t.wages.toFixed(2)}€</p>
                          </div>
                          <div className="bg-orange-100 p-3 rounded">
                            <p className="text-xs text-gray-600">Έξοδα</p>
                            <p className="font-bold text-orange-700">{t.expenses.toFixed(2)}€</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTransaction(t)}
                            className="flex-1 bg-blue-300 hover:bg-blue-400 text-blue-900 font-bold py-2 rounded flex items-center justify-center gap-2"
                          >
                            <Edit2 size={18} />
                            Επεξεργασία
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="flex-1 bg-red-300 hover:bg-red-400 text-red-900 font-bold py-2 rounded flex items-center justify-center gap-2"
                          >
                            <Trash2 size={18} />
                            Διαγραφή
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {t.type === 'transfer' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Ανάληψη</p>
                      <p className="text-sm text-gray-600">{t.date} - {t.user}</p>
                    </div>
                    <p className="text-lg font-bold text-purple-700">{t.amount.toFixed(2)}€</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-cyan-200">
            <h2 className="text-2xl font-bold mb-6">💾 Backup</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => {
                  const data = JSON.stringify(transactions);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `tamieio_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}
                className="bg-emerald-300 hover:bg-emerald-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Backup (JSON)
              </button>

              <label className="bg-blue-300 hover:bg-blue-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer">
                <Download size={20} />
                Ανάκτηση
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        try {
                          const data = JSON.parse(evt.target.result);
                          setTransactions(data);
                          alert('✅ Ανάκτηση επιτυχής!');
                        } catch {
                          alert('❌ Σφάλμα');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TamieioApp;
