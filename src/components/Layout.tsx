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
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 8px 0;
          text-align: center;
          border-bottom: 2px solid #333;
        }
        .header-title {
          font-size: 2.2rem;
          font-weight: bold;
          color: #fff;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          margin: 0;
        }
        .footer {
          width: 100%;
          background: #222;
          box-shadow: 0 -4px 6px rgba(0,0,0,0.1);
          text-align: center;
          padding: 12px 0;
          color: #aaa;
          font-size: 1rem;
          border-top: 2px solid #333;
        }
        .main-centered {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: calc(100vh - 80px);
          width: 100%;
          padding: 24px;
          position: relative;
          box-sizing: border-box;
        }
        .main-row {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          justify-content: center;
          gap: 24px;
          width: 100%;
          max-width: 1200px;
          height: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .container {
          border-radius: 16px;
          padding: 20px;
          border: 2px solid #333;
          transition: all 0.3s ease;
        }
        .container:hover {
          border-color: #444;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }
        .game-container:hover {
          transform: none;
          border-color: #333;
          box-shadow: none;
        }
        .ranking-container {
          flex: 1;
          min-width: 400px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .game-container {
          width: 520px;
          min-width: 520px;
          max-width: 520px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .chat-container {
          flex: 1;
          min-width: 400px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .container-title {
          color: #fff;
          margin-bottom: 20px;
          font-size: 1.4rem;
          text-align: center;
          padding-bottom: 12px;
          border-bottom: 2px solid #333;
        }

        /* 스크롤바 스타일링 */
        .ranking-container::-webkit-scrollbar,
        .chat-container::-webkit-scrollbar {
          width: 8px;
        }
        
        .ranking-container::-webkit-scrollbar-track,
        .chat-container::-webkit-scrollbar-track {
          background: #333;
          border-radius: 4px;
        }
        
        .ranking-container::-webkit-scrollbar-thumb,
        .chat-container::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 4px;
        }
        
        .ranking-container::-webkit-scrollbar-thumb:hover,
        .chat-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <header className="header">
        <div>
          <h2 className="header-title">one more second</h2>
        </div>
      </header>
      
      <main className="main-centered">
        <div className="main-row">
          <div className="container ranking-container">
            <h3 className="container-title">랭킹</h3>
            {/* 랭킹 컴포넌트가 들어갈 자리 */}
          </div>

          <div className="container game-container">
            {Array.isArray(children) ? children.map((child, idx) => (
              <div key={idx}>{child}</div>
            )) : children}
          </div>

          <div className="container chat-container">
            <h3 className="container-title">채팅</h3>
            {/* 채팅 컴포넌트가 들어갈 자리 */}
          </div>
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
