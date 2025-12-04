import { pdf } from "@react-pdf/renderer";
import "../App.css";
import TicketDocument from "../components/Ticket";
import Router from "./routes";

function App() {
  return <Router />;
  return {
    /** <>
      <div className="flex justify-center align-middle h-screen">
        <button
          className="btn bg-green-500 text-white rounded-2xl p-4 m-4 hover:bg-green-700 w-[120px] h-[50px] flex items-center justify-center"
          onClick={handlePrint}
        >
          IMPRIMIR
        </button>
      <div className="h-full w-full ">
          <PDFViewer height="full" className="border h-full w-full">
            <TicketDocument />
          </PDFViewer>
        </div>f
      </div>
    </> */
  };
}

export default App;
