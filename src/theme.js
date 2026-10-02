import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E5BF35',
      dark: '#b8941f',
      light: '#f3d663',
      contrastText: '#0B0E14'
    },
    secondary: {
      main: '#00E5FF',
      dark: '#00b3cc',
      light: '#66f0ff',
      contrastText: '#0B0E14'
    },
    background: {
      default: '#0B0E14',
      paper: '#121824'
    },
    text: {
      primary: '#F0F4F8',
      secondary: '#94A3B8'
    },
    info: {
      main: '#00E5FF'
    },
    warning: {
      main: '#FF9800'
    },
    success: {
      main: '#10B981'
    },
    error: {
      main: '#EF4444'
    }
  },
  typography: {
    fontFamily: '"Cinzel", "Orbitron", "Inter", "Roboto", sans-serif',
    h1: { fontFamily: '"Cinzel", serif', fontWeight: 800 },
    h2: { fontFamily: '"Cinzel", serif', fontWeight: 800 },
    h3: { fontFamily: '"Cinzel", serif', fontWeight: 700 },
    h4: { fontFamily: '"Cinzel", serif', fontWeight: 700 },
    h5: { fontFamily: '"Cinzel", serif', fontWeight: 700 },
    h6: { fontFamily: '"Cinzel", serif', fontWeight: 700 },
    subtitle1: { fontFamily: '"Inter", sans-serif', fontWeight: 600 },
    subtitle2: { fontFamily: '"Inter", sans-serif', fontWeight: 500 },
    body1: { fontFamily: '"Inter", sans-serif' },
    body2: { fontFamily: '"Inter", sans-serif' },
    button: { fontFamily: '"Orbitron", sans-serif', fontWeight: 700, letterSpacing: '0.8px' }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0B0E14',
          color: '#F0F4F8',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#E5BF35',
            borderRadius: '4px'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(11, 14, 20, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(229, 191, 53, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#121824',
          border: '1px solid rgba(229, 191, 53, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
          textTransform: 'uppercase',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 20px rgba(229, 191, 53, 0.35)'
          }
        },
        containedPrimary: {
          backgroundColor: '#E5BF35',
          color: '#0B0E14',
          '&:hover': {
            backgroundColor: '#f3d663'
          }
        },
        outlinedPrimary: {
          borderColor: 'rgba(229, 191, 53, 0.5)',
          color: '#E5BF35',
          '&:hover': {
            borderColor: '#E5BF35',
            backgroundColor: 'rgba(229, 191, 53, 0.1)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(18, 24, 36, 0.8)',
            borderRadius: 10,
            '& fieldset': {
              borderColor: 'rgba(229, 191, 53, 0.3)'
            },
            '&:hover fieldset': {
              borderColor: '#E5BF35'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#E5BF35',
              borderWidth: 2
            }
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(18, 24, 36, 0.8)',
          borderRadius: 10,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(229, 191, 53, 0.3)'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E5BF35'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E5BF35'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#121824',
          border: '1px solid rgba(229, 191, 53, 0.4)',
          borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8)'
        }
      }
    }
  }
})
