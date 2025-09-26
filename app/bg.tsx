const BgAurora = () => (
  <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: -1 }}>
    <div className="aurora" />
    <style>{`
      .aurora {
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at 20% 50%, rgba(0,255,255,0.5), transparent 50%),
                    radial-gradient(circle at 80% 50%, rgba(255,0,255,0.5), transparent 50%);
        background-size: 200% 200%;
        animation: auroraAnim 10s ease-in-out infinite alternate;
      }
      @keyframes auroraAnim {
        0% { background-position: 0% 0%; }
        100% { background-position: 100% 100%; }
      }
    `}</style>
  </div>
);

export default BgAurora;
