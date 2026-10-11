// Inject report JSON into the dashboard template.
// Escapes "<" and JS line separators so data can never close the <script> tag or break the literal (OWASP A03).
import fs from 'node:fs';

const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const [tpl, rep, out] = process.argv.slice(2);
const data = JSON.stringify(JSON.parse(fs.readFileSync(rep, 'utf8')))
  .replaceAll('<', '\\u003c')
  .replaceAll(LS, '\\u2028')
  .replaceAll(PS, '\\u2029');
fs.writeFileSync(out, fs.readFileSync(tpl, 'utf8').replace('/*DATA*/null', () => data));
