import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{minHeight: '100vh', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <style>{`
        .header {
          width: 100%;
          background: #222;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 4px 0;
          text-align: center;
        }
        .header-title {
          font-size: 2rem;
          font-weight: bold;
          color: #fff;
        }
        .footer {
          width: 100%;
          background: #222;
          box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
          text-align: center;
          padding: 8px 0;
          color: #aaa;
          font-size: 1rem;
        }
        .main-centered {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: calc(100vh - 64px);
          width: 100%;
        }
        .main-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 32px;
          width: 100%;
        }
      `}</style>
      <header className="header">
        <div>
          <h2 className="header-title">one more second</h2>
        </div>
      </header>
      
      <main className="main-centered">
        <div className="main-row">
          {Array.isArray(children) ? children.map((child, idx) => (
            <div key={idx}>{child}</div>
          )) : children}
        </div>
      </main>

      <footer className="footer">
        <div>
          <p>© one more second</p>
        </div>
      </footer>
    </div>
  );
} 