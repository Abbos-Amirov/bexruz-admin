import { alpha, createTheme } from '@mui/material/styles';
import typography from './typography';

/**
 * BEXRUZ admin theme: qora + qizil (mijoz sayti bilan bir xil).
 * Ranglar src/css/admin-theme.css dagi tokenlar bilan mos.
 */
const RED = '#e11d2e';
const RED_DARK = '#c3101f';

const tokens = (dark: boolean) => ({
	bg: dark ? '#0a0a0b' : '#f4f3f1',
	surface: dark ? '#141416' : '#ffffff',
	surface2: dark ? '#1d1d21' : '#efedea',
	border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(10,10,11,0.08)',
	text: dark ? '#f5f5f4' : '#0a0a0b',
	muted: dark ? '#a1a1aa' : '#5b5b63',
});

const getTheme = (darkMode: boolean) => {
	const t = tokens(darkMode);

	let theme = createTheme({
		palette: {
			mode: darkMode ? 'dark' : 'light',
			background: { default: t.bg, paper: t.surface },
			primary: { main: RED, dark: RED_DARK, contrastText: '#ffffff' },
			secondary: {
				main: darkMode ? '#f5f5f4' : '#0a0a0b',
				contrastText: darkMode ? '#0a0a0b' : '#ffffff',
			},
			error: { main: RED },
			success: { main: '#16a34a' },
			warning: { main: '#f59e0b' },
			info: { main: darkMode ? '#a1a1aa' : '#52525b' },
			text: { primary: t.text, secondary: t.muted },
			divider: t.border,
		},
		shape: { borderRadius: 12 },
		typography,
		components: {
			MuiContainer: {
				styleOverrides: { root: { height: '100%' } },
			},
			MuiCssBaseline: {
				styleOverrides: {
					html: { height: '100%' },
					body: {
						height: '100%',
						minHeight: '100%',
						backgroundColor: t.bg,
						color: t.text,
					},
				},
			},
			MuiPaper: {
				defaultProps: { elevation: 0 },
				styleOverrides: {
					root: { backgroundImage: 'none' },
					rounded: { borderRadius: 16 },
					outlined: { borderColor: t.border },
					elevation1: { border: `1px solid ${t.border}` },
					elevation2: { border: `1px solid ${t.border}` },
					elevation3: { border: `1px solid ${t.border}` },
				},
			},
			MuiCard: {
				defaultProps: { elevation: 0 },
				styleOverrides: {
					root: { border: `1px solid ${t.border}`, borderRadius: 16 },
				},
			},
			MuiButton: {
				defaultProps: { disableElevation: true },
				styleOverrides: {
					root: { textTransform: 'none', fontWeight: 700, borderRadius: 10 },
					containedPrimary: {
						boxShadow: `0 8px 20px ${alpha(RED, 0.28)}`,
						'&:hover': { backgroundColor: RED_DARK, boxShadow: `0 8px 20px ${alpha(RED, 0.36)}` },
					},
					outlined: { borderColor: t.border },
				},
			},
			MuiIconButton: {
				styleOverrides: { root: { borderRadius: 10 } },
			},
			MuiChip: {
				styleOverrides: {
					root: { fontWeight: 700, borderRadius: 8 },
					sizeSmall: { height: 24, fontSize: 12 },
				},
			},
			MuiOutlinedInput: {
				styleOverrides: {
					root: {
						borderRadius: 10,
						backgroundColor: t.surface,
						'& .MuiOutlinedInput-notchedOutline': { borderColor: t.border },
						'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: t.muted },
						'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
							borderColor: RED,
							borderWidth: 1,
							boxShadow: `0 0 0 4px ${alpha(RED, 0.12)}`,
						},
					},
				},
			},
			MuiInputLabel: {
				styleOverrides: {
					root: { '&.Mui-focused': { color: RED } },
				},
			},
			MuiTableContainer: {
				styleOverrides: {
					root: { borderRadius: 16 },
				},
			},
			MuiTableCell: {
				styleOverrides: {
					root: { borderBottomColor: t.border },
					head: {
						fontSize: 12,
						fontWeight: 800,
						letterSpacing: '0.06em',
						textTransform: 'uppercase',
						color: t.muted,
						backgroundColor: t.surface2,
					},
				},
			},
			MuiTableRow: {
				styleOverrides: {
					root: {
						'&.MuiTableRow-hover:hover': { backgroundColor: alpha(RED, 0.05) },
					},
				},
			},
			MuiTabs: {
				styleOverrides: {
					indicator: { backgroundColor: RED, height: 3, borderRadius: 3 },
				},
			},
			MuiTab: {
				styleOverrides: {
					root: {
						textTransform: 'none',
						fontWeight: 700,
						'&.Mui-selected': { color: t.text },
					},
				},
			},
			MuiDialog: {
				styleOverrides: {
					paper: { borderRadius: 20, border: `1px solid ${t.border}` },
				},
			},
			MuiDialogTitle: {
				styleOverrides: { root: { fontWeight: 800 } },
			},
			MuiMenu: {
				styleOverrides: {
					paper: { borderRadius: 14, border: `1px solid ${t.border}` },
				},
			},
			MuiPopover: {
				styleOverrides: {
					paper: { borderRadius: 14, border: `1px solid ${t.border}` },
				},
			},
			MuiMenuItem: {
				styleOverrides: {
					root: {
						fontWeight: 600,
						'&.Mui-selected, &.Mui-selected:hover': {
							backgroundColor: alpha(RED, 0.14),
							color: RED,
						},
					},
				},
			},
			MuiPaginationItem: {
				styleOverrides: {
					root: {
						fontWeight: 700,
						borderRadius: 10,
						'&.Mui-selected, &.Mui-selected:hover': {
							backgroundColor: RED,
							color: '#ffffff',
						},
					},
				},
			},
			MuiBadge: {
				styleOverrides: {
					colorError: { backgroundColor: RED },
				},
			},
			MuiAvatar: {
				styleOverrides: {
					root: { fontWeight: 800 },
				},
			},
			MuiTooltip: {
				styleOverrides: {
					tooltip: { borderRadius: 8, fontWeight: 600 },
				},
			},
		},
	});

	theme = createTheme(theme, {
		components: {
			MuiContainer: {
				styleOverrides: {
					maxWidthLg: {
						[theme.breakpoints.up('lg')]: { maxWidth: '1300px' },
					},
				},
			},
		},
	});
	return theme;
};

export default getTheme;
