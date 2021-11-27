import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles'
import CoffeeIcon from '@mui/icons-material/Coffee';

const useStyles = makeStyles(theme => ({
  box: {
    position: 'fixed',
    bottom: 0,
    width: '100%'
  },
  typog: {
    textAlign: 'center', // text-align: center
    width: '100%'
  },
  toolbar: {
    backgroundColor: theme.palette.background.hover,
    padding: 0,
    minHeight: '40px'
  },
  link: {
    color: theme.palette.secondary.light,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline'
    }
  }
}))

export default function AppFooter() {

  const classes = useStyles()

  return (
    <Box sx={{ flexGrow: 1 }} className={classes.box}>
      <AppBar position="static" component="footer" sx={{ height: '40px'}}>
        <Toolbar variant="dense" className={classes.toolbar}>
          <Typography variant="caption" color="inherit" component="p" className={classes.typog}>
            Desenvolvido com <CoffeeIcon fontSize="small" /> por <a className={classes.link} href="mailto:professor@faustocintra.com.br">Prof. Fausto Cintra</a>
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}