"use client";

import { useState } from 'react';
import { useAppStore } from '../../src/state/store';
import { encryptObject, decryptObject } from '../../src/utils/crypto';

export default function SyncPage() {
  const exportSnapshot = useAppStore((s) => s.exportSnapshot);
  const importSnapshot = useAppStore((s) => s.importSnapshot);
  const [json, setJson] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [pass, setPass] = useState<string>("");

  const onExport = async () => {
    const snap = await exportSnapshot();
    if (pass) {
      const enc = await encryptObject(snap, pass);
      setJson(enc);
      setStatus('Exported encrypted snapshot.');
    } else {
      setJson(JSON.stringify(snap, null, 2));
      setStatus('Exported current snapshot.');
    }
  };

  const onImport = async () => {
    try {
      if (json.startsWith('enc:v1:')) {
        if (!pass) return setStatus('Enter passphrase to decrypt.');
        const obj = await decryptObject(json, pass);
        await importSnapshot(obj as any);
        setStatus('Imported encrypted snapshot.');
      } else {
        const parsed = JSON.parse(json);
        await importSnapshot(parsed);
        setStatus('Imported snapshot.');
      }
    } catch (e) {
      setStatus('Invalid payload or wrong passphrase.');
    }
  };

  return (
    <main>
      <h1>Sync (local snapshot)</h1>
      <p style={{ color: 'var(--muted)' }}>Export or import a local snapshot (MVP sync scaffolding).</p>
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        <button onClick={onExport} style={{ padding: '6px 10px', borderRadius: 8, border: 0, background: 'var(--accent)', color: 'var(--accent-contrast)', cursor: 'pointer' }}>Export</button>
        <button onClick={onImport} style={{ padding: '6px 10px', borderRadius: 8, border: 0, background: '#374151', color: 'var(--text)', cursor: 'pointer' }}>Import</button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
        <label>
          <span>Passphrase (optional E2EE)</span>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
      </div>
      {status && <p style={{ color: 'var(--muted)' }}>{status}</p>}
      <textarea value={json} onChange={(e) => setJson(e.target.value)} style={{ width: '100%', height: 240, marginTop: 8, background: 'transparent', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 8 }} />
    </main>
  );
}


