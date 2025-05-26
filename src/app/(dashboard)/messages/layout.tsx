// PROJECT IMPORTS
import { MessageProvider } from 'contexts/MessageContext';

// ==============================|| DASHBOARD LAYOUT ||============================== //

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MessageProvider>{children}</MessageProvider>;
}
