import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';

import SignInCard from './components/SignInCard';
import Content from './components/content';

export default function SignInSide(props) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />

      {/* Theme toggle */}
      <ColorModeSelect
        sx={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 10 }}
      />

      {/* Page wrapper */}
      <Box
        component="main"
        sx={[
          {
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          (theme) => ({
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              zIndex: -1,
              backgroundRepeat: 'no-repeat',
              backgroundImage:
                'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
              ...theme.applyStyles('dark', {
                backgroundImage:
                  'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
              }),
            },
          }),
        ]}
      >
        {/* CENTERED CONTENT GROUP */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            px: { xs: 2, md: 4 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: { xs: 4, md: 10 },
              maxWidth: '1100px',
            }}
          >
            {/* LEFT INFO */}
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                width: 420,
              }}
            >
              <Content />
            </Box>

            {/* SIGN IN CARD */}
            <Box
              sx={{
                width: { xs: '100%', md: 360 },
                maxWidth: 360,
              }}
            >
              <SignInCard />
            </Box>
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
}