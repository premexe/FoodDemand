import React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

export default function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
      {'Copyright © '}
      <Link color="inherit" href="#">
        Food Demand Forecasting
      </Link>
      {` ${new Date().getFullYear()}.`}
    </Typography>
  );
}
