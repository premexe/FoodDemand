import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import {
  isAuthenticated,
  login,
  loginWithSocial,
  register,
  sendEmailOtp,
  sendPhoneOtp,
  verifyEmailOtp,
  verifyPhoneOtp,
} from '../../auth/auth.js';

import { GoogleIcon, FacebookIcon } from './CustomIcons.jsx';

const OrDivider = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3),
  color: theme.palette.text.secondary,
  '&::before, &::after': {
    content: '""',
    display: 'block',
    flexGrow: 1,
    height: '1px',
    backgroundColor: theme.palette.divider,
  },
  '&::before': {
    marginRight: theme.spacing(2),
  },
  '&::after': {
    marginLeft: theme.spacing(2),
  },
}));

export default function SignInCard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [verificationMethod, setVerificationMethod] = React.useState('phone');
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    otpCode: '',
    persistent: false,
  });
  const [formError, setFormError] = React.useState('');
  const [otpStatus, setOtpStatus] = React.useState({
    sessionId: '',
    verificationId: '',
    verified: false,
    message: '',
  });

  const resetOtpState = React.useCallback(() => {
    setOtpStatus({ sessionId: '', verificationId: '', verified: false, message: '' });
    setForm((prev) => ({ ...prev, otpCode: '' }));
  }, []);

  React.useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    setIsLoading(true);
    try {
      if (isSignUp) {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          verificationMethod,
          phoneNumber: form.phoneNumber,
          phoneVerificationId: verificationMethod === 'phone' ? otpStatus.verificationId : '',
          emailVerificationId: verificationMethod === 'email' ? otpStatus.verificationId : '',
        });
      } else {
        await login({
          email: form.email,
          password: form.password,
          remember: form.persistent,
        });
      }
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error.message || 'Unable to authenticate.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider) => {
    setFormError('');
    setIsLoading(true);
    try {
      await loginWithSocial(provider, form.persistent);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error.message || `Unable to continue with ${provider}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setFormError('');
    setOtpStatus((prev) => ({ ...prev, message: '' }));
    setIsLoading(true);
    try {
      if (verificationMethod === 'phone') {
        const response = await sendPhoneOtp({
          phoneNumber: form.phoneNumber,
          recaptchaContainerId: 'signup-recaptcha-card',
        });
        setOtpStatus({
          sessionId: response.sessionId,
          verificationId: '',
          verified: false,
          message: `OTP sent to ${response.phoneNumber}`,
        });
      } else {
        const response = await sendEmailOtp({ email: form.email });
        setOtpStatus({
          sessionId: response.sessionId,
          verificationId: '',
          verified: false,
          message: `OTP sent to ${response.email}`,
        });
      }
    } catch (error) {
      setFormError(error.message || 'Unable to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setFormError('');
    setOtpStatus((prev) => ({ ...prev, message: '' }));
    setIsLoading(true);
    try {
      const response = verificationMethod === 'phone'
        ? await verifyPhoneOtp({ sessionId: otpStatus.sessionId, otpCode: form.otpCode })
        : await verifyEmailOtp({ sessionId: otpStatus.sessionId, otpCode: form.otpCode });

      setOtpStatus({
        sessionId: '',
        verificationId: response.verificationId,
        verified: true,
        message: verificationMethod === 'phone'
          ? `Phone verified: ${response.phoneNumber}`
          : `Email verified: ${response.email}`,
      });
    } catch (error) {
      setFormError(error.message || 'Unable to verify OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack
      sx={[
        {
          width: '100%',
          maxWidth: '450px',
          gap: 3,
        },
        (theme) => ({
          [theme.breakpoints.up('sm')]: {
            p: 5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '20px',
            boxShadow: '0 8px 16px hsla(220, 30%, 5%, 0.05)',
            ...theme.applyStyles('dark', {
              borderColor: 'primary.800',
              boxShadow: '0 8px 16px hsla(220, 30%, 5%, 0.5)',
            }),
          },
        }),
      ]}
    >
      <Typography component="h1" variant="h4" sx={{ width: '100%', fontSize: { xs: '2rem', sm: '2.5rem' } }}>
        {isSignUp ? 'Create account' : 'Sign in'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack sx={{ gap: 2 }}>
          {isSignUp && (
            <>
              <TextField
                autoFocus
                fullWidth
                required
                label="Full name"
                type="text"
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <TextField
                fullWidth
                required
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (verificationMethod === 'email') {
                    resetOtpState();
                  }
                }}
              />
              <Stack direction="row" sx={{ gap: 1 }}>
                <Button
                  type="button"
                  variant={verificationMethod === 'phone' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setVerificationMethod('phone');
                    resetOtpState();
                  }}
                >
                  Phone OTP
                </Button>
                <Button
                  type="button"
                  variant={verificationMethod === 'email' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setVerificationMethod('email');
                    resetOtpState();
                  }}
                >
                  Email OTP
                </Button>
              </Stack>

              {verificationMethod === 'phone' && (
                <TextField
                  fullWidth
                  required
                  label="Indian mobile (+91)"
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={(e) => {
                    setForm({ ...form, phoneNumber: e.target.value });
                    resetOtpState();
                  }}
                  placeholder="+919876543210"
                />
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleSendOtp}
                  disabled={isLoading || otpStatus.verified}
                >
                  Send OTP
                </Button>
                <TextField
                  fullWidth
                  required
                  label="OTP"
                  type="text"
                  name="otpCode"
                  value={form.otpCode}
                  onChange={(e) => setForm({ ...form, otpCode: e.target.value })}
                  placeholder="6-digit code"
                  inputProps={{ maxLength: 6 }}
                />
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleVerifyOtp}
                  disabled={isLoading || !otpStatus.sessionId || otpStatus.verified}
                >
                  Verify
                </Button>
              </Stack>

              {verificationMethod === 'phone' && <div id="signup-recaptcha-card" />}

              {(otpStatus.message || otpStatus.verified) && (
                <FormHelperText sx={{ color: otpStatus.verified ? 'success.main' : 'text.secondary' }}>
                  {otpStatus.verified ? 'OTP verified. You can create account now.' : otpStatus.message}
                </FormHelperText>
              )}
            </>
          )}

          {!isSignUp && (
            <TextField
              autoFocus
              fullWidth
              required
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          )}

          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2" component="label" sx={{ fontWeight: 'medium' }}>
              Password
            </Typography>
            <Link href="#" variant="body2">
              Forgot your password?
            </Link>
          </Stack>

          <TextField
            fullWidth
            required
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <FormControlLabel
            control={<Checkbox name="persistent" checked={form.persistent} onChange={(e) => setForm({ ...form, persistent: e.target.checked })} />}
            label="Remember me"
          />

          {formError && (
            <FormHelperText error sx={{ my: 1, p: 1, borderRadius: '8px' }}>
              {formError}
            </FormHelperText>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isLoading || (isSignUp && !otpStatus.verified)}
          >
            {isLoading ? 'Verifying...' : isSignUp ? 'Create account' : 'Sign in'}
          </Button>

          <Stack direction="row" sx={{ gap: 1 }}>
            <Button
              type="button"
              variant={isSignUp ? 'outlined' : 'contained'}
              onClick={() => {
                setFormError('');
                setIsSignUp(false);
                setVerificationMethod('phone');
                resetOtpState();
              }}
              sx={{ flex: 1 }}
            >
              Sign in
            </Button>
            <Button
              type="button"
              variant={isSignUp ? 'contained' : 'outlined'}
              onClick={() => {
                setFormError('');
                setIsSignUp(true);
                setVerificationMethod('phone');
                resetOtpState();
              }}
              sx={{ flex: 1 }}
            >
              Sign up
            </Button>
          </Stack>
        </Stack>
      </form>

      <OrDivider>or</OrDivider>
      <Stack sx={{ gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          startIcon={<GoogleIcon />}
          onClick={() => handleSocialSignIn('Google')}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting Google...' : 'Sign in with Google'}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          startIcon={<FacebookIcon />}
          onClick={() => handleSocialSignIn('Facebook')}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting Facebook...' : 'Sign in with Facebook'}
        </Button>
      </Stack>
    </Stack>
  );
}

