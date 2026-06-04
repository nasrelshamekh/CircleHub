import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ThemeContextProvider from './context/ThemeContext'
import AuthContextProvider from './context/AuthContext'
import PostsContextProvider from './context/PostsContext'
import { Toaster } from 'sonner'
import CommunitiesContextProvider from './context/CommunitiesContext'
import SidebarContextProvider from './context/SidebarContext'
import CommunityPostsContextProvider from './context/CommunityPostsContext'

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
