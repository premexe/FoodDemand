import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, loginWithSocial, register } from '../auth/auth';

export default function LoginModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });

    if (!isOpen) return null;

    const validateForm = () => {
        if (isSignUp && !formData.name.trim()) {
            setAuthError('Name is required.');
            return false;
        }
        if (!formData.email.trim()) {
            setAuthError('Email is required.');
            return false;
        }
        if (!formData.password) {
            setAuthError('Password is required.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            if (isSignUp) {
                await register({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                });
            } else {
                await login({
                    email: formData.email,
                    password: formData.password,
                    remember: true,
                });
            }
            navigate('/dashboard', { replace: true });
            onClose();
        } catch (error) {
            setAuthError(error.message || 'Authentication failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        setAuthError('');
        setIsLoading(true);
        try {
            await loginWithSocial(provider, true);
            navigate('/dashboard', { replace: true });
            onClose();
        } catch (error) {
            setAuthError(error.message || `Unable to continue with ${provider}.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setAuthError('');
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
        >
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

            {/* Modal Container */}
            <div
                className="relative w-full max-w-md animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Glossy Card with Glassmorphism */}
                <div className="relative bg-[#0a0a0a] border border-white/5 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] overflow-hidden group">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00ff9d]/5 via-transparent to-transparent opacity-50" />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-20 w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all duration-300 hover:rotate-90"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Content */}
                    <div className="relative p-12">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-3 mb-6">
                                <div className="w-3 h-3 rounded-full bg-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.5)]" />
                                <span className="text-2xl font-black text-white tracking-tighter uppercase">CookIQ.ai</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3 uppercase tracking-tighter">
                                {isSignUp ? 'Apply for release' : 'External Access'}
                            </h2>
                            <p className="text-white/40 text-sm font-medium">
                                {isSignUp ? 'Join the next generation of culinary AI.' : 'Secure portal for verified enterprises.'}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {authError && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest animate-shake">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        {authError}
                                    </div>
                                </div>
                            )}
                            {isSignUp && (
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/10 focus:outline-none focus:ring-1 focus:ring-[#00ff9d]/50 focus:bg-white/[0.08] transition-all duration-300 text-sm font-medium"
                                        placeholder="Enter your name"
                                        required={isSignUp}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/10 focus:outline-none focus:ring-1 focus:ring-[#00ff9d]/50 focus:bg-white/[0.08] transition-all duration-300 text-sm font-medium"
                                    placeholder="name@enterprise.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/10 focus:outline-none focus:ring-1 focus:ring-[#00ff9d]/50 focus:bg-white/[0.08] transition-all duration-300 text-sm font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 px-6 rounded-xl bg-[#00ff9d] text-black font-black shadow-[0_20px_40px_-12px_rgba(0,255,157,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        <span>SECURE ACCESS...</span>
                                    </div>
                                ) : (
                                    isSignUp ? 'Request Journey' : 'Validate & Enter'
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/5"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-[#0a0a0a] px-4 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">OR ALPHA ENTRY</span>
                                </div>
                            </div>

                            {/* Social Logins */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleSocialLogin('Google')}
                                    disabled={isLoading}
                                    className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white/[0.03] border border-white/10 text-white hover:bg-white/[0.08] transition-all duration-300 group/social disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5 transition-transform duration-300 group-hover/social:scale-110" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            className="text-[#4285F4]"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            className="text-[#34A853]"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            className="text-[#FBBC05]"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                            className="text-[#EA4335]"
                                        />
                                    </svg>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Google</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSocialLogin('Facebook')}
                                    disabled={isLoading}
                                    className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white/[0.03] border border-white/10 text-white hover:bg-white/[0.08] transition-all duration-300 group/social disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5 transition-transform duration-300 group-hover/social:scale-110" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.248h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                            className="text-[#1877F2]"
                                        />
                                    </svg>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Facebook</span>
                                </button>
                            </div>
                        </form>

                        {/* Toggle Sign Up/Sign In */}
                        <div className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-white/20">
                            {isSignUp ? 'Already a partner?' : "Interested in early release?"}{' '}
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-[#00ff9d] hover:text-[#00ff9d]/80 transition-colors ml-2"
                            >
                                {isSignUp ? 'Sign In' : 'Apply Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
