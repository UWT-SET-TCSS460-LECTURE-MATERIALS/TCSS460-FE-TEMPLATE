// material-ui
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';

// project imports
import MainCard from 'components/MainCard';

import ContactHeader from 'sections/contact-us/ContactHeader';

// ==============================|| CONTACT US - MAIN ||============================== //

export default function Example() {
  return (
    <Grid container spacing={12} justifyContent="center" alignItems="center" sx={{ mb: 12 }}>
      <Grid item xs={9}>
        <MainCard title="Full Page example" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Lorem ipsum dolor sit amen, consenter nipissing eli, sed do elusion tempos incident ut laborers et doolie magna alissa. Ut enif
            ad minim venice, quin nostrum exercitation illampu laborings nisi ut liquid ex ea commons construal. Duos aube grue dolor in
            reprehended in voltage veil esse colum doolie eu fujian bulla parian. Exceptive sin ocean cuspidate non president, sunk in culpa
            qui officiate descent molls anim id est labours.
          </Typography>
        </MainCard>
      </Grid>
    </Grid>
  );
}
