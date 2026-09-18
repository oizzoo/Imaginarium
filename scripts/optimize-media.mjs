// Run with an untouched source checkout: node scripts/optimize-media.mjs <source>
// Requires FFmpeg with libx264/libwebp. Validated with FFmpeg 9.0.
import { copyFileSync, mkdtempSync, realpathSync, rmdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw new Error('Pass a separate directory with the original media.');
const source = realpathSync(process.argv[2]);
if (source === realpathSync(root)) throw new Error('Use original media, not this output checkout.');
const files = [
  ['video/BANER_PION_PL.mp4', 'video/BANER_PION_PL.mp4'],
  ['video/BANER_PION_EN.mp4', 'video/BANER_PION_EN.mp4'],
  ['images/Opowiadanie.png', 'images/story.webp'],
  ['images/Grafikaskrócony.png', 'images/scenario-summary.webp'],
  ['images/Moto.jpg', 'images/about.webp'],
  ['images/Diagram2.jpg', 'images/diagram-2.webp'],
  ['images/background-notes-hd.png', 'images/notes.webp'],
];
const scratch = mkdtempSync(join(tmpdir(), 'imaginarium-media-'));
try {
  for (const [input, output] of files) {
    const temporary = join(scratch, basename(output));
    const options = output.endsWith('.mp4')
      ? ['-map', '0:v:0', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24',
         '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart']
      : ['-frames:v', '1', '-vf', "scale=min(1200\\,iw):-1", '-c:v', 'libwebp', '-quality', '85'];
    const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error',
      '-n', '-i', join(source, input), ...options, temporary], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`FFmpeg failed: ${input}`);
    copyFileSync(temporary, join(root, output));
    unlinkSync(temporary);
    console.log(output);
  }
} finally {
  // No recursive cleanup: preserve incomplete output for diagnosis on failure.
  try { rmdirSync(scratch); } catch {}
}
