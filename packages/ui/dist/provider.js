import { jsx as _jsx } from "react/jsx-runtime";
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import { hermesThemeStorageKey } from './theme';
const hermesHomeSystem = createSystem(defaultConfig, {
    globalCss: {
        html: {
            fontSize: '15px'
        },
        body: {
            lineHeight: '1.5'
        }
    },
    theme: {
        tokens: {
            radii: {
                md: { value: '0.375rem' },
                lg: { value: '0.5rem' },
                xl: { value: '0.5rem' },
                '2xl': { value: '0.5rem' }
            }
        }
    }
});
export function HermesUiProvider({ children }) {
    return (_jsx(ChakraProvider, { value: hermesHomeSystem, children: _jsx(ThemeProvider, { attribute: "class", disableTransitionOnChange: true, defaultTheme: "dark", enableSystem: false, storageKey: hermesThemeStorageKey, children: children }) }));
}
