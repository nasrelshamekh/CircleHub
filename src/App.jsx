import { RouterProvider } from "react-router-dom";

import router from "@/routes/router";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";

function App() {
  useRealtimeMessages();

  return <RouterProvider router={router} />;
}

export default App;
