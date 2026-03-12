const API_URL = '/api'; // In production with Nginx, this works. In dev, we need a proxy or full URL.

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Server Error');
  }
  return response.json();
};

export const api = {
  // AUTH
  login: (data) => fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // MEMBERS
  getMembers: () => fetch(`${API_URL}/members`).then(handleResponse),
  createMember: (data) => fetch(`${API_URL}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateMember: (id, data) => fetch(`${API_URL}/members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // INVENTORY
  getInventory: () => fetch(`${API_URL}/inventory`).then(handleResponse),
  updateStock: (id, quantity) => fetch(`${API_URL}/inventory/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  }).then(handleResponse),

  // MEMBERSHIPS
  getMemberships: () => fetch(`${API_URL}/memberships`).then(handleResponse),

  // TRANSACTIONS
  getTransactions: () => fetch(`${API_URL}/transactions`).then(handleResponse),
  createTransaction: (data) => fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // VISITS
  recordVisit: (data) => fetch(`${API_URL}/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
};
