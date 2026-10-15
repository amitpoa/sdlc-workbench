import Home from '@/app/page';

// Every public entry starts with project selection, including direct hash links.
export default function WorkbenchEntry({ onExit }: { onExit: () => void }) {
  return <Home onExit={onExit}/>;
}
