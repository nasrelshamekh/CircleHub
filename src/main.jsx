import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ThemeContextProvider from './context/ThemeContext.jsx'
import AuthContextProvider from './context/AuthContext.jsx'
import ChatConnectionContextProvider from './context/ChatConnectionContext.jsx'
import { Toaster } from 'sonner'
import SidebarContextProvider from './context/SidebarContext.jsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <AuthContextProvider>
          <ChatConnectionContextProvider>
            <SidebarContextProvider>
              <App />
            </SidebarContextProvider>
          </ChatConnectionContextProvider>
        </AuthContextProvider>
        <Toaster position="top-right" />
      </ThemeContextProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
)
