import TicketDocument from "@/components/Ticket";
import { pdf, PDFViewer } from "@react-pdf/renderer";

const Dashboard = () => {
  const handlePrint = async () => {
    const blob = await pdf(<TicketDocument />).toBlob();
    const url = URL.createObjectURL(blob);

    const win = window.open(url);

    if (win) {
      win.onload = () => {
        win.focus();
        win.print();
      };
    }
  };
  return (
    <>
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
        </div>
        f
      </div>
    </>
  );
};
export default Dashboard;
