# QRBlast

QRBlast is an offline-first Progressive Web App for transferring real files between nearby screens using animated multi-QR streams.

**MADE BY VAISHAL ANIL**

## What it does

- Encodes the selected file into real binary QR payloads.
- Splits the transfer across 1, 2, 4, 6, 8, or 10 QR streams.
- Includes transfer ID, stream ID, frame number, chunk index, payload, and CRC32 in every frame.
- Detects QR codes from a camera using a continuous 5 × 2 scan grid.
- Reconstructs the received file byte-for-byte.
- Verifies SHA-256 before making the file available to save.
- Stores the last 20 verified transfers in IndexedDB.
- Works offline after the app shell has been opened and cached.
- Supports clipboard text and URL transfers by wrapping them as real files.
- Includes a fullscreen QR grid for large monitors and phone-friendly responsive layouts.
- Starts each QR broadcast with a visible three-second countdown.
- Allows the sender to restart the live QR stream from frame 0 without reselecting the file.
- Uses a bidirectional optical control channel: the receiver displays ACK/progress QR frames and the sender camera reads them.
- Verifies position by requiring repeated metadata detection before locking the optical link.

No server, account, analytics, or cloud storage is used during a transfer.

## Run locally

```bash
npm install
npm run dev
```

Open the local HTTPS development URL on both devices where camera permissions are needed. For a production preview:

```bash
npm run build
npm run preview
```

Camera access requires a secure context: HTTPS or localhost. The sender and receiver must be able to see each other’s screen; no network connection between devices is required.

## Transfer flow

1. Open **Send** on the source device and choose a file, or paste text/URL.
2. Open **Receive** on the destination device and allow camera access.
3. Position the receiver camera toward the sender screen.
4. Press **Start transfer** on the sender.
5. Wait for the three-second sender countdown to finish.
6. Press **Start scanning** on the receiver.
7. Keep the QR grid visible until the receiver reports SHA-256 verification.

The sender does not generate QR frames before Start transfer.

## Face-to-face optical link

For synchronized progress and ACKs, position the devices screen-to-camera in both directions:

```text
screen A  →  camera B
camera A  ←  screen B
```

The sender displays data QR frames and opens its front-facing camera to read the receiver’s acknowledgement QR. The receiver displays a small status QR containing transfer ID, received chunk count, byte progress, and completion state. Three repeated metadata detections lock the position before the receiver reports a verified optical link.

## Architecture

```text
src/
  App.tsx       Responsive sender, receiver, camera, and fullscreen UI
  protocol.ts   Frame format, CRC32, chunking, SHA-256, reconstruction
  storage.ts    IndexedDB history persistence
  main.tsx      React bootstrap and service-worker registration
public/
  sw.js         Offline cache-first service worker
```

### Frame protocol

Frames are JSON encoded into QR symbols. Each frame has:

```ts
{
  v: 1,
  t: "transfer-id",
  s: 0,
  f: 42,
  n: 100,
  i: 42,
  d: "base64 payload",
  c: 1234567890,
  p: "data"
}
```

The metadata frame carries the original filename, MIME type, byte size, device identity, timestamp, stream count, chunk count, and SHA-256 digest. Data frames are de-duplicated by chunk index, validated with CRC32, reconstructed in index order, and rejected if the final SHA-256 digest does not match.

## Browser support

Use a current Chrome, Edge, Safari, or Firefox release. Camera capture requires `navigator.mediaDevices.getUserMedia`; IndexedDB and Web Crypto are required for persistence and integrity verification.

## Current scope

The core transfer path is complete for real files, clipboard text, and URLs. Reed–Solomon parity and optional AES-256-GCM encryption are intentionally isolated as protocol extensions for a future version; the current protocol never presents an unverified file as complete.



