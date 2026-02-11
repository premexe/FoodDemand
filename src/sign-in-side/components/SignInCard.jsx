import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { isAuthenticated, login, loginWithSocial } from '../../auth/auth.js';

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
  const [form, setForm] = React.useState({
    email: '',
    password: '',
    persistent: false,
  });
  const [formError, setFormError] = React.useState('');

  React.useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setFormError('');

    setIsLoading(true);
    try {
      await login({
        email: form.email,
        password: form.password,
        remember: form.persistent,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error.message || 'Unable to sign in.');
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
      <Typography
        component="h1"
        variant="h4"
        sx={{ width: '100%', fontSize: { xs: '2rem', sm: '2.5rem' } }}
      >
        Sign in
      </Typography>
      <form onSubmit={handleSignIn}>
        <Stack sx={{ gap: 2 }}>
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
            control={
              <Checkbox
                name="persistent"
                checked={form.persistent}
                onChange={(e) => setForm({ ...form, persistent: e.target.checked })}
              />
            }
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
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Sign in'}
          </Button>
          <Typography variant="body2">
            Don't have an account? <Link href="#">Sign up</Link>
          </Typography>
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
