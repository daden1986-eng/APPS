import React, { useState } from 'react';
import UserPlusIcon from './icons/UserPlusIcon';
import UserIcon from './icons/UserIcon';
import LockIcon from './icons/LockIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';

interface LoginPageProps {
    onLogin: (username: string, password: string) => boolean;
    onRegister: (username: string, password: string) => { success: boolean, message: string };
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('Username dan password tidak boleh kosong.');
            return;
        }

        if (isRegister) {
            if (password !== confirmPassword) {
                setError('Password tidak cocok.');
                return;
            }
            if (password.length < 4) {
                setError('Password minimal 4 karakter.');
                return;
            }
            const result = onRegister(username, password);
            if (!result.success) {
                setError(result.message);
            }
        } else {
            const success = onLogin(username, password);
            if (!success) {
                setError('Username atau password salah.');
            }
        }
    };
    
    const toggleMode = () => {
        setIsRegister(!isRegister);
        setError('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setIsPasswordVisible(false);
    }

    const inputBaseClasses = "block w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors";

    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-200 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden">
                {/* Left Panel */}
                <div className="hidden md:flex flex-col justify-between w-full md:w-1/2 p-8 lg:p-12 bg-gradient-to-br from-indigo-600 to-blue-500 text-white">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>Sirekap DGN</h1>
                        <p className="mt-2 text-indigo-200">Solusi Keuangan Digital Anda.</p>
                    </div>
                    <div className="mt-8">
                        <p className="text-sm italic text-indigo-200/80">"Manajemen keuangan yang efisien adalah kunci pertumbuhan bisnis yang berkelanjutan."</p>
                    </div>
                </div>

                {/* Right Panel (Form) */}
                <div className="w-full md:w-1/2 p-8 lg:p-12 bg-white dark:bg-slate-800">
                    <div className="md:hidden text-center mb-6">
                        <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400">Sirekap DGN</h1>
                    </div>
                    <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-gray-100">{isRegister ? 'Buat Akun Baru' : 'Selamat Datang Kembali'}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{isRegister ? 'Isi detail di bawah untuk mendaftar.' : 'Masuk untuk melanjutkan ke dasbor Anda.'}</p>
                    
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg mb-6" role="alert">
                            <p className="font-bold text-sm">{error}</p>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Username</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className={`${inputBaseClasses} pl-11`} placeholder="cth: admin" required autoFocus />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Password</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <LockIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type={isPasswordVisible ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputBaseClasses} pl-11 pr-10`} placeholder="••••••••" required />
                                <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label={isPasswordVisible ? 'Sembunyikan password' : 'Tampilkan password'}>
                                    {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        {isRegister && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Konfirmasi Password</label>
                                 <div className="relative mt-1">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <LockIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputBaseClasses} pl-11`} placeholder="••••••••" required />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            {isRegister ? <UserPlusIcon /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>}
                            <span>{isRegister ? 'Daftar' : 'Masuk'}</span>
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                        {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}
                        <button onClick={toggleMode} className="ml-1 font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded">
                           {isRegister ? 'Masuk di sini' : 'Buat akun baru'}
                        </button>
                    </p>
                </div>
            </div>
            <footer className="text-center pt-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} Sirekap Damar Global Network.</p>
            </footer>
        </div>
    );
};

export default LoginPage;