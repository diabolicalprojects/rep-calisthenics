const API_URL = import.meta.env.VITE_API_URL || '/api'; 

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Server Error' }));
    let errorMessage = 'Server Error';
    if (Array.isArray(error.error)) {
      errorMessage = error.error.map(err => `${err.path ? err.path.join('.') + ': ' : ''}${err.message}`).join(', ');
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // AUTH / USERS
  login: (data) => fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  
  getUsers: () => fetch(`${API_URL}/users`, { headers: getAuthHeaders() }).then(handleResponse),
  addUser: (data) => fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateUser: (id, data) => fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteUser: (id) => fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse),


  // MEMBERS
  getMembers: () => fetch(`${API_URL}/members`, { headers: getAuthHeaders() }).then(handleResponse),
  addMember: (data) => fetch(`${API_URL}/members`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateMember: (id, data) => fetch(`${API_URL}/members/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteMember: (id) => fetch(`${API_URL}/members/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse),

  // INVENTORY
  getInventory: () => fetch(`${API_URL}/inventory`, { headers: getAuthHeaders() }).then(handleResponse),
  addInventoryItem: (data) => fetch(`${API_URL}/inventory`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateStock: (id, quantity) => fetch(`${API_URL}/inventory/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ quantity })
  }).then(handleResponse),
  deleteInventoryItem: (id) => fetch(`${API_URL}/inventory/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse),

  // APPOINTMENTS
  getAppointments: (date) => fetch(`${API_URL}/appointments${date ? `?date=${date}` : ''}`, { headers: getAuthHeaders() }).then(handleResponse),
  addAppointment: (data) => fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateAppointmentStatus: (id, status) => fetch(`${API_URL}/appointments/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  }).then(handleResponse),
  updateAppointment: (id, data) => fetch(`${API_URL}/appointments/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),

  // PAYMENTS (Accounting)
  getPayments: () => fetch(`${API_URL}/payments`, { headers: getAuthHeaders() }).then(handleResponse),
  addPayment: (data) => fetch(`${API_URL}/payments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),

  // MEMBERSHIPS
  getMemberships: () => fetch(`${API_URL}/memberships`, { headers: getAuthHeaders() }).then(handleResponse),
  addMembership: (data) => fetch(`${API_URL}/memberships`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateMembership: (id, data) => fetch(`${API_URL}/memberships/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteMembership: (id) => fetch(`${API_URL}/memberships/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse),

  // ROUTINES
  getRoutines: () => fetch(`${API_URL}/routines`, { headers: getAuthHeaders() }).then(handleResponse),
  addRoutine: (data) => fetch(`${API_URL}/routines`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateRoutine: (id, data) => fetch(`${API_URL}/routines/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteRoutine: (id) => fetch(`${API_URL}/routines/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse),

  // TRANSACTIONS
  getTransactions: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return fetch(`${API_URL}/transactions?${params.toString()}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  createTransaction: (data) => fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // VISITS
  getVisits: () => fetch(`${API_URL}/visits`, { headers: getAuthHeaders() }).then(handleResponse),
  recordVisit: (data) => fetch(`${API_URL}/visits`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // EXPENSES
  getExpenses: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return fetch(`${API_URL}/expenses?${params.toString()}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  createExpense: (data) => fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // EXPENSE CATEGORIES
  getExpenseCategories: () => fetch(`${API_URL}/expenses/categories`, { headers: getAuthHeaders() }).then(handleResponse),
  createExpenseCategory: (name) => fetch(`${API_URL}/expenses/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name })
  }).then(handleResponse),
  deleteExpenseCategory: (id) => fetch(`${API_URL}/expenses/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse),
  
  // NOTIFICATIONS
  getNotifications: () => fetch(`${API_URL}/notifications`, { headers: getAuthHeaders() }).then(handleResponse),

  // PUBLIC BOOKING
  getPublicAvailability: (date) => fetch(`${API_URL}/public/appointments?date=${date}`).then(handleResponse),
};
