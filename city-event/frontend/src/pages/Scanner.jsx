import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { checkinAPI } from '../utils/api';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

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

      setTimeout(() => {
        setResult(null);
        startScanner();
      }, 3000);
    }
  };

  const onScanError = (err) => {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-deep"
      style={{ minHeight: '100vh' }}
    >
      <Helmet><title>QR Scanner — City Event</title></Helmet>
      <div className="container" style={{ maxWidth: '800px' }}>
        <motion.h1
          className="section-title neon-text-cyan"
          style={{ textAlign: 'center', marginBottom: '3rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          QR CODE SCANNER
        </motion.h1>

        {!scanning && !result && (
          <motion.div
            className="profile-card"
            style={{ textAlign: 'center', border: '2px solid var(--glass-border)' }}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📱</div>
            <h2 style={{ marginBottom: '1rem', color: '#ffffff' }}>Ready to Check In Attendees</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              Scan attendee QR codes to validate tickets and check them in
            </p>
            <button onClick={startScanner} className="btn-primary" aria-label="Start camera scanning" style={{ padding: '1.25rem 3rem', fontSize: '1.1rem' }}>
              Start Scanning
            </button>
          </motion.div>
        )}

        {error && (
          <motion.div
            className="profile-card"
            style={{ textAlign: 'center', border: '2px solid var(--neon-pink)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 style={{ color: 'var(--neon-pink)' }}>⚠️ {error}</h3>
          </motion.div>
        )}

        {scanning && (
          <motion.div
            className="profile-card"
            style={{ border: '2px solid var(--neon-cyan)', boxShadow: '0 0 30px rgba(0, 245, 255, 0.2)', animation: 'glow-pulse 2s ease-in-out infinite' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              id="qr-reader"
              ref={scannerRef}
              style={{
                width: '100%',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}
            />
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p className="neon-text-cyan" style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
                🎯 Position QR code in the frame
              </p>
              <button onClick={stopScanner} className="btn-secondary" aria-label="Stop camera scanning" style={{ padding: '0.75rem 2rem' }}>
                Stop Scanner
              </button>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            className="profile-card"
            style={{
              textAlign: 'center',
              border: `3px solid ${result.success ? 'var(--neon-cyan)' : 'var(--neon-pink)'}`,
              boxShadow: result.success ? '0 0 40px rgba(0, 245, 255, 0.2)' : '0 0 40px rgba(255, 0, 110, 0.2)'
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>
              {result.success ? '✓' : '✗'}
            </div>
            
            <h2 style={{
              color: result.success ? 'var(--neon-cyan)' : 'var(--neon-pink)',
              marginBottom: '1rem',
              fontSize: '2rem'
            }}>
              {result.success ? 'CHECK-IN SUCCESSFUL' : 'INVALID TICKET'}
            </h2>

            {result.success && (
              <>
                <div className="glass-card-static" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '0.5rem', fontWeight: 600 }}>
                    {result.attendee}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>
                    {result.event}
                  </p>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Checked in at {result.time}</p>
              </>
            )}

            {!result.success && (
              <p className="neon-text-pink" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                {result.message}
              </p>
            )}

            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem', marginTop: '1.5rem' }}>
              Resuming scanner in a moment...
            </p>
          </motion.div>
        )}

        <motion.div
          className="profile-card"
          style={{ marginTop: '2rem' }}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--neon-cyan)' }}>
            💡 Scanner Tips
          </h3>
          <ul style={{ color: 'rgba(255,255,255,0.55)', lineHeight: '1.8', paddingLeft: '1.25rem' }}>
            <li>Ensure good lighting for best results</li>
            <li>Hold the QR code steady in the frame</li>
            <li>Keep camera lens clean</li>
            <li>Scanner auto-restarts after each scan</li>
            <li>Valid tickets show green, invalid show red</li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}
