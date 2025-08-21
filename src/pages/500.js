// Custom 500 page
export default function Custom500() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>500 - Server Error</h1>
      <p>Something went wrong on our end.</p>
      <a href="/" style={{ marginTop: '20px', color: '#0070f3' }}>
        Return to Home
      </a>
    </div>
  );
}
