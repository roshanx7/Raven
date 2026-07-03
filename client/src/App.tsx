import Landing from "./components/Landing";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 1000,
        }}
      />
      <Landing />
    </div>
  );
}

export default App;
