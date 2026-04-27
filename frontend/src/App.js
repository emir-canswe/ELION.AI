import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="elion-app">
      <div className="elion-workspace" style={{ padding: 0 }}>
        <main className="elion-main elion-main--dashboard" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Dashboard />
        </main>
      </div>
    </div>
  );
}

export default App;
