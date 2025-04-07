import { Button } from "@/components/ui/button";
import { TRPCProvider } from "./providers/trpc-provider";

function App() {
  return (
    <div>
      <TRPCProvider>
        <Button>Click me</Button>
      </TRPCProvider>
    </div>
  );
}

export default App;
