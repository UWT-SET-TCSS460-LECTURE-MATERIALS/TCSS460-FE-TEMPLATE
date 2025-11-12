// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// project import
import DrawerHeaderStyled from './DrawerHeaderStyled';
import Logo from 'components/logo';

import { MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';

// ==============================|| DRAWER HEADER ||============================== //

interface Props {
  open: boolean;
}

export default function DrawerHeader({ open }: Props) {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { menuOrientation } = useConfig();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

  return (
    <DrawerHeaderStyled
      open={open}
      sx={[
        {
          width: isHorizontal ? { xs: '100%', lg: '424px' } : 'initial',
          paddingTop: isHorizontal ? { xs: '10px', lg: '0' } : '8px',
          paddingBottom: isHorizontal ? { xs: '18px', lg: '0' } : '8px',
          paddingLeft: isHorizontal ? { xs: '24px', lg: '0' } : open ? '24px' : 0
        },
        isHorizontal
          ? {
              minHeight: 'unset'
            }
          : {
              minHeight: '60px'
            }
      ]}
    >
      <Logo
        isIcon={!open}
        sx={[
          {
            height: 35
          },
          open
            ? {
                width: 'auto'
              }
            : {
                width: 35
              }
        ]}
      />
    </DrawerHeaderStyled>
  );
}
