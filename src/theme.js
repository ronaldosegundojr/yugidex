import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E5BF35',
      dark: '#c49a2e',
      light: '#f0d46a',
      contrastText: '#0F0F14'
    },
    secondary: {
      main: '#FF2A6D',
      dark: '#cc2257',
      light: '#ff6699',
      contrastText: '#ffffff'
    },
    background: {
      default: '#0F0F14',
      paper: '#142d66'
    },
    text: {
      primary: '#F3BF95',
      secondary: '#D48D5B'
    },
    info: {
      main: '#00D4FF'
    },
    warning: {
      main: '#C86228'
    },
    success: {
      main: '#2ed573'
    },
    error: {
      main: '#FF2A6D'
    }
  },
  typography: {
    fontFamily: '"Cinzel", "Orbitron", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Cinzel", serif', fontWeight: 700 },
    h2: { fontFamily: '"Cinzel", serif', fontWeight: 700 },
    h3: { fontFamily: '"Cinzel", serif', fontWeight: 600 },
    h4: { fontFamily: '"Cinzel", serif', fontWeight: 600 },
    h5: { fontFamily: '"Cinzel", serif', fontWeight: 600 },
    h6: { fontFamily: '"Cinzel", serif', fontWeight: 600 },
    subtitle1: { fontFamily: '"Cinzel", serif' },
    subtitle2: { fontFamily: '"Cinzel", serif' },
    button: { fontFamily: '"Cinzel", serif', fontWeight: 600, textTransform: 'uppercase' }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0F0F14',
          color: '#F3BF95',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c49a2e',
            borderRadius: '4px'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 15, 20, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(229, 191, 53, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#142d66',
          border: '1px solid rgba(229, 191, 53, 0.2)',
          borderRadius: 8
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 700,
          letterSpacing: '0.5px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 0 12px rgba(229, 191, 53, 0.4)'
          }
        },
        containedPrimary: {
          backgroundColor: '#E5BF35',
          color: '#0F0F14',
          '&:hover': {
            backgroundColor: '#f0d46a'
          }
        },
        outlinedPrimary: {
          borderColor: '#E5BF35',
          color: '#E5BF35',
          '&:hover': {
            borderColor: '#f0d46a',
            backgroundColor: 'rgba(229, 191, 53, 0.08)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(15, 15, 20, 0.6)',
            '& fieldset': {
              borderColor: 'rgba(229, 191, 53, 0.3)'
            },
            '&:hover fieldset': {
              borderColor: '#E5BF35'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#E5BF35'
            }
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 15, 20, 0.6)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 600
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0F0F14',
          border: '1px solid #E5BF35',
          boxShadow: '0 0 30px rgba(229, 191, 53, 0.25)'
        }
      }
    }
  }
})
