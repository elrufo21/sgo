import { GlobalDialog } from "@/components/common/GlobalDialog";
import "../App.css";
import Router from "./routes";

function App() {
  return (
    <>
      <GlobalDialog />
      <Router />
    </>
  );
}

export default App;
