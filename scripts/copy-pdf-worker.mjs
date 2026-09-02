import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs");
const target = path.join(root, "public/pdf.worker.min.mjs");

const polyfill = `if(typeof Promise.withResolvers!=="function"){Promise.withResolvers=function(){var e,t,r=new Promise(function(r,n){e=r;t=n});return{promise:r,resolve:e,reject:t}}};if(typeof Promise.try!=="function"){Promise.try=function(e){var t=Array.prototype.slice.call(arguments,1);return new Promise(function(r,n){try{Promise.resolve(e.apply(null,t)).then(r,n)}catch(e){n(e)}})}};
`;

if (!fs.existsSync(source)) {
  console.warn("[copy-pdf-worker] pdfjs-dist worker not found; skipping.");
  process.exit(0);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, polyfill + fs.readFileSync(source, "utf8"));
console.log(`[copy-pdf-worker] Wrote ${target}`);
