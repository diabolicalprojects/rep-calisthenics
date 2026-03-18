import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

export const useMembersData = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getMembers();
            // Data is already camelCased from backend logic if using the latest db.js, 
            // but we ensure it matches what expectations.
            setMembers(data);
        } catch (err) {
            console.error("Error fetching members:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const deleteMember = async (id) => {
        try {
            await api.deleteMember(id);
            setMembers(prev => prev.filter(m => m.id !== id));
            return true;
        } catch (err) {
            console.error("Error deleting member:", err);
            throw err;
        }
    };

    const updateMember = async (id, data) => {
        try {
            const updated = await api.updateMember(id, data);
            setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
            return updated;
        } catch (err) {
            console.error("Error updating member:", err);
            throw err;
        }
    };

    return { 
        members, 
        loading, 
        error, 
        refetch: fetchMembers, 
        deleteMember,
        updateMember
    };
};
