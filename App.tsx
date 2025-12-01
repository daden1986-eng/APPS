import React, { useState, useEffect } from 'react';
import { User } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
    const [users, setUsers] = useLocalStorage<User[]>('users', []);
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const storedUser = sessionStorage.getItem('currentUser');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Gagal memuat pengguna dari session storage", error);
            return null;
        }
    });

    // Inisialisasi dengan pengguna admin default jika tidak ada pengguna
    useEffect(() => {
        if (users.length === 0) {
            setUsers([{ id: '1', username: 'admin', password: 'admin' }]);
        }
    }, []); // Hanya dijalankan sekali saat komponen dimuat

    const handleLogin = (username: string, password: string): boolean => {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    };

    const handleRegister = (username: string, password: string): { success: boolean, message: string } => {
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, message: 'Username sudah digunakan.' };
        }
        const newUser: User = {
            id: new Date().getTime().toString(),
            username,
            password,
        };
        setUsers(prevUsers => [...prevUsers, newUser]);
        
        // Otomatis masuk setelah registrasi berhasil
        setCurrentUser(newUser);
        sessionStorage.setItem('currentUser', JSON.stringify(newUser));
        return { success: true, message: 'Registrasi berhasil! Anda sekarang masuk.' };
    };

    const handleLogout = () => {
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
    };

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} onRegister={handleRegister} />;
    }

    return <Dashboard currentUser={currentUser} onLogout={handleLogout} />;
}

export default App;
