import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ThemeContextProvider from './context/ThemeContext.jsx'
import AuthContextProvider from './context/AuthContext.jsx'
import ChatConnectionContextProvider from './context/ChatConnectionContext.jsx'
import DeviceKeyPublisher from './components/messages/DeviceKeyPublisher'
import { Toaster } from './components/ui/sonner'
import { MESSAGE_TOASTER_ID } from './lib/messageToast'
import SidebarContextProvider from './context/SidebarContext.jsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <AuthContextProvider>
          {/* Gives this browser its message encryption keypair once per signed-in session, before any
              conversation is opened — the send path calls ensureDeviceKey again as a safety net. */}
          <DeviceKeyPublisher />
          <ChatConnectionContextProvider>
            <SidebarContextProvider>
              <App />
            </SidebarContextProvider>
          </ChatConnectionContextProvider>
        </AuthContextProvider>
        <Toaster position="top-right" />
        {/* Message notifications get their own stack, in the opposite corner from errors. Sonner renders
            a toast only in the toaster whose id matches, so the two never share a stack. */}
        <Toaster id={MESSAGE_TOASTER_ID} position="bottom-right" />
      </ThemeContextProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
)
