/* Sour Paint Studios Songbook — photo / scanned-page reader (OCR worker).
 *
 * Runs Tesseract (tesseract.js-core 5.1.1, LSTM engine, Apache-2.0) with
 * the tessdata_fast English model, entirely from files published next to
 * the app. Nothing is fetched from the internet: the artifact sandbox
 * blocks every runtime download a CDN-loaded OCR library would make,
 * which is why photo import never worked when this came from a CDN.
 *
 * Protocol (postMessage):
 *   in:  { id, bytes: ArrayBuffer }        encoded PNG/JPEG image
 *   out: { id, type: 'status', status }     human-readable stage
 *        { id, type: 'progress', progress } 0..1 while recognizing
 *        { id, type: 'done', text }
 *        { id, type: 'error', message }
 */
'use strict';

var Module = null;
var api = null;
var ready = null;
var currentId = null;

function post(msg) {
  msg.id = currentId;
  self.postMessage(msg);
}

function b64ToBytes(b64) {
  var bin = atob(b64);
  var out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function init() {
  if (ready) return ready;
  ready = new Promise(function (resolve, reject) {
    try {
      if (typeof WebAssembly !== 'object') throw new Error('This browser cannot run the image reader (no WebAssembly).');
      post({ type: 'status', status: 'Starting image reader…' });
      importScripts('vendor-tesseract-core-lstm.wasm.js');
      if (typeof self.TesseractCore !== 'function') throw new Error('Image reader engine did not load.');
      self.TesseractCore({
        TesseractProgress: function (percent) {
          post({ type: 'progress', progress: Math.max(0, Math.min(1, (percent - 30) / 70)) });
        }
      }).then(function (m) {
        Module = m;
        post({ type: 'status', status: 'Loading English reading data…' });
        importScripts('vendor-eng-traineddata.js');
        var data = b64ToBytes(self.SPS_ENG_TRAINEDDATA);
        self.SPS_ENG_TRAINEDDATA = null;
        Module.FS.writeFile('./eng.traineddata', data);
        data = null;
        api = new Module.TessBaseAPI();
        // OEM 1 = LSTM only (the only model in tessdata_fast).
        var status = api.Init(null, 'eng', 1);
        if (status === -1) throw new Error('Image reader could not load its English data.');
        // One uniform block of text, top to bottom — a lyric/chord sheet.
        api.SetVariable('tessedit_pageseg_mode', '6');
        // Keep runs of spaces so chords stay roughly over their words.
        api.SetVariable('preserve_interword_spaces', '1');
        resolve();
      }).catch(function (err) {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
  ready.catch(function () { ready = null; });
  return ready;
}

// EXIF orientation tag sniff (same approach tesseract.js uses). The app
// already sends upright, canvas-normalized PNGs, so this is a fallback.
function exifOrientation(bytes) {
  var head = Array.prototype.slice.call(bytes.subarray(0, 500)).join(' ');
  var m = head.match(/1 18 0 3 0 0 0 1 0 (\d)/);
  return m ? parseInt(m[1], 10) || 1 : 1;
}

function median(arr) {
  if (!arr.length) return 0;
  var s = arr.slice().sort(function (a, b) { return a - b; });
  return s[Math.floor(s.length / 2)];
}

// Tesseract's own blank lines follow pixel gaps loosely and drift (fake
// breaks inside a verse, real verse breaks lost). Rebuild the text from
// each recognized line's position instead: a blank line only where the
// gap above a line is clearly bigger than the page's normal line gap.
function textFromLines() {
  var RIL = Module.RIL_TEXTLINE;
  var ri = api.GetIterator();
  if (!ri) return null;
  var lines = [];
  ri.Begin();
  do {
    var t = ri.GetUTF8Text(RIL);
    var bb = ri.getBoundingBox(RIL);
    if (t != null && bb) {
      var clean = String(t).replace(/\s+$/g, '');
      if (clean.trim()) lines.push({ text: clean, y0: bb.y0, y1: bb.y1 });
    }
  } while (ri.Next(RIL));
  try { if (Module.destroy) Module.destroy(ri); } catch (err) {}
  if (!lines.length) return '';
  var heights = lines.map(function (l) { return l.y1 - l.y0; });
  var gaps = [];
  for (var i = 1; i < lines.length; i++) gaps.push(Math.max(0, lines[i].y0 - lines[i - 1].y1));
  var h = median(heights) || 1;
  var g = median(gaps);
  var out = [lines[0].text];
  for (var j = 1; j < lines.length; j++) {
    if (gaps[j - 1] > g + 0.75 * h) out.push('');
    out.push(lines[j].text);
  }
  return out.join('\n');
}

self.onmessage = function (e) {
  var msg = e.data || {};
  currentId = msg.id;
  var bytes = new Uint8Array(msg.bytes || new ArrayBuffer(0));
  init().then(function () {
    post({ type: 'status', status: 'Reading the page…' });
    Module.FS.writeFile('/input', bytes);
    var res = api.SetImageFile(exifOrientation(bytes), 0);
    if (res === 1) throw new Error('That image format could not be read. Try a JPG or PNG.');
    api.Recognize(null);
    var text = null;
    try { text = textFromLines(); } catch (err) { text = null; }
    if (text == null) {
      // Fallback: plain text with Tesseract's single blank lines dropped.
      text = (api.GetUTF8Text() || '').replace(/\n[ \t]*\n(?![ \t]*\n)/g, '\n');
    }
    api.Clear();
    try { Module.FS.unlink('/input'); } catch (err) {}
    post({ type: 'done', text: text });
  }).catch(function (err) {
    post({ type: 'error', message: (err && err.message) ? err.message : String(err) });
  });
};
