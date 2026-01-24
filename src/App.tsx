import { Navbar } from "./components/navbar";
import { UploadView } from "./components/uploadView";


export function App() {
  return (
    <>
      <Navbar />
      <div className="w-1/5 mx-auto">
        <UploadView />
      </div>
      
    </>
  );
}

export default App;
