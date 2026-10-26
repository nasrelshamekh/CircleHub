import { RouterProvider } from "react-router-dom";

import router from "@/routes/router";
import OfflineBanner from "@/components/common/OfflineBanner";

function App() {
  return (
    <>
      <OfflineBanner />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
