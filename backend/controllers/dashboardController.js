// Mock function — later you can replace it with real DB data
const getDashboardStats = (req, res) => {
  const stats = {
    received: 23,
    inProgress: 12,
    completed: 5,
    pendingPayments: 3,
  };
  res.json(stats);
};

module.exports = { getDashboardStats };
