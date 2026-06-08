import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { checkinAPI } from '../utils/api';

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setScanning(true);
      setError('');
      setResult(null);

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanError
      );
    } catch (err) {
      setError('Failed to start camera. Please grant camera permissions.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    // Stop scanning immediately
    await stopScanner();

    try {
      const response = await checkinAPI.scan(decodedText);
      
      setResult({
        success: true,
        message: response.message,
        attendee: response.registration.user.fullName,
        event: response.registration.event.title,
        time: new Date().toLocaleTimeString()
      });

      // Auto-clear after 3 seconds and restart scanner
      setTimeout(() => {
        setResult(null);
        startScanner();
      }, 3000);
    } catch (err) {
      setResult({
        success: false,
        message: err.message || 'Invalid ticket',
        time: new Date().toLocaleTimeString()
      });

      // Auto-clear after 3 seconds and restart scanner
      setTimeout(() => {
        setResult(null);
        startScanner();
      }, 3000);
    }
  };

  const onScanError = (err) => {
    // Ignore scanning errors (happens frequently while scanning)
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--deep-black)',
      padding: 'var(--spacing-md)'
    }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ 
          textAlign: 'center',
          marginBottom: 'var(--spacing-xl)',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          color: 'var(--pure-white)'
        }}>
          QR CODE SCANNER
        </h1>

        {/* Instructions */}
        {!scanning && !result && (
          <div style={{
            background: 'var(--dark-gray)',
            padding: 'var(--spacing-xl)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--spacing-lg)',
            textAlign: 'center',
            border: '2px solid var(--medium-gray)',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>
              📱
            </div>
            <h2 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--pure-white)' }}>
              Ready to Check In Attendees
            </h2>
            <p style={{ 
              color: 'var(--light-gray)',
              marginBottom: 'var(--spacing-lg)',
              fontSize: '1.1rem'
            }}>
              Scan attendee QR codes to validate tickets and check them in
            </p>
            <button
              onClick={startScanner}
              className="btn-primary"
              style={{ 
                padding: '1.25rem 3rem',
                fontSize: '1.1rem'
              }}
            >
              Start Scanning
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(219, 39, 119, 0.1)',
            border: '2px solid #db2777',
            color: '#db2777',
            padding: 'var(--spacing-lg)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-lg)',
            textAlign: 'center'
          }}>
            <h3>⚠️ {error}</h3>
          </div>
        )}

        {/* Scanner View */}
        {scanning && (
          <div style={{
            background: 'var(--dark-gray)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--neon-cyan)',
            boxShadow: '0 0 30px rgba(0, 245, 255, 0.2)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            <div 
              id="qr-reader" 
              ref={scannerRef}
              style={{ 
                width: '100%',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}
            />
            
            <div style={{ 
              textAlign: 'center',
              marginTop: 'var(--spacing-md)'
            }}>
              <p style={{ 
                color: 'var(--neon-cyan)',
                marginBottom: 'var(--spacing-md)',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                🎯 Position QR code in the frame
              </p>
              <button
                onClick={stopScanner}
                className="btn-secondary"
                style={{ padding: '0.75rem 2rem' }}
              >
                Stop Scanner
              </button>
            </div>
          </div>
        )}

        {/* Scan Result */}
        {result && (
          <div style={{
            background: result.success 
              ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.1), rgba(2, 132, 199, 0.02))'
              : 'linear-gradient(135deg, rgba(219, 39, 119, 0.1), rgba(219, 39, 119, 0.02))',
            border: `3px solid ${result.success ? 'var(--neon-cyan)' : 'var(--neon-pink)'}`,
            padding: 'var(--spacing-xl)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease-out',
            boxShadow: result.success 
              ? '0 0 40px rgba(2, 132, 199, 0.2)'
              : '0 0 40px rgba(219, 39, 119, 0.2)'
          }}>
            <div style={{ 
              fontSize: '5rem',
              marginBottom: 'var(--spacing-md)'
            }}>
              {result.success ? '✓' : '✗'}
            </div>
            
            <h2 style={{ 
              color: result.success ? '#0284c7' : '#db2777',
              marginBottom: 'var(--spacing-md)',
              fontSize: '2rem'
            }}>
              {result.success ? 'CHECK-IN SUCCESSFUL' : 'INVALID TICKET'}
            </h2>

            {result.success && (
              <>
                <div style={{
                  background: 'var(--medium-gray)',
                  padding: 'var(--spacing-lg)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <p style={{ 
                    fontSize: '1.5rem',
                    color: 'var(--pure-white)',
                    marginBottom: 'var(--spacing-sm)',
                    fontWeight: '600'
                  }}>
                    {result.attendee}
                  </p>
                  <p style={{ 
                    color: 'var(--light-gray)',
                    fontSize: '1.1rem'
                  }}>
                    {result.event}
                  </p>
                </div>
                <p style={{ color: 'var(--light-gray)' }}>
                  Checked in at {result.time}
                </p>
              </>
            )}

            {!result.success && (
              <p style={{ 
                color: 'var(--neon-pink)',
                fontSize: '1.1rem',
                marginBottom: 'var(--spacing-md)'
              }}>
                {result.message}
              </p>
            )}

            <p style={{ 
              color: 'var(--light-gray)',
              fontSize: '0.9rem',
              marginTop: 'var(--spacing-lg)'
            }}>
              Resuming scanner in a moment...
            </p>
          </div>
        )}

        {/* Scanner Tips */}
        <div style={{
          background: 'var(--dark-gray)',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-md)',
          marginTop: 'var(--spacing-xl)',
          border: '1px solid var(--medium-gray)'
        }}>
          <h3 style={{ 
            marginBottom: 'var(--spacing-md)',
            fontSize: '1.2rem',
            color: 'var(--neon-cyan)'
          }}>
            💡 Scanner Tips
          </h3>
          <ul style={{ 
            color: 'var(--light-gray)',
            lineHeight: '1.8',
            paddingLeft: 'var(--spacing-md)'
          }}>
            <li>Ensure good lighting for best results</li>
            <li>Hold the QR code steady in the frame</li>
            <li>Keep camera lens clean</li>
            <li>Scanner auto-restarts after each scan</li>
            <li>Valid tickets show green, invalid show red</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
