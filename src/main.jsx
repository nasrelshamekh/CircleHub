import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ThemeContextProvider from './context/ThemeContext.jsx'
import AuthContextProvider from './context/AuthContext.jsx'
import PostsContextProvider from './context/PostsContext.jsx'
import { Toaster } from 'sonner'
import CommunitiesContextProvider from './context/CommunitiesContext.jsx'
import SidebarContextProvider from './context/SidebarContext.jsx'
import CommunityPostsContextProvider from './context/CommunityPostsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeContextProvider>
      <AuthContextProvider>
        <PostsContextProvider>
          <CommunityPostsContextProvider>
            <CommunitiesContextProvider>
              <SidebarContextProvider>
                <App />
              </SidebarContextProvider>
            </CommunitiesContextProvider>
          </CommunityPostsContextProvider>
        </PostsContextProvider>
      </AuthContextProvider>
      <Toaster position="top-right" />
    </ThemeContextProvider>
  </StrictMode>,
)
